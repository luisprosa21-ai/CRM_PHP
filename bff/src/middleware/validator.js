'use strict';

const { ValidationError } = require('./errorHandler');

/**
 * Supported type checks.
 * @param {*} value
 * @param {string} type
 * @returns {boolean}
 */
function checkType(value, type) {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !Number.isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return value !== null && typeof value === 'object' && !Array.isArray(value);
    default:
      return true;
  }
}

/**
 * Format validators for common patterns.
 */
const FORMAT_VALIDATORS = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  phone: (v) => /^\+?[\d\s\-()]{7,20}$/.test(v),
  url: (v) => /^https?:\/\/.+/.test(v),
  date: (v) => !Number.isNaN(Date.parse(v)),
  uuid: (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
};

/**
 * Creates a validation middleware from a schema definition.
 *
 * Schema format:
 * ```
 * {
 *   fieldName: {
 *     required: true,
 *     type: 'string',           // string | number | boolean | array | object
 *     format: 'email',          // email | phone | url | date | uuid
 *     minLength: 1,
 *     maxLength: 255,
 *     min: 0,
 *     max: 100,
 *     enum: ['a', 'b'],
 *   }
 * }
 * ```
 *
 * @param {Object} schema - Validation schema object.
 * @returns {import('express').RequestHandler}
 */
function validate(schema) {
  return (req, _res, next) => {
    const errors = [];
    const body = req.body || {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];

      // Required check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }

      // Skip further checks if optional and not present
      if (value === undefined || value === null) {
        continue;
      }

      // Type check
      if (rules.type && !checkType(value, rules.type)) {
        errors.push({ field, message: `${field} must be of type ${rules.type}` });
        continue;
      }

      // String-specific validations
      if (typeof value === 'string') {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push({ field, message: `${field} must be at least ${rules.minLength} characters` });
        }
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push({ field, message: `${field} must be at most ${rules.maxLength} characters` });
        }
        if (rules.format && FORMAT_VALIDATORS[rules.format]) {
          if (!FORMAT_VALIDATORS[rules.format](value)) {
            errors.push({ field, message: `${field} must be a valid ${rules.format}` });
          }
        }
      }

      // Number-specific validations
      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push({ field, message: `${field} must be at least ${rules.min}` });
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push({ field, message: `${field} must be at most ${rules.max}` });
        }
      }

      // Enum check
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({ field, message: `${field} must be one of: ${rules.enum.join(', ')}` });
      }
    }

    if (errors.length > 0) {
      return next(new ValidationError('Validation failed', errors));
    }

    next();
  };
}

module.exports = { validate };
