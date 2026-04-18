'use strict';

const { logger } = require('../../middleware/requestLogger');

/**
 * Push notification adapter.
 * Simulates sending push notifications (e.g. via Firebase Cloud Messaging).
 */
const pushAdapter = {
  /**
   * Send a push notification.
   * @param {Object} options
   * @param {string} options.userId - Target user identifier.
   * @param {string} options.title - Notification title.
   * @param {string} options.body - Notification body text.
   * @returns {Promise<Object>} Send result.
   */
  async send({ userId, title, body }) {
    if (!userId || !title) {
      throw new Error('Push notification requires "userId" and "title" fields');
    }

    logger.info('Sending push notification', { userId, title });

    // Simulated push send – in production, integrate with FCM / APNs
    const result = {
      success: true,
      channel: 'push',
      userId,
      title,
      sentAt: new Date().toISOString(),
      messageId: `push-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };

    logger.info('Push notification sent successfully', { messageId: result.messageId });
    return result;
  },
};

module.exports = pushAdapter;
