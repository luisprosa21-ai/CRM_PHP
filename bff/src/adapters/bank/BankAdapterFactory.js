'use strict';

const BankAAdapter = require('./BankAAdapter');
const BankBAdapter = require('./BankBAdapter');

/**
 * Registry of available bank adapters keyed by bankId.
 * @type {Object<string, import('./BaseBankAdapter')>}
 */
const adapters = {
  bank_a: new BankAAdapter(),
  bank_b: new BankBAdapter(),
};

/**
 * Factory that returns the appropriate bank adapter for a given bankId.
 */
const BankAdapterFactory = {
  /**
   * Get a bank adapter by its identifier.
   * @param {string} bankId
   * @returns {import('./BaseBankAdapter')}
   * @throws {Error} If no adapter exists for the given bankId.
   */
  getAdapter(bankId) {
    const adapter = adapters[bankId];
    if (!adapter) {
      const err = new Error(`No adapter registered for bank: ${bankId}`);
      err.statusCode = 400;
      err.code = 'INVALID_BANK';
      throw err;
    }
    return adapter;
  },

  /**
   * List all available bank adapters.
   * @returns {Array<{bankId: string, bankName: string}>}
   */
  listAvailable() {
    return Object.values(adapters).map((a) => ({
      bankId: a.bankId,
      bankName: a.bankName,
      baseUrl: a.baseUrl,
    }));
  },
};

module.exports = BankAdapterFactory;
