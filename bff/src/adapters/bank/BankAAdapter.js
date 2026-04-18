'use strict';

const BaseBankAdapter = require('./BaseBankAdapter');
const { v4: uuidv4 } = require('uuid');

/**
 * Simulated adapter for "Banco Nacional" (Bank A).
 * Transforms expediente data into Bank A's specific API format,
 * simulates submission and status queries.
 */
class BankAAdapter extends BaseBankAdapter {
  constructor() {
    super('bank_a', 'Banco Nacional', 'https://api.banconacional.example.com');
  }

  /**
   * Transform expediente data to Bank A's format and submit.
   * @param {Object} expedienteData
   * @returns {Promise<Object>}
   */
  async _doSubmit(expedienteData) {
    // Transform to Bank A specific payload
    const payload = {
      reference: `BNA-${Date.now()}`,
      applicant: {
        fullName: `${expedienteData.cliente_nombre || ''} ${expedienteData.cliente_apellido || ''}`.trim(),
        nationalId: expedienteData.dni || expedienteData.documento,
        email: expedienteData.email,
        phone: expedienteData.telefono,
      },
      mortgage: {
        propertyValue: expedienteData.valor_propiedad,
        requestedAmount: expedienteData.monto_solicitado,
        termYears: expedienteData.plazo_anios || 25,
        propertyType: expedienteData.tipo_propiedad || 'vivienda',
      },
      employment: {
        monthlyIncome: expedienteData.ingresos_mensuales,
        employmentType: expedienteData.tipo_empleo || 'asalariado',
        yearsEmployed: expedienteData.antiguedad_laboral,
      },
    };

    // Simulated API response
    const applicationId = uuidv4();
    return {
      status: 'received',
      applicationId,
      reference: payload.reference,
      estimatedResponseDays: 5,
      interestRate: 3.25 + Math.random() * 1.5,
      monthlyPayment: this._calculatePayment(
        payload.mortgage.requestedAmount,
        3.25 + Math.random() * 1.5,
        payload.mortgage.termYears
      ),
    };
  }

  /**
   * Check the status of a submitted application.
   * @param {string} applicationId
   * @returns {Promise<Object>}
   */
  async _doGetStatus(applicationId) {
    // Simulated status response
    const statuses = ['received', 'under_review', 'approved', 'conditionally_approved'];
    return {
      applicationId,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      updatedAt: new Date().toISOString(),
      message: 'Application is being processed by Banco Nacional.',
    };
  }

  /**
   * Normalize Bank A's response to canonical format.
   * @param {Object} rawResponse
   * @returns {Object}
   */
  normalizeResponse(rawResponse) {
    return {
      bankId: this.bankId,
      bankName: this.bankName,
      applicationId: rawResponse.applicationId,
      status: rawResponse.status,
      interestRate: rawResponse.interestRate ? parseFloat(rawResponse.interestRate.toFixed(2)) : null,
      monthlyPayment: rawResponse.monthlyPayment ? parseFloat(rawResponse.monthlyPayment.toFixed(2)) : null,
      estimatedResponseDays: rawResponse.estimatedResponseDays || null,
      message: rawResponse.message || null,
      updatedAt: rawResponse.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Simple mortgage payment calculator.
   * @param {number} principal
   * @param {number} annualRate - Percentage.
   * @param {number} years
   * @returns {number}
   * @private
   */
  _calculatePayment(principal, annualRate, years) {
    if (!principal || !annualRate || !years) return 0;
    const monthlyRate = annualRate / 100 / 12;
    const n = years * 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  }
}

module.exports = BankAAdapter;
