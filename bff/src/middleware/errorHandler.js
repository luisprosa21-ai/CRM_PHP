'use strict';

const winston = require('winston');
const config = require('../config');

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

/**
 * Base application error with HTTP status code.
 */
class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   * @param {string} [code]
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/** 400 – Validation error */
class ValidationError extends AppError {
  /**
   * @param {string} message
   * @param {Array<{field: string, message: string}>} [errors]
   */
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/** 401 – Authentication error */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

/** 404 – Not found */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Global Express error-handling middleware.
 * Formats every error as a consistent JSON response.
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
function errorHandler(err, req, res, _next) {
  // Determine status code
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  // Build response body
  const body = {
    success: false,
    error: {
      code,
      message: err.message || 'Internal server error',
    },
  };

  // Attach validation details when available
  if (err.errors && Array.isArray(err.errors)) {
    body.error.details = err.errors;
  }

  // Log server errors at error level, client errors at warn level
  const logMeta = {
    statusCode,
    method: req.method,
    url: req.originalUrl,
    requestId: req.requestId,
  };

  if (statusCode >= 500) {
    logger.error(err.message, { ...logMeta, stack: err.stack });
  } else {
    logger.warn(err.message, logMeta);
  }

  // In production, hide internal details for 5xx errors
  if (statusCode >= 500 && config.nodeEnv === 'production') {
    body.error.message = 'Internal server error';
    delete body.error.details;
  }

  res.status(statusCode).json(body);
}

module.exports = {
  errorHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
};
