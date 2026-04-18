import { crmApi } from '../../services/api.js';
import { router } from '../../utils/router.js';
import { escapeHtml, formatDate, getStatusColor, getStatusLabel, timeAgo } from '../../utils/helpers.js';
import { openModal, closeModal, confirmModal } from '../shared/Modal.js';
import renderForm from '../shared/Form.js';
import * as notify from '../../services/notification.js';

export default async function CrmLeadDetail(params) {
  const app = document.getElementById('app');
  const id = params.id;
  app.innerHTML = '<div class="page-content"><div class="loading-spinner"></div></div>';

  try {
    const res = await crmApi.get(`/leads/${id}`);
    const data = res.data || res;
    const lead = data.lead || data;
    const history = data.history || [];

    app.innerHTML = `
      <div class="page-content">
        <a href="#/crm/leads" class="btn-back">← Volver a Leads</a>
        <div class="detail-header">
          <h1>${escapeHtml(lead.fullName || lead.nombre || '')}</h1>
          <span class="badge ${getStatusColor(lead.status || lead.estado)}">${escapeHtml(getStatusLabel(lead.status || lead.estado))}</span>
        </div>

        <div class="detail-grid">
          <div class="card"><div class="card-body">
            <h3>Información de Contacto</h3>
            <p><strong>Email:</strong> ${escapeHtml(lead.email || '')}</p>
            <p><strong>Teléfono:</strong> ${escapeHtml(lead.phone || lead.telefono || '')}</p>
            <p><strong>Origen:</strong> ${escapeHtml(lead.source || lead.origen || '')}</p>
            <p><strong>Asignado a:</strong> ${escapeHtml(lead.assignedTo || lead.asignado_a || 'Sin asignar')}</p>
            ${lead.score != null ? `<p><strong>Puntuación:</strong> ${lead.score}/100</p>` : ''}
            <p><strong>Fecha de creación:</strong> ${formatDate(lead.createdAt || lead.created_at)}</p>
            ${lead.notes || lead.notas ? `<p><strong>Notas:</strong> ${escapeHtml(lead.notes || lead.notas)}</p>` : ''}
          </div></div>

          <div class="card"><div class="card-body">
            <h3>Acciones</h3>
            <div class="action-buttons">
              ${(lead.status === 'new' || lead.estado === 'nuevo') ? `<button class="btn btn-primary" id="btn-qualify">Calificar Lead</button>` : ''}
              ${(lead.status === 'qualified' || lead.estado === 'calificado') ? `<button class="btn btn-success" id="btn-convert">Convertir a Cliente</button>` : ''}
              <button class="btn btn-outline" id="btn-assign">Asignar Asesor</button>
            </div>
          </div></div>
        </div>

        <div class="section">
          <h2>Historial</h2>
          ${history.length === 0 ? '<p class="empty-state">Sin historial</p>' : `
          <ul class="timeline-list">${history.map(h => `
            <li class="timeline-item">
              <span class="timeline-action">${escapeHtml(h.action || h.accion || '')}</span>
              <span class="timeline-detail">${escapeHtml(h.detail || h.detalle || '')}</span>
              <span class="timeline-date">${timeAgo(h.createdAt || h.created_at)}</span>
            </li>`).join('')}</ul>`}
        </div>
      </div>`;

    // Qualify
    const qualifyBtn = document.getElementById('btn-qualify');
    if (qualifyBtn) {
      qualifyBtn.addEventListener('click', async () => {
        const confirmed = await confirmModal('Calificar Lead', '¿Deseas calificar este lead como válido?');
        if (confirmed) {
          try {
            await crmApi.post(`/leads/${id}/qualify`, { calificacion: 'qualified' });
            notify.success('Lead calificado');
            CrmLeadDetail(params);
          } catch (err) { notify.error('Error al calificar'); }
        }
      });
    }

    // Convert
    const convertBtn = document.getElementById('btn-convert');
    if (convertBtn) {
      convertBtn.addEventListener('click', async () => {
        const confirmed = await confirmModal('Convertir Lead', '¿Convertir este lead en cliente y crear expediente?');
        if (confirmed) {
          try {
            await crmApi.post(`/leads/${id}/convert`, {});
            notify.success('Lead convertido a cliente');
            router.navigate('/crm/clients');
          } catch (err) { notify.error('Error al convertir'); }
        }
      });
    }

    // Assign
    const assignBtn = document.getElementById('btn-assign');
    if (assignBtn) {
      assignBtn.addEventListener('click', () => {
        openModal('Asignar Asesor', '<div id="assign-form-container"></div>', []);
        const formContainer = document.getElementById('assign-form-container') || document.querySelector('.modal-body');
        renderForm(formContainer, {
          fields: [
            { name: 'asesor_id', label: 'ID del Asesor', type: 'number', required: true, placeholder: 'Ej: 1' },
          ],
          submitLabel: 'Asignar',
          async onSubmit(values) {
            const advisorId = parseInt(values.asesor_id, 10);
            if (!advisorId || isNaN(advisorId)) {
              notify.warning('Introduce un ID de asesor válido');
              return;
            }
            try {
              await crmApi.post(`/leads/${id}/assign`, { asesor_id: advisorId });
              notify.success('Lead asignado');
              closeModal();
              CrmLeadDetail(params);
            } catch (err) { notify.error('Error al asignar'); }
          },
        });
      });
    }
  } catch (err) {
    app.innerHTML = '<div class="page-content"><p class="error">Error al cargar el lead</p></div>';
    notify.error('Error al cargar lead');
  }
}
