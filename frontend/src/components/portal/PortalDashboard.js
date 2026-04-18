import { portalApi } from '../../services/api.js';
import { store } from '../../utils/state.js';
import { escapeHtml, formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../../utils/helpers.js';
import * as notify from '../../services/notification.js';

export default async function PortalDashboard(params) {
  const app = document.getElementById('app');
  const user = store.getState('user');
  const name = user ? escapeHtml(user.firstName || user.name || 'Cliente') : 'Cliente';

  app.innerHTML = `
    <div class="page-content portal-dashboard">
      <h1>Bienvenido, ${name}</h1>
      <p class="subtitle">Tu espacio personal de seguimiento hipotecario</p>
      <div class="quick-actions">
        <a href="#/portal/documents" class="btn btn-outline">📄 Subir Documento</a>
        <a href="#/portal/expedientes" class="btn btn-outline">📁 Mis Expedientes</a>
      </div>
      <div class="section">
        <h2>Expedientes Activos</h2>
        <div id="expedientes-list" class="cards-grid"><div class="loading-spinner"></div></div>
      </div>
      <div class="section">
        <h2>Notificaciones Recientes</h2>
        <div id="notifications-list"><div class="loading-spinner"></div></div>
      </div>
    </div>`;

  try {
    const [expRes, notifRes] = await Promise.allSettled([
      portalApi.get('/expedientes'),
      portalApi.get('/notifications'),
    ]);
    const expedientes = expRes.status === 'fulfilled' ? (expRes.value.data || expRes.value || []) : [];
    const notifications = notifRes.status === 'fulfilled' ? (notifRes.value.data || notifRes.value || []) : [];

    const expContainer = document.getElementById('expedientes-list');
    if (expContainer) {
      if (expedientes.length === 0) {
        expContainer.innerHTML = '<p class="empty-state">No tienes expedientes activos</p>';
      } else {
        expContainer.innerHTML = expedientes.map(exp => `
          <div class="card card-clickable" data-id="${escapeHtml(exp.id)}">
            <div class="card-header"><span class="status-badge ${getStatusColor(exp.status)}">${escapeHtml(getStatusLabel(exp.status))}</span></div>
            <div class="card-body">
              <p><strong>Importe:</strong> ${formatCurrency(exp.requestedAmount || exp.requested_amount)}</p>
              <p><strong>Valor propiedad:</strong> ${formatCurrency(exp.propertyValue || exp.property_value)}</p>
              <p><strong>Plazo:</strong> ${exp.term || '—'} meses</p>
              <p><small>${formatDate(exp.createdAt || exp.created_at)}</small></p>
            </div>
          </div>`).join('');
        expContainer.querySelectorAll('.card-clickable').forEach(card => {
          card.addEventListener('click', () => router.navigate(`/portal/expedientes/${card.dataset.id}`));
        });
      }
    }

    const notifContainer = document.getElementById('notifications-list');
    if (notifContainer) {
      if (notifications.length === 0) {
        notifContainer.innerHTML = '<p class="empty-state">Sin notificaciones</p>';
      } else {
        notifContainer.innerHTML = `<ul class="notification-list">${notifications.slice(0, 5).map(n => `
          <li class="notification-item ${n.status === 'read' ? 'read' : 'unread'}">
            <span class="notification-subject">${escapeHtml(n.subject || n.type)}</span>
            <span class="notification-message">${escapeHtml(n.message || '')}</span>
            <span class="notification-date">${formatDate(n.createdAt || n.created_at)}</span>
          </li>`).join('')}</ul>`;
      }
    }
  } catch (err) {
    notify.error('Error al cargar datos del portal');
  }
}
