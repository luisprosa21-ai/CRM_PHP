'use strict';

require('dotenv').config();

/**
 * Centralized configuration object.
 * Reads all settings from environment variables with sensible defaults.
 */
const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  phpBackendUrl: process.env.PHP_BACKEND_URL || 'http://localhost:8000',

  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-here',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10) || 300,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },

  sms: {
    apiKey: process.env.SMS_API_KEY || '',
    apiUrl: process.env.SMS_API_URL || '',
  },

  bank: {
    apiTimeout: parseInt(process.env.BANK_API_TIMEOUT, 10) || 30000,
  },

  document: {
    storagePath: process.env.DOCUMENT_STORAGE_PATH || './storage',
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
  },

  cors: {
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:5173'],
  },
};

module.exports = config;
