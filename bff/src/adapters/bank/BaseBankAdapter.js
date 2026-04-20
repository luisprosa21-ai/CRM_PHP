'use strict';

const { logger } = require('../../middleware/requestLogger');
const config = require('../../config');

/**
 * Base class for all bank adapters.
 * Provides a circuit breaker pattern and retry with exponential backoff.
 */
class BaseBankAdapter {
  /**
   * @param {string} bankId - Unique identifier for the bank.
   * @param {string} bankName - Human-readable bank name.
   * @param {string} baseUrl - Bank API base URL.
   */
  constructor(bankId, bankName, baseUrl) {
    this.bankId = bankId;
    this.bankName = bankName;
    this.baseUrl = baseUrl;
    this.timeout = config.bank.apiTimeout;

    // Circuit breaker state
    this._circuitState = 'CLOSED'; // CLOSED | OPEN | HALF_OPEN
    this._failureCount = 0;
    this._failureThreshold = 5;
    this._resetTimeout = 30000; // 30 s
    this._lastFailureTime = null;
  }

  /**
   * Submit a mortgage application to the bank.
   * @param {Object} expedienteData - Normalised expediente data.
   * @returns {Promise<Object>} Normalised response.
   */
  async submitApplication(expedienteData) {
    this._checkCircuit();
    try {
      const raw = await this._retryWithBackoff(() => this._doSubmit(expedienteData));
      this._onSuccess();
      return this.normalizeResponse(raw);
    } catch (err) {
      this._onFailure();
      throw err;
    }
  }

  /**
   * Check application / offer status.
   * @param {string} applicationId
   * @returns {Promise<Object>}
   */
  async getOfferStatus(applicationId) {
    this._checkCircuit();
    try {
      const raw = await this._retryWithBackoff(() => this._doGetStatus(applicationId));
      this._onSuccess();
      return this.normalizeResponse(raw);
    } catch (err) {
      this._onFailure();
      throw err;
    }
  }

  /**
   * Normalize a raw bank response to the canonical format.
   * Subclasses should override this.
   * @param {Object} rawResponse
   * @returns {Object}
   */
  normalizeResponse(rawResponse) {
    return {
      bankId: this.bankId,
      bankName: this.bankName,
      ...rawResponse,
    };
  }

  // ---- Internal methods meant to be overridden by subclasses ----

  /** @abstract */
  async _doSubmit(_expedienteData) {
    throw new Error('_doSubmit must be implemented by subclass');
  }

  /** @abstract */
  async _doGetStatus(_applicationId) {
    throw new Error('_doGetStatus must be implemented by subclass');
  }

  // ---- Circuit breaker helpers ----

  /** @private */
  _checkCircuit() {
    if (this._circuitState === 'OPEN') {
      const elapsed = Date.now() - this._lastFailureTime;
      if (elapsed > this._resetTimeout) {
        this._circuitState = 'HALF_OPEN';
        logger.info(`Circuit breaker HALF_OPEN for ${this.bankName}`);
      } else {
        throw new Error(`Circuit breaker OPEN for ${this.bankName}. Try again later.`);
      }
    }
  }

  /** @private */
  _onSuccess() {
    if (this._circuitState === 'HALF_OPEN') {
      logger.info(`Circuit breaker CLOSED for ${this.bankName}`);
    }
    this._circuitState = 'CLOSED';
    this._failureCount = 0;
  }

  /** @private */
  _onFailure() {
    this._failureCount++;
    this._lastFailureTime = Date.now();
    if (this._failureCount >= this._failureThreshold) {
      this._circuitState = 'OPEN';
      logger.warn(`Circuit breaker OPEN for ${this.bankName} after ${this._failureCount} failures`);
    }
  }

  // ---- Retry with exponential backoff ----

  /**
   * @param {Function} fn - Async function to execute.
   * @param {number} [maxRetries=0]
   * @returns {Promise<*>}
   * @private
   */
  async _retryWithBackoff(fn, maxRetries = 0) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          logger.warn(`Retry ${attempt + 1}/${maxRetries} for ${this.bankName}`, { delay: Math.round(delay) });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }
}

module.exports = BaseBankAdapter;
