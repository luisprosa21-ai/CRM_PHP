'use strict';

const NodeCache = require('node-cache');
const config = require('../config');

/**
 * In-memory cache service backed by node-cache.
 * Used to cache dashboard data, client lists, and other frequently-read data.
 */
class CacheService {
  /**
   * @param {number} [defaultTtl] - Default TTL in seconds.
   */
  constructor(defaultTtl) {
    this.cache = new NodeCache({
      stdTTL: defaultTtl || config.cache.ttl,
      checkperiod: 60,
      useClones: true,
    });
  }

  /**
   * Retrieve a value by key.
   * @param {string} key
   * @returns {*} The cached value, or undefined if not found / expired.
   */
  get(key) {
    return this.cache.get(key);
  }

  /**
   * Store a value.
   * @param {string} key
   * @param {*} value
   * @param {number} [ttl] - Optional per-key TTL in seconds.
   * @returns {boolean}
   */
  set(key, value, ttl) {
    if (ttl !== undefined) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  /**
   * Delete a cached key.
   * @param {string} key
   * @returns {number} Number of deleted entries.
   */
  del(key) {
    return this.cache.del(key);
  }

  /**
   * Flush all cached data.
   */
  flush() {
    this.cache.flushAll();
  }

  /**
   * Get cache statistics.
   * @returns {Object}
   */
  getStats() {
    return this.cache.getStats();
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
