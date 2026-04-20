'use strict';

const axios = require('axios');
const config = require('../config');
const { logger } = require('../middleware/requestLogger');

/**
 * Axios-based HTTP client that proxies requests to the PHP backend.
 * Provides convenience methods and handles error mapping, timeouts, and retries.
 */
class BackendProxy {
  constructor() {
    this.client = axios.create({
      baseURL: config.phpBackendUrl,
      timeout: config.bank.apiTimeout,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Backend request failed', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Build common headers including authorization forwarding.
   * @param {string} [token] - Bearer token to forward.
   * @returns {Object}
   */
  _headers(token) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Perform a GET request against the PHP backend.
   * @param {string} path - API path (e.g. '/api/leads').
   * @param {string} [token] - Optional JWT token to forward.
   * @param {Object} [params] - Query parameters.
   * @returns {Promise<Object>} Response data.
   */
  async get(path, token, params = {}) {
    const response = await this._requestWithRetry('get', path, { token, params });
    return response.data;
  }

  /**
   * Perform a POST request against the PHP backend.
   * @param {string} path
   * @param {Object} data - Request body.
   * @param {string} [token]
   * @returns {Promise<Object>}
   */
  async post(path, data, token) {
    const response = await this._requestWithRetry('post', path, { token, data });
    return response.data;
  }

  /**
   * Perform a PUT request against the PHP backend.
   * @param {string} path
   * @param {Object} data
   * @param {string} [token]
   * @returns {Promise<Object>}
   */
  async put(path, data, token) {
    const response = await this._requestWithRetry('put', path, { token, data });
    return response.data;
  }

  /**
   * Perform a DELETE request against the PHP backend.
   * @param {string} path
   * @param {string} [token]
   * @returns {Promise<Object>}
   */
  async delete(path, token) {
    const response = await this._requestWithRetry('delete', path, { token });
    return response.data;
  }

  /**
   * Internal helper with retry logic (up to 2 retries for 5xx / network errors).
   * @param {string} method
   * @param {string} path
   * @param {Object} options
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  async _requestWithRetry(method, path, { token, data, params } = {}) {
    const maxRetries = 0; // Set to 2 to enable retries, currently disabled for stability
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.request({
          method,
          url: path,
          data,
          params,
          headers: this._headers(token),
        });
        return response;
      } catch (error) {
        lastError = error;
        const status = error.response?.status;

        // Only retry on 5xx or network errors, not on 4xx
        const isRetryable = !status || status >= 500;
        if (!isRetryable || attempt === maxRetries) {
          break;
        }

        const delay = Math.pow(2, attempt) * 500;
        logger.warn(`Retrying ${method.toUpperCase()} ${path} (attempt ${attempt + 1})`, { delay });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Map axios error to a friendlier format
    const mapped = new Error(lastError.response?.data?.message || lastError.message);
    mapped.statusCode = lastError.response?.status || 502;
    mapped.code = 'BACKEND_ERROR';
    throw mapped;
  }
}

// Singleton instance
const backendProxy = new BackendProxy();

module.exports = backendProxy;
