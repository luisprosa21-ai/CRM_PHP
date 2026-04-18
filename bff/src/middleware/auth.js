'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Custom authentication error.
 */
class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

/**
 * Middleware that validates a JWT Bearer token from the Authorization header.
 * On success, attaches the decoded payload to `req.user` and calls next().
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Missing or malformed authorization header'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token has expired'));
    }
    return next(new AuthenticationError('Invalid token'));
  }
}

/**
 * Middleware factory that restricts access to users with specific roles.
 * Must be used AFTER authenticateToken.
 * @param {string[]} roles - Array of allowed role names.
 * @returns {import('express').RequestHandler}
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    const userRole = req.user.role || req.user.rol;
    if (!roles.includes(userRole)) {
      const err = new Error('Insufficient permissions');
      err.name = 'ForbiddenError';
      err.statusCode = 403;
      return next(err);
    }

    next();
  };
}

module.exports = { authenticateToken, requireRole, AuthenticationError };
