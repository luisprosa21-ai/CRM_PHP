'use strict';

const BaseBankAdapter = require('./BaseBankAdapter');
const { v4: uuidv4 } = require('uuid');

/**
 * Simulated adapter for "Banco Internacional" (Bank B).
 * Uses a different field mapping and response format than Bank A.
 */
class BankBAdapter extends BaseBankAdapter {
  constructor() {
    super('bank_b', 'Banco Internacional', 'https://api.bancointernacional.example.com');
  }

  /**
   * Transform expediente data to Bank B's specific format and submit.
   * @param {Object} expedienteData
   * @returns {Promise<Object>}
   */
  async _doSubmit(expedienteData) {
    // Bank B expects a flat structure with different naming conventions
    const payload = {
      reqId: `BINT-${Date.now()}`,
      nombre_completo: `${expedienteData.cliente_nombre || ''} ${expedienteData.cliente_apellido || ''}`.trim(),
      identificacion: expedienteData.dni || expedienteData.documento,
      correo: expedienteData.email,
      telefono_contacto: expedienteData.telefono,
      monto_hipoteca: expedienteData.monto_solicitado,
      valor_inmueble: expedienteData.valor_propiedad,
      plazo_meses: (expedienteData.plazo_anios || 20) * 12,
      ingreso_mensual: expedienteData.ingresos_mensuales,
      situacion_laboral: expedienteData.tipo_empleo || 'dependiente',
      tipo_inmueble: expedienteData.tipo_propiedad || 'residencial',
    };

    // Simulated API response
    const applicationId = uuidv4();
    const rate = 2.95 + Math.random() * 1.8;
    return {
      codigo_solicitud: applicationId,
      estado: 'recibida',
      referencia: payload.reqId,
      tasa_interes_anual: rate,
      cuota_mensual_estimada: this._calculatePayment(
        payload.monto_hipoteca,
        rate,
        payload.plazo_meses
      ),
      plazo_respuesta_dias: 3,
      comision_apertura: (expedienteData.monto_solicitado || 0) * 0.01,
    };
  }

  /**
   * Check application status using Bank B's API format.
   * @param {string} applicationId
   * @returns {Promise<Object>}
   */
  async _doGetStatus(applicationId) {
    const estados = ['recibida', 'en_analisis', 'pre_aprobada', 'aprobada', 'rechazada'];
    return {
      codigo_solicitud: applicationId,
      estado: estados[Math.floor(Math.random() * estados.length)],
      fecha_actualizacion: new Date().toISOString(),
      observaciones: 'Solicitud en proceso por Banco Internacional.',
    };
  }

  /**
   * Normalize Bank B's Spanish-keyed response to canonical format.
   * @param {Object} rawResponse
   * @returns {Object}
   */
  normalizeResponse(rawResponse) {
    const STATUS_MAP = {
      recibida: 'received',
      en_analisis: 'under_review',
      pre_aprobada: 'conditionally_approved',
      aprobada: 'approved',
      rechazada: 'rejected',
    };

    return {
      bankId: this.bankId,
      bankName: this.bankName,
      applicationId: rawResponse.codigo_solicitud,
      status: STATUS_MAP[rawResponse.estado] || rawResponse.estado,
      interestRate: rawResponse.tasa_interes_anual
        ? parseFloat(rawResponse.tasa_interes_anual.toFixed(2))
        : null,
      monthlyPayment: rawResponse.cuota_mensual_estimada
        ? parseFloat(rawResponse.cuota_mensual_estimada.toFixed(2))
        : null,
      estimatedResponseDays: rawResponse.plazo_respuesta_dias || null,
      openingFee: rawResponse.comision_apertura
        ? parseFloat(rawResponse.comision_apertura.toFixed(2))
        : null,
      message: rawResponse.observaciones || null,
      updatedAt: rawResponse.fecha_actualizacion || new Date().toISOString(),
    };
  }

  /**
   * Monthly payment calculation.
   * @param {number} principal
   * @param {number} annualRate - Percentage
   * @param {number} totalMonths
   * @returns {number}
   * @private
   */
  _calculatePayment(principal, annualRate, totalMonths) {
    if (!principal || !annualRate || !totalMonths) return 0;
    const monthlyRate = annualRate / 100 / 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
  }
}

module.exports = BankBAdapter;
