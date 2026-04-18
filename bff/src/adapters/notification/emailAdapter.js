'use strict';

const config = require('../../config');
const { logger } = require('../../middleware/requestLogger');

/**
 * Email notification adapter.
 * Uses configurable SMTP settings (simulated for development).
 */
const emailAdapter = {
  /**
   * Send an email notification.
   * @param {Object} options
   * @param {string} options.to - Recipient email address.
   * @param {string} options.subject - Email subject line.
   * @param {string} options.body - Plain text or HTML body.
   * @param {string} [options.template] - Optional template identifier.
   * @returns {Promise<Object>} Send result.
   */
  async send({ to, subject, body, template }) {
    if (!to || !subject) {
      throw new Error('Email requires "to" and "subject" fields');
    }

    logger.info('Sending email', {
      to,
      subject,
      template: template || 'none',
      smtp: config.smtp.host,
    });

    // Simulated SMTP send – in production, integrate with nodemailer or similar
    const result = {
      success: true,
      channel: 'email',
      to,
      subject,
      template: template || null,
      sentAt: new Date().toISOString(),
      messageId: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };

    logger.info('Email sent successfully', { messageId: result.messageId });
    return result;
  },
};

module.exports = emailAdapter;
