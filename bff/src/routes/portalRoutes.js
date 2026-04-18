'use strict';

const { Router } = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const backendProxy = require('../services/backendProxy');
const cacheService = require('../services/cacheService');
const eventBus = require('../services/eventBus');
const documentProcessor = require('../adapters/document/documentProcessor');

const router = Router();

// Multer config for in-memory file handling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.document.maxFileSize },
});

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────

/**
 * POST /portal/register
 * Register a new client (creates lead + client in the backend).
 */
router.post(
  '/register',
  validate({
    nombre: { required: true, type: 'string', minLength: 2 },
    apellido: { required: true, type: 'string', minLength: 2 },
    email: { required: true, type: 'string', format: 'email' },
    telefono: { required: true, type: 'string', format: 'phone' },
    password: { required: true, type: 'string', minLength: 6 },
  }),
  async (req, res, next) => {
    try {
      // Create lead in backend
      const lead = await backendProxy.post('/api/leads', {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        email: req.body.email,
        telefono: req.body.telefono,
        origen: 'portal_web',
        canal: 'portal',
      });

      // Create client in backend
      const client = await backendProxy.post('/api/clientes', {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        email: req.body.email,
        telefono: req.body.telefono,
        password: req.body.password,
        lead_id: lead.data?.id || lead.id,
      });

      eventBus.emit('lead.created', {
        id: lead.data?.id || lead.id,
        nombre: req.body.nombre,
      });

      // Generate JWT for the new client
      const token = jwt.sign(
        {
          id: client.data?.id || client.id,
          email: req.body.email,
          role: 'cliente',
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.status(201).json({
        success: true,
        data: {
          token,
          client: {
            id: client.data?.id || client.id,
            nombre: req.body.nombre,
            apellido: req.body.apellido,
            email: req.body.email,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /portal/login
 * Authenticate a client.
 */
router.post(
  '/login',
  validate({
    email: { required: true, type: 'string', format: 'email' },
    password: { required: true, type: 'string' },
  }),
  async (req, res, next) => {
    try {
      const result = await backendProxy.post('/api/auth/login', {
        email: req.body.email,
        password: req.body.password,
      });

      const user = result.data || result.user || result;
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role || user.rol || 'cliente',
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({ success: true, data: { token, user: { id: user.id, email: user.email, role: user.role || user.rol } } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── AUTHENTICATED ROUTES ─────────────────────────────────────────────────────

/**
 * GET /portal/profile
 * Get the current client's profile.
 */
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const data = await backendProxy.get(`/api/clientes/${req.user.id}`, req.headers.authorization?.split(' ')[1]);
    res.json({ success: true, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /portal/profile
 * Update client profile.
 */
router.put(
  '/profile',
  authenticateToken,
  validate({
    nombre: { type: 'string', minLength: 2 },
    apellido: { type: 'string', minLength: 2 },
    telefono: { type: 'string', format: 'phone' },
  }),
  async (req, res, next) => {
    try {
      const data = await backendProxy.put(
        `/api/clientes/${req.user.id}`,
        req.body,
        req.headers.authorization?.split(' ')[1]
      );
      res.json({ success: true, data: data.data || data });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /portal/expedientes
 * Get client's expedientes.
 */
router.get('/expedientes', authenticateToken, async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const data = await backendProxy.get(`/api/expedientes?cliente_id=${req.user.id}`, token);
    res.json({ success: true, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /portal/expedientes/:id
 * Get expediente details with offers.
 */
router.get('/expedientes/:id', authenticateToken, async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    // Aggregate expediente + offers in parallel
    const [expediente, offers] = await Promise.all([
      backendProxy.get(`/api/expedientes/${req.params.id}`, token),
      backendProxy.get(`/api/ofertas?expediente_id=${req.params.id}`, token).catch(() => ({ data: [] })),
    ]);

    res.json({
      success: true,
      data: {
        expediente: expediente.data || expediente,
        offers: offers.data || offers || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /portal/documents
 * Upload a document.
 */
router.post('/documents', authenticateToken, upload.single('document'), async (req, res, next) => {
  try {
    const fileMeta = await documentProcessor.processUpload(req.file);
    const token = req.headers.authorization?.split(' ')[1];

    const result = await backendProxy.post(
      '/api/documentos',
      {
        cliente_id: req.user.id,
        expediente_id: req.body.expediente_id,
        tipo: req.body.tipo || 'general',
        nombre_original: fileMeta.originalName,
        nombre_almacenado: fileMeta.storedName,
        ruta: fileMeta.filePath,
        mime_type: fileMeta.mimeType,
        tamano: fileMeta.size,
      },
      token
    );

    eventBus.emit('document.uploaded', {
      id: result.data?.id || result.id,
      clientId: req.user.id,
      fileName: fileMeta.originalName,
    });

    res.status(201).json({ success: true, data: result.data || result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /portal/documents
 * List client's documents.
 */
router.get('/documents', authenticateToken, async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const data = await backendProxy.get(`/api/documentos?cliente_id=${req.user.id}`, token);
    res.json({ success: true, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /portal/notifications
 * Get client notifications.
 */
router.get('/notifications', authenticateToken, async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const data = await backendProxy.get(`/api/notificaciones?usuario_id=${req.user.id}`, token);
    res.json({ success: true, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /portal/notifications/:id/read
 * Mark a notification as read.
 */
router.post('/notifications/:id/read', authenticateToken, async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const data = await backendProxy.put(`/api/notificaciones/${req.params.id}/read`, {}, token);
    res.json({ success: true, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /portal/offers/:expedienteId
 * Get offers for an expediente for comparison.
 */
router.get('/offers/:expedienteId', authenticateToken, async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const cacheKey = `portal:offers:${req.params.expedienteId}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, _cached: true });
    }

    const data = await backendProxy.get(`/api/ofertas?expediente_id=${req.params.expedienteId}`, token);
    const offers = data.data || data || [];
    cacheService.set(cacheKey, offers, 60);

    res.json({ success: true, data: offers });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
