import { crmApi } from '../../services/api.js';
import { router } from '../../utils/router.js';
import { escapeHtml, formatCurrency, getStatusColor, getStatusLabel } from '../../utils/helpers.js';
import { openModal, closeModal } from '../shared/Modal.js';
import renderForm from '../shared/Form.js';
import * as notify from '../../services/notification.js';

export default async function CrmOffers(params) {
  const app = document.getElementById('app');
  const expId = params.id;

  if (!expId) {
    app.innerHTML = `
      <div class="page-content">
        <h1>Gestión de Ofertas</h1>
        <p class="empty-state">Selecciona un expediente para ver sus ofertas.
          <a href="#/crm/expedientes" class="btn btn-outline">Ir a Expedientes</a></p>
      </div>`;
    return;
  }

  app.innerHTML = '<div class="page-content"><div class="loading-spinner"></div></div>';

  try {
    const res = await crmApi.get(`/offers/${expId}`);
    const offers = res.data || res || [];

    let bestIdx = -1;
    if (offers.length > 0) {
      let minPay = Infinity;
      offers.forEach((o, i) => {
        const p = o.monthlyPayment || o.cuota_mensual || Infinity;
        if (p < minPay) { minPay = p; bestIdx = i; }
      });
    }

    app.innerHTML = `
      <div class="page-content">
        <a href="#/crm/expedientes/${escapeHtml(expId)}" class="btn-back">← Volver al Expediente</a>
        <div class="page-header">
          <h1>Ofertas del Expediente #${escapeHtml(String(expId).slice(0, 8))}</h1>
          <button class="btn btn-primary" id="btn-new-offer">+ Registrar Oferta</button>
        </div>

        ${offers.length === 0 ? '<p class="empty-state">No hay ofertas para este expediente.</p>' : `
        <div class="cards-grid offers-comparison">
          ${offers.map((o, i) => `
            <div class="card offer-card ${i === bestIdx ? 'best-offer' : ''}">
              ${i === bestIdx ? '<div class="best-badge">⭐ Mejor Oferta</div>' : ''}
              <div class="card-header">
                <strong>${escapeHtml(o.bankName || o.banco || 'Banco')}</strong>
                <span class="badge ${getStatusColor(o.status || o.estado)}">${escapeHtml(getStatusLabel(o.status || o.estado))}</span>
              </div>
              <div class="card-body">
                <div class="offer-rate">${o.interestRate || o.tasa_interes}% <small>TIN</small></div>
                <p><strong>Cuota mensual:</strong> ${formatCurrency(o.monthlyPayment || o.cuota_mensual)}</p>
                <p><strong>Coste total:</strong> ${formatCurrency(o.totalCost || o.coste_total)}</p>
                <p><strong>Plazo:</strong> ${o.term || o.plazo} meses</p>
                ${o.conditions || o.condiciones ? `<p><strong>Condiciones:</strong> ${escapeHtml(o.conditions || o.condiciones)}</p>` : ''}
              </div>
            </div>`).join('')}
        </div>`}
      </div>`;

    // New offer button
    const newBtn = document.getElementById('btn-new-offer');
    if (newBtn) {
      newBtn.addEventListener('click', () => showCreateOfferForm(expId));
    }
  } catch (err) {
    app.innerHTML = '<div class="page-content"><p class="error">Error al cargar ofertas</p></div>';
    notify.error('Error al cargar ofertas');
  }

  function showCreateOfferForm(expedienteId) {
    openModal('Registrar Oferta', '<div id="offer-form-container"></div>', []);
    const formContainer = document.getElementById('offer-form-container') || document.querySelector('.modal-body');

    renderForm(formContainer, {
      fields: [
        { name: 'banco', label: 'Banco', type: 'text', required: true },
        { name: 'tasa_interes', label: 'Tipo de interés (%)', type: 'number', required: true },
        { name: 'cuota_mensual', label: 'Cuota mensual (€)', type: 'number' },
        { name: 'coste_total', label: 'Coste total (€)', type: 'number' },
        { name: 'plazo', label: 'Plazo (meses)', type: 'number' },
        { name: 'condiciones', label: 'Condiciones', type: 'textarea' },
      ],
      submitLabel: 'Registrar Oferta',
      async onSubmit(values) {
        try {
          values.expediente_id = parseInt(expedienteId, 10);
          values.tasa_interes = parseFloat(values.tasa_interes);
          await crmApi.post('/offers', values);
          notify.success('Oferta registrada correctamente');
          closeModal();
          CrmOffers(params);
        } catch (err) {
          notify.error(err.message || 'Error al registrar oferta');
        }
      },
    });
  }
}
