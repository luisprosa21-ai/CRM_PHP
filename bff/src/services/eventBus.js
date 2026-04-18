'use strict';

const { EventEmitter } = require('events');
const { logger } = require('../middleware/requestLogger');

/**
 * Simple in-process event bus for decoupled async operations
 * such as notifications, audit logging, and side effects.
 *
 * Supported events:
 *  - lead.created
 *  - expediente.statusChanged
 *  - document.uploaded
 *  - offer.received
 *  - notification.send
 */
class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  /**
   * Emit an event with associated data. Wraps the built-in emit with logging.
   * @param {string} event - Event name.
   * @param {Object} data - Event payload.
   * @returns {boolean}
   */
  emit(event, data) {
    logger.info('Event emitted', { event, data: typeof data === 'object' ? { ...data } : data });
    return super.emit(event, data);
  }

  /**
   * Register a handler for an event. Wraps the built-in on with error-safe execution.
   * @param {string} event
   * @param {Function} handler
   * @returns {this}
   */
  on(event, handler) {
    const safeHandler = async (...args) => {
      try {
        await handler(...args);
      } catch (err) {
        logger.error(`Event handler error for "${event}"`, { error: err.message, stack: err.stack });
      }
    };
    return super.on(event, safeHandler);
  }
}

// Singleton instance
const eventBus = new EventBus();

module.exports = eventBus;
