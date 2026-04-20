import { portalApi } from '../../services/api.js';
import { router } from '../../utils/router.js';
import { escapeHtml, formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../../utils/helpers.js';
import * as notify from '../../services/notification.js';

export default async function PortalExpedientes(params) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-content">
      <h1>Mis Expedientes</h1>
      <div id="exp-list" class="cards-grid"><div class="loading-spinner"></div></div>
    </div>`;

  try {
    const res = await portalApi.get('/expedientes');
    const expedientes = res.data || res || [];
    const container = document.getElementById('exp-list');
    if (!container) return;
    if (expedientes.length === 0) {
      container.innerHTML = '<p class="empty-state">No tienes expedientes aún.</p>';
      return;
    }
    container.innerHTML = expedientes.map(exp => `
      <div class="card card-clickable" data-id="${escapeHtml(exp.id)}">
        <div class="card-header">
          <span class="status-badge ${getStatusColor(exp.status)}">${escapeHtml(getStatusLabel(exp.status))}</span>
          <span class="card-date">${formatDate(exp.createdAt || exp.created_at)}</span>
        </div>
        <div class="card-body">
          <p><strong>Importe solicitado:</strong> ${formatCurrency(exp.requestedAmount || exp.requested_amount)}</p>
          <p><strong>Valor propiedad:</strong> ${formatCurrency(exp.propertyValue || exp.property_value)}</p>
          <p><strong>Plazo:</strong> ${exp.term || '—'} meses</p>
          ${exp.score != null ? `<p><strong>Puntuación:</strong> ${exp.score}/100</p>` : ''}
        </div>
      </div>`).join('');

    container.querySelectorAll('.card-clickable').forEach(card => {
      card.addEventListener('click', () => router.navigate(`/portal/expedientes/${card.dataset.id}`));
    });
  } catch (err) {
    notify.error('Error al cargar expedientes');
  }
}
