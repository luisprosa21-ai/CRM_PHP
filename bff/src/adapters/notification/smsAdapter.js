'use strict';

const config = require('../../config');
const { logger } = require('../../middleware/requestLogger');

/**
 * SMS notification adapter.
 * Simulates sending SMS via an external API.
 */
const smsAdapter = {
  /**
   * Send an SMS notification.
   * @param {Object} options
   * @param {string} options.to - Recipient phone number.
   * @param {string} options.message - SMS body (max ~160 chars for single segment).
   * @returns {Promise<Object>} Send result.
   */
  async send({ to, message }) {
    if (!to || !message) {
      throw new Error('SMS requires "to" and "message" fields');
    }

    logger.info('Sending SMS', {
      to,
      messageLength: message.length,
      apiUrl: config.sms.apiUrl,
    });

    // Simulated API call – in production, integrate with Twilio, Vonage, etc.
    const result = {
      success: true,
      channel: 'sms',
      to,
      messageLength: message.length,
      segments: Math.ceil(message.length / 160),
      sentAt: new Date().toISOString(),
      messageId: `sms-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };

    logger.info('SMS sent successfully', { messageId: result.messageId });
    return result;
  },
};

module.exports = smsAdapter;
