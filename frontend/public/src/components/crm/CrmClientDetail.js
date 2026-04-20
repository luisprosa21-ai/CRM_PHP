import { crmApi } from '../../services/api.js';
import { router } from '../../utils/router.js';
import { escapeHtml, formatCurrency, formatDate, getStatusColor, getStatusLabel, timeAgo } from '../../utils/helpers.js';
import * as notify from '../../services/notification.js';

export default async function CrmClientDetail(params) {
  const app = document.getElementById('app');
  const id = params.id;
  app.innerHTML = '<div class="page-content"><div class="loading-spinner"></div></div>';

  try {
    const res = await crmApi.get(`/clients/${id}`);
    const data = res.data || res;
    const client = data.client || data;
    const expedientes = data.expedientes || [];
    const documents = data.documents || [];
    const activity = data.activity || [];

    const fullName = escapeHtml(`${client.firstName || client.nombre || ''} ${client.lastName || client.apellidos || ''}`.trim());

    app.innerHTML = `
      <div class="page-content">
        <a href="#/crm/clients" class="btn-back">← Volver a Clientes</a>
        <h1>${fullName}</h1>

        <div class="detail-grid">
          <div class="card"><div class="card-body">
            <h3>Datos Personales</h3>
            <p><strong>Email:</strong> ${escapeHtml(client.email || '')}</p>
            <p><strong>Teléfono:</strong> ${escapeHtml(client.phone || client.telefono || '')}</p>
            <p><strong>Documento:</strong> ${escapeHtml(client.documentType || client.tipo_documento || '')} ${escapeHtml(client.documentNumber || client.numero_documento || '')}</p>
            <p><strong>Dirección:</strong> ${escapeHtml(client.address || client.direccion || '')}</p>
            <p><strong>Ciudad:</strong> ${escapeHtml(client.city || client.ciudad || '')}</p>
          </div></div>

          <div class="card"><div class="card-body">
            <h3>Datos Financieros</h3>
            <p><strong>Tipo empleo:</strong> ${escapeHtml(client.employmentType || client.tipo_empleo || '')}</p>
            <p><strong>Ingresos mensuales:</strong> ${formatCurrency(client.monthlyIncome || client.ingresos_mensuales)}</p>
            <p><strong>Alta:</strong> ${formatDate(client.createdAt || client.created_at)}</p>
          </div></div>
        </div>

        <div class="section">
          <h2>Expedientes (${expedientes.length})</h2>
          ${expedientes.length === 0 ? '<p class="empty-state">Sin expedientes</p>' : `
          <div class="cards-grid">${expedientes.map(exp => `
            <div class="card card-clickable" data-id="${escapeHtml(exp.id)}">
              <div class="card-header">
                <span class="badge ${getStatusColor(exp.status || exp.estado)}">${escapeHtml(getStatusLabel(exp.status || exp.estado))}</span>
              </div>
              <div class="card-body">
                <p><strong>Importe:</strong> ${formatCurrency(exp.requestedAmount || exp.monto_solicitado)}</p>
                <p><small>${formatDate(exp.createdAt || exp.created_at)}</small></p>
              </div>
            </div>`).join('')}</div>`}
        </div>

        <div class="section">
          <h2>Documentos (${documents.length})</h2>
          ${documents.length === 0 ? '<p class="empty-state">Sin documentos</p>' : `
          <table class="data-table"><thead><tr>
            <th>Archivo</th><th>Categoría</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>
            ${documents.map(d => `<tr>
              <td>${escapeHtml(d.fileName || d.nombre_archivo || '')}</td>
              <td>${escapeHtml(d.type || d.categoria || '')}</td>
              <td><span class="badge ${getStatusColor(d.status || d.estado)}">${escapeHtml(getStatusLabel(d.status || d.estado))}</span></td>
              <td>${formatDate(d.createdAt || d.created_at)}</td>
            </tr>`).join('')}</tbody></table>`}
        </div>

        <div class="section">
          <h2>Actividad Reciente</h2>
          ${activity.length === 0 ? '<p class="empty-state">Sin actividad registrada</p>' : `
          <ul class="timeline-list">${activity.map(a => `
            <li class="timeline-item">
              <span class="timeline-action">${escapeHtml(a.action || a.accion || '')}</span>
              <span class="timeline-detail">${escapeHtml(a.detail || a.detalle || '')}</span>
              <span class="timeline-date">${timeAgo(a.createdAt || a.created_at)}</span>
            </li>`).join('')}</ul>`}
        </div>
      </div>`;

    // Navigate to expediente detail on click
    app.querySelectorAll('.card-clickable').forEach(card => {
      card.addEventListener('click', () => router.navigate(`/crm/expedientes/${card.dataset.id}`));
    });
  } catch (err) {
    app.innerHTML = '<div class="page-content"><p class="error">Error al cargar el cliente</p></div>';
    notify.error('Error al cargar cliente');
  }
}
