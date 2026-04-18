'use strict';

const { Router } = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const backendProxy = require('../services/backendProxy');
const cacheService = require('../services/cacheService');
const eventBus = require('../services/eventBus');

const router = Router();

// All CRM routes require authentication
router.use(authenticateToken);

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

/**
 * GET /crm/dashboard
 * Aggregated dashboard data (cached 60s).
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    const cacheKey = `crm:dashboard:${req.user.id}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, _cached: true });

    const token = req.headers.authorization?.split(' ')[1];

    const [leads, expedientes, tasks, offers] = await Promise.all([
      backendProxy.get('/api/leads?limit=5&sort=-created_at', token).catch(() => ({ data: [] })),
      backendProxy.get('/api/expedientes?limit=5&sort=-created_at', token).catch(() => ({ data: [] })),
      backendProxy.get(`/api/tareas?asignado_a=${req.user.id}&completada=0`, token).catch(() => ({ data: [] })),
      backendProxy.get('/api/ofertas?limit=5&sort=-created_at', token).catch(() => ({ data: [] })),
    ]);

    const dashboard = {
      recentLeads: leads.data || leads,
      recentExpedientes: expedientes.data || expedientes,
      pendingTasks: tasks.data || tasks,
      recentOffers: offers.data || offers,
      generatedAt: new Date().toISOString(),
    };

    cacheService.set(cacheKey, dashboard, 60);
    res.json({ success: true, data: dashboard });
  } catch (err) {
    next(err);
  }
});

// ─── LEADS ────────────────────────────────────────────────────────────────────

/**
 * GET /crm/leads
 * List leads with optional filters.
 */
