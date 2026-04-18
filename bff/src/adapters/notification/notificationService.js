'use strict';

const emailAdapter = require('./emailAdapter');
const smsAdapter = require('./smsAdapter');
const pushAdapter = require('./pushAdapter');
const eventBus = require('../../services/eventBus');
const { logger } = require('../../middleware/requestLogger');

/**
 * Channel adapters map.
 * @type {Object<string, {send: Function}>}
 */
const CHANNELS = {
  email: emailAdapter,
  sms: smsAdapter,
  push: pushAdapter,
};

/**
 * Notification orchestration service.
 * Dispatches notifications across configured channels and
 * auto-sends on specific event bus events.
 */
const notificationService = {
  /**
   * Send a notification via the specified channel.
   * @param {Object} options
   * @param {string} options.userId - Target user ID.
   * @param {string} options.type - Notification type (e.g. 'lead_assigned', 'offer_received').
   * @param {string} options.channel - Delivery channel: 'email' | 'sms' | 'push'.
   * @param {string} [options.to] - Recipient address (email or phone). Required for email/sms.
   * @param {string} [options.subject] - Email subject.
   * @param {string} options.message - Message body.
   * @returns {Promise<Object>} Delivery result.
   */
  async sendNotification({ userId, type, channel, to, subject, message }) {
    const adapter = CHANNELS[channel];
    if (!adapter) {
      throw new Error(`Unknown notification channel: ${channel}. Available: ${Object.keys(CHANNELS).join(', ')}`);
    }

    logger.info('Dispatching notification', { userId, type, channel });

    let result;
    switch (channel) {
      case 'email':
        result = await adapter.send({ to, subject: subject || type, body: message });
        break;
      case 'sms':
        result = await adapter.send({ to, message });
        break;
      case 'push':
        result = await adapter.send({ userId, title: subject || type, body: message });
        break;
      default:
        throw new Error(`Unhandled channel: ${channel}`);
    }

    return { ...result, type, userId };
  },

  /**
   * Initialize event-driven notifications.
   * Listens to eventBus events and dispatches notifications automatically.
   */
  init() {
    eventBus.on('lead.created', async (data) => {
      logger.info('Auto-notification: lead.created', { leadId: data.id });
      if (data.assignedToEmail) {
        await notificationService.sendNotification({
          userId: data.assignedTo,
          type: 'lead_created',
          channel: 'email',
          to: data.assignedToEmail,
          subject: 'Nuevo lead asignado',
          message: `Se te ha asignado un nuevo lead: ${data.nombre || 'N/A'}`,
        }).catch((err) => logger.error('Auto-notification failed', { error: err.message }));
      }
    });

    eventBus.on('expediente.statusChanged', async (data) => {
      logger.info('Auto-notification: expediente.statusChanged', { expedienteId: data.id });
      if (data.clientEmail) {
        await notificationService.sendNotification({
          userId: data.clientId,
          type: 'status_change',
          channel: 'email',
          to: data.clientEmail,
          subject: 'Actualización de tu expediente',
          message: `Tu expediente ha cambiado a estado: ${data.newStatus}`,
        }).catch((err) => logger.error('Auto-notification failed', { error: err.message }));
      }
    });

    eventBus.on('offer.received', async (data) => {
      logger.info('Auto-notification: offer.received', { offerId: data.id });
      if (data.clientEmail) {
        await notificationService.sendNotification({
          userId: data.clientId,
          type: 'offer_received',
          channel: 'email',
          to: data.clientEmail,
          subject: 'Nueva oferta hipotecaria recibida',
          message: `Has recibido una nueva oferta de ${data.bankName || 'un banco'}`,
        }).catch((err) => logger.error('Auto-notification failed', { error: err.message }));
      }
    });

    eventBus.on('document.uploaded', async (data) => {
      logger.info('Auto-notification: document.uploaded', { documentId: data.id });
    });

    eventBus.on('notification.send', async (data) => {
      await notificationService.sendNotification(data)
        .catch((err) => logger.error('notification.send handler failed', { error: err.message }));
    });

    logger.info('Notification service initialised – listening for events');
  },
};

module.exports = notificationService;
