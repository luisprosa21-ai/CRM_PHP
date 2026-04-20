'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { requestLogger, logger } = require('./middleware/requestLogger');
const { errorHandler } = require('./middleware/errorHandler');
const notificationService = require('./adapters/notification/notificationService');

// Route modules
const portalRoutes = require('./routes/portalRoutes');
const crmRoutes = require('./routes/crmRoutes');
const bankRoutes = require('./routes/bankRoutes');
const backofficeRoutes = require('./routes/backofficeRoutes');

const app = express();

// ─── SECURITY ─────────────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    //origin: [config.cors.origins],
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    credentials: true,
  })
);

// ─── LOGGING ──────────────────────────────────────────────────────────────────
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}
app.use(requestLogger);

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests, please try again later' } },
  })
);

// ─── BODY PARSING ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'crm-hipotecario-bff',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// ─── MOUNT ROUTES ─────────────────────────────────────────────────────────────
app.use('/portal', portalRoutes);
app.use('/crm', crmRoutes);
app.use('/banks', bankRoutes);
app.use('/backoffice', backofficeRoutes);


// ─── 404 HANDLER ──────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  err.code = 'NOT_FOUND';
  next(err);
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── INITIALISE SERVICES ──────────────────────────────────────────────────────
notificationService.init();

// ─── START SERVER ─────────────────────────────────────────────────────────────
let server;
if (require.main === module) {
  server = app.listen(config.port, () => {
    logger.info(`BFF server running on port ${config.port} [${config.nodeEnv}]`);
  });
}

// ─── GRACEFUL SHUTDOWN ────────────────────────────────────────────────────────
function gracefulShutdown(signal) {
  logger.info(`${signal} received – shutting down gracefully`);
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    // Force exit after 10 s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: reason?.message || reason });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

console.log('CRM Hipotecario BFF server initialized');

// Export for testing
module.exports = app;