router.get('/leads', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const query = new URLSearchParams(req.query).toString();
    const data = await backendProxy.get(`/api/leads?${query}`, token);
    res.json({ success: true, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /crm/leads
 * Create a new lead.
 */
router.post(
  '/leads',
  validate({
    nombre: { required: true, type: 'string', minLength: 2 },
    email: { required: true, type: 'string', format: 'email' },
    telefono: { required: true, type: 'string', format: 'phone' },
    origen: { required: true, type: 'string' },
  }),
  async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const data = await backendProxy.post('/api/leads', req.body, token);

      eventBus.emit('lead.created', {
        id: data.data?.id || data.id,
        nombre: req.body.nombre,
      });

      res.status(201).json({ success: true, data: data.data || data });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /crm/leads/:id
 * Lead detail with history.
 */
router.get('/leads/:id', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const [lead, history] = await Promise.all([
      backendProxy.get(`/api/leads/${req.params.id}`, token),
      backendProxy.get(`/api/leads/${req.params.id}/historial`, token).catch(() => ({ data: [] })),
    ]);

    res.json({
      success: true,
      data: {
        lead: lead.data || lead,
        history: history.data || history || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /crm/leads/:id/assign
 * Assign a lead to an advisor.
 */
router.post(
  '/leads/:id/assign',
  requireRole(['admin', 'gerente', 'asesor']),
  validate({ asesor_id: { required: true, type: 'number' } }),
  async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const data = await backendProxy.post(
        `/api/leads/${req.params.id}/asignar`,
        { asesor_id: req.body.asesor_id },
        token
      );
      res.json({ success: true, data: data.data || data });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /crm/leads/:id/qualify
 * Qualify a lead.
 */
router.post(
  '/leads/:id/qualify',
  validate({ calificacion: { required: true, type: 'string' } }),
  async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const data = await backendProxy.post(
        `/api/leads/${req.params.id}/calificar`,
        req.body,
        token
      );
      res.json({ success: true, data: data.data || data });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /crm/leads/:id/convert
 * Convert a lead to client + expediente.
 */
router.post('/leads/:id/convert', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const data = await backendProxy.post(
      `/api/leads/${req.params.id}/convertir`,
      req.body || {},
      token
    );
    res.json({ success: true, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

// ─── CLIENTS ──────────────────────────────────────────────────────────────────

/**
 * GET /crm/clients
 * List clients.
 */
router.get('/clients', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const query = new URLSearchParams(req.query).toString();
    const data = await backendProxy.get(`/api/clientes?${query}`, token);
    res.json({ success: true, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /crm/clients/:id
 * Client 360° view: client data + expedientes + documents + activity.
 */
router.get('/clients/:id', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const id = req.params.id;

    const [client, expedientes, documents, activity] = await Promise.all([
      backendProxy.get(`/api/clientes/${id}`, token),
      backendProxy.get(`/api/expedientes?cliente_id=${id}`, token).catch(() => ({ data: [] })),
      backendProxy.get(`/api/documentos?cliente_id=${id}`, token).catch(() => ({ data: [] })),
      backendProxy.get(`/api/actividades?cliente_id=${id}`, token).catch(() => ({ data: [] })),
    ]);

    res.json({
      success: true,
      data: {
        client: client.data || client,
        expedientes: expedientes.data || expedientes || [],
        documents: documents.data || documents || [],
        activity: activity.data || activity || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── EXPEDIENTES ──────────────────────────────────────────────────────────────

/**
 * GET /crm/expedientes
 * List expedientes (pipeline view).
 */
router.get('/expedientes', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const query = new URLSearchParams(req.query).toString();
    const data = await backendProxy.get(`/api/expedientes?${query}`, token);
    res.json({ success: true, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /crm/expedientes/:id
 * Full expediente detail.
 */
router.get('/expedientes/:id', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const data = await backendProxy.get(`/api/expedientes/${req.params.id}`, token);
    res.json({ success: true, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /crm/expedientes
 * Create an expediente.
 */
router.post(
  '/expedientes',
  validate({
    cliente_id: { required: true, type: 'number' },
    tipo_propiedad: { required: true, type: 'string' },
    monto_solicitado: { required: true, type: 'number', min: 1 },
  }),
  async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const data = await backendProxy.post('/api/expedientes', req.body, token);
      res.status(201).json({ success: true, data: data.data || data });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /crm/expedientes/:id/transition
 * Change expediente status.
 */
router.post(
  '/expedientes/:id/transition',
  validate({ estado: { required: true, type: 'string' } }),
  async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const data = await backendProxy.post(
        `/api/expedientes/${req.params.id}/transicion`,
        req.body,
        token
      );

      eventBus.emit('expediente.statusChanged', {
        id: req.params.id,
        newStatus: req.body.estado,
      });

      res.json({ success: true, data: data.data || data });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /crm/expedientes/:id/score
 * Calculate credit score for an expediente.
 */
router.post('/expedientes/:id/score', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const data = await backendProxy.post(
      `/api/expedientes/${req.params.id}/scoring`,
      req.body || {},
      token
    );
    res.json({ success: true, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

// ─── TASKS ────────────────────────────────────────────────────────────────────

/**
 * GET /crm/tasks
 * List tasks.
 */
router.get('/tasks', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const query = new URLSearchParams(req.query).toString();
    const data = await backendProxy.get(`/api/tareas?${query}`, token);
    res.json({ success: true, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /crm/tasks
 * Create a task.
 */
router.post(
  '/tasks',
  validate({
    titulo: { required: true, type: 'string' },
    descripcion: { type: 'string' },
    asignado_a: { required: true, type: 'number' },
  }),
  async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const data = await backendProxy.post('/api/tareas', req.body, token);
      res.status(201).json({ success: true, data: data.data || data });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /crm/tasks/:id/complete
 * Mark task as completed.
 */
router.post('/tasks/:id/complete', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const data = await backendProxy.post(
      `/api/tareas/${req.params.id}/completar`,
      req.body || {},
      token
    );
    res.json({ success: true, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

// ─── OFFERS ───────────────────────────────────────────────────────────────────

/**
 * GET /crm/offers/:expedienteId
 * List offers for an expediente.
 */
router.get('/offers/:expedienteId', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const data = await backendProxy.get(`/api/ofertas?expediente_id=${req.params.expedienteId}`, token);
    res.json({ success: true, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /crm/offers
 * Register an offer.
 */
router.post(
  '/offers',
  validate({
    expediente_id: { required: true, type: 'number' },
    banco: { required: true, type: 'string' },
    tasa_interes: { required: true, type: 'number' },
  }),
  async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const data = await backendProxy.post('/api/ofertas', req.body, token);

      eventBus.emit('offer.received', {
        id: data.data?.id || data.id,
        bankName: req.body.banco,
        expedienteId: req.body.expediente_id,
      });

      res.status(201).json({ success: true, data: data.data || data });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
