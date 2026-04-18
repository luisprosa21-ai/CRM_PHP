'use strict';

const { Router } = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const backendProxy = require('../services/backendProxy');
const cacheService = require('../services/cacheService');

const router = Router();

// All backoffice routes require authentication and elevated roles
router.use(authenticateToken);
router.use(requireRole(['admin', 'gerente']));

// ─── REPORTS ──────────────────────────────────────────────────────────────────

/**
 * GET /backoffice/reports/dashboard
 * KPIs dashboard (cached 120s).
 */
router.get('/reports/dashboard', async (req, res, next) => {
  try {
    const cacheKey = 'backoffice:reports:dashboard';
    const cached = cacheService.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, _cached: true });

    const token = req.headers.authorization?.split(' ')[1];

    const [leads, expedientes, offers, clients] = await Promise.all([
      backendProxy.get('/api/reportes/leads', token).catch(() => ({ data: {} })),
      backendProxy.get('/api/reportes/expedientes', token).catch(() => ({ data: {} })),
      backendProxy.get('/api/reportes/ofertas', token).catch(() => ({ data: {} })),
      backendProxy.get('/api/reportes/clientes', token).catch(() => ({ data: {} })),
    ]);

    const dashboard = {
      leads: leads.data || leads,
      expedientes: expedientes.data || expedientes,
      offers: offers.data || offers,
      clients: clients.data || clients,
      generatedAt: new Date().toISOString(),
    };

    cacheService.set(cacheKey, dashboard, 120);
    res.json({ success: true, data: dashboard });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /backoffice/reports/pipeline
 * Pipeline funnel report.
 */
router.get('/reports/pipeline', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const data = await backendProxy.get('/api/reportes/pipeline', token);
    res.json({ success: true, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /backoffice/reports/conversion
 * Conversion analytics.
 */
router.get('/reports/conversion', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const query = new URLSearchParams(req.query).toString();
    const data = await backendProxy.get(`/api/reportes/conversion?${query}`, token);
    res.json({ success: true, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /backoffice/reports/advisors
 * Advisor performance report.
 */
router.get('/reports/advisors', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const query = new URLSearchParams(req.query).toString();
    const data = await backendProxy.get(`/api/reportes/asesores?${query}`, token);
    res.json({ success: true, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

// ─── AUDIT ────────────────────────────────────────────────────────────────────

/**
 * GET /backoffice/audit
 * Audit trail listing.
 */
router.get('/audit', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const query = new URLSearchParams(req.query).toString();
    const data = await backendProxy.get(`/api/auditoria?${query}`, token);
    res.json({ success: true, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /backoffice/audit/:entityType/:entityId
 * Audit history for a specific entity.
 */
router.get('/audit/:entityType/:entityId', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { entityType, entityId } = req.params;
    const data = await backendProxy.get(`/api/auditoria/${entityType}/${entityId}`, token);
    res.json({ success: true, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
