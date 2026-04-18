import { portalApi } from '../../services/api.js';
import { escapeHtml, formatCurrency, formatDate, getStatusColor, getStatusLabel, calculateLTV } from '../../utils/helpers.js';
import * as notify from '../../services/notification.js';

const ALL_STATES = ['nuevo','en_estudio','documentacion_pendiente','enviado_a_banco','oferta_recibida','negociacion','aprobado','firmado'];

function renderTimeline(currentStatus) {
  const idx = ALL_STATES.indexOf(currentStatus);
  return `<div class="timeline">${ALL_STATES.map((s, i) => `
    <div class="timeline-step ${i <= idx ? 'completed' : ''} ${i === idx ? 'current' : ''}">
      <div class="timeline-dot"></div>
      <div class="timeline-label">${escapeHtml(getStatusLabel(s))}</div>
    </div>`).join('')}</div>`;
}

export default async function PortalExpedienteDetail(params) {
  const app = document.getElementById('app');
  const id = params.id;
  app.innerHTML = '<div class="page-content"><div class="loading-spinner"></div></div>';

  try {
    const exp = await portalApi.get(`/expedientes/${id}`);
    const docs = exp.documents || [];
    const offers = exp.offers || [];
    const reqAmount = exp.requestedAmount || exp.requested_amount || 0;
    const propValue = exp.propertyValue || exp.property_value || 0;
    const ltv = calculateLTV(reqAmount, propValue);

    app.innerHTML = `
      <div class="page-content">
        <a href="#/portal/expedientes" class="btn-back">← Volver</a>
        <h1>Expediente #${escapeHtml(String(id).slice(0, 8))}</h1>
        ${renderTimeline(exp.status)}
        <div class="detail-grid">
          <div class="card"><div class="card-body">
            <h3>Detalles Financieros</h3>
            <p><strong>Importe solicitado:</strong> ${formatCurrency(reqAmount)}</p>
            <p><strong>Valor propiedad:</strong> ${formatCurrency(propValue)}</p>
            <p><strong>LTV:</strong> ${ltv}%</p>
            <p><strong>Plazo:</strong> ${exp.term || '—'} meses</p>
            ${exp.score != null ? `<p><strong>Puntuación:</strong> ${exp.score}/100</p>` : ''}
            <p><strong>Fecha:</strong> ${formatDate(exp.createdAt || exp.created_at)}</p>
          </div></div>

          <div class="card"><div class="card-body">
            <h3>Documentos <a href="#/portal/documents" class="btn btn-sm btn-outline">Subir</a></h3>
            ${docs.length === 0 ? '<p class="empty-state">Sin documentos</p>' : `<ul class="doc-list">${docs.map(d => `
              <li><span class="status-badge ${getStatusColor(d.status)}">${escapeHtml(d.status)}</span> ${escapeHtml(d.fileName || d.file_name)} <small>${formatDate(d.createdAt || d.created_at)}</small></li>`).join('')}</ul>`}
          </div></div>
        </div>

        <div class="section">
          <h2>Ofertas Recibidas</h2>
          ${offers.length === 0 ? '<p class="empty-state">Aún no hay ofertas</p>' : `<div class="cards-grid">${offers.map(o => `
            <div class="card offer-card">
              <div class="card-header"><strong>${escapeHtml(o.bankName || o.bank_name || 'Banco')}</strong>
                <span class="status-badge ${getStatusColor(o.status)}">${escapeHtml(o.status)}</span></div>
              <div class="card-body">
                <p><strong>Tipo interés:</strong> ${o.interestRate || o.interest_rate}%</p>
                <p><strong>Cuota mensual:</strong> ${formatCurrency(o.monthlyPayment || o.monthly_payment)}</p>
                <p><strong>Coste total:</strong> ${formatCurrency(o.totalCost || o.total_cost)}</p>
                <p><strong>Plazo:</strong> ${o.term} meses</p>
              </div>
            </div>`).join('')}</div>`}
        </div>
      </div>`;
  } catch (err) {
    app.innerHTML = '<div class="page-content"><p class="error">Error al cargar el expediente</p></div>';
    notify.error('Error al cargar expediente');
  }
}
