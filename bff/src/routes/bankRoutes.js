'use strict';

const { Router } = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const BankAdapterFactory = require('../adapters/bank/BankAdapterFactory');
const backendProxy = require('../services/backendProxy');
const eventBus = require('../services/eventBus');

const router = Router();

/**
 * GET /banks/available
 * List all available bank adapters.
 */
router.get('/available', (req, res) => {
  const banks = BankAdapterFactory.listAvailable();
  res.json({ success: true, data: banks });
});

/**
 * POST /banks/submit/:bankId
 * Submit an expediente to a specific bank.
 */
router.post(
  '/submit/:bankId',
  authenticateToken,
  requireRole(['admin', 'gerente', 'asesor']),
  validate({ expediente_id: { required: true, type: 'number' } }),
  async (req, res, next) => {
    try {
      const adapter = BankAdapterFactory.getAdapter(req.params.bankId);
      const token = req.headers.authorization?.split(' ')[1];

      // Fetch full expediente data from PHP backend
      const expedienteRes = await backendProxy.get(`/api/expedientes/${req.body.expediente_id}`, token);
      const expedienteData = expedienteRes.data || expedienteRes;

      // Submit to bank adapter
      const result = await adapter.submitApplication(expedienteData);

      // Persist the offer/submission in backend
      await backendProxy.post(
        '/api/ofertas',
        {
          expediente_id: req.body.expediente_id,
          banco: adapter.bankName,
          banco_id: adapter.bankId,
          application_id: result.applicationId,
          estado: result.status,
          tasa_interes: result.interestRate,
          cuota_mensual: result.monthlyPayment,
        },
        token
      ).catch(() => {});

      eventBus.emit('offer.received', {
        id: result.applicationId,
        bankName: adapter.bankName,
        expedienteId: req.body.expediente_id,
      });

      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /banks/status/:applicationId
 * Check the status of a bank application.
 */
router.get('/status/:applicationId', authenticateToken, async (req, res, next) => {
  try {
    const bankId = req.query.bank_id;
    if (!bankId) {
      const err = new Error('bank_id query parameter is required');
      err.statusCode = 400;
      throw err;
    }

    const adapter = BankAdapterFactory.getAdapter(bankId);
    const result = await adapter.getOfferStatus(req.params.applicationId);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /banks/webhook
 * Receive bank callbacks/webhooks.
 * Banks may call this endpoint to notify about application status changes.
 */
router.post('/webhook', async (req, res, next) => {
  try {
    const { bank_id, application_id, status, data } = req.body;

    if (!bank_id || !application_id) {
      const err = new Error('bank_id and application_id are required');
      err.statusCode = 400;
      throw err;
    }

    // Update offer status in backend
    await backendProxy.post('/api/ofertas/webhook', {
      banco_id: bank_id,
      application_id,
      estado: status,
      datos: data,
    }).catch(() => {});

    eventBus.emit('offer.received', {
      id: application_id,
      bankId: bank_id,
      status,
    });

    res.json({ success: true, message: 'Webhook processed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
