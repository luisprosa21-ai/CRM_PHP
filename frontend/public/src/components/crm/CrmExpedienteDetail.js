import { crmApi } from '../../services/api.js';
import { router } from '../../utils/router.js';
import { escapeHtml, formatCurrency, formatDate, getStatusColor, getStatusLabel, calculateLTV } from '../../utils/helpers.js';
import { confirmModal } from '../shared/Modal.js';
import * as notify from '../../services/notification.js';

const TRANSITIONS = {
  nuevo: ['en_estudio'],
  en_estudio: ['documentacion_pendiente', 'rechazado'],
  documentacion_pendiente: ['enviado_a_banco', 'rechazado'],
  enviado_a_banco: ['oferta_recibida', 'rechazado'],
  oferta_recibida: ['negociacion', 'rechazado'],
  negociacion: ['aprobado', 'rechazado'],
  aprobado: ['firmado'],
};

const ALL_STATES = ['nuevo', 'en_estudio', 'documentacion_pendiente', 'enviado_a_banco', 'oferta_recibida', 'negociacion', 'aprobado', 'firmado'];

function renderTimeline(currentStatus) {
  const idx = ALL_STATES.indexOf(currentStatus);
  return `<div class="timeline">${ALL_STATES.map((s, i) => `
    <div class="timeline-step ${i <= idx ? 'completed' : ''} ${i === idx ? 'current' : ''}">
      <div class="timeline-dot"></div>
      <div class="timeline-label">${escapeHtml(getStatusLabel(s))}</div>
    </div>`).join('')}</div>`;
}

export default async function CrmExpedienteDetail(params) {
  const app = document.getElementById('app');
  const id = params.id;
  app.innerHTML = '<div class="page-content"><div class="loading-spinner"></div></div>';

  try {
    const res = await crmApi.get(`/expedientes/${id}`);
    const exp = res.data || res;
    const status = exp.status || exp.estado;
    const reqAmount = exp.requestedAmount || exp.monto_solicitado || 0;
    const propValue = exp.propertyValue || exp.valor_propiedad || 0;
    const ltv = calculateLTV(reqAmount, propValue);
    const allowed = TRANSITIONS[status] || [];

    app.innerHTML = `
      <div class="page-content">
        <a href="#/crm/expedientes" class="btn-back">← Volver al Pipeline</a>
        <div class="detail-header">
          <h1>Expediente #${escapeHtml(String(id).slice(0, 8))}</h1>
          <span class="badge ${getStatusColor(status)}">${escapeHtml(getStatusLabel(status))}</span>
        </div>

        ${renderTimeline(status)}

        <div class="detail-grid">
          <div class="card"><div class="card-body">
            <h3>Detalles Financieros</h3>
            <p><strong>Importe solicitado:</strong> ${formatCurrency(reqAmount)}</p>
            <p><strong>Valor propiedad:</strong> ${formatCurrency(propValue)}</p>
            <p><strong>LTV:</strong> ${ltv}%</p>
            <p><strong>Plazo:</strong> ${exp.term || exp.plazo || '—'} meses</p>
            ${exp.score != null ? `<p><strong>Puntuación:</strong> ${exp.score}/100</p>` : ''}
            <p><strong>Cliente ID:</strong> ${escapeHtml(exp.clientId || exp.cliente_id || '')}</p>
            <p><strong>Asesor ID:</strong> ${escapeHtml(exp.advisorId || exp.asesor_id || '')}</p>
            <p><strong>Fecha:</strong> ${formatDate(exp.createdAt || exp.created_at)}</p>
            ${exp.notes || exp.notas ? `<p><strong>Notas:</strong> ${escapeHtml(exp.notes || exp.notas)}</p>` : ''}
          </div></div>

          <div class="card"><div class="card-body">
            <h3>Acciones</h3>
            <div class="action-buttons">
              ${allowed.map(s => `
                <button class="btn ${s === 'rechazado' ? 'btn-danger' : 'btn-primary'} btn-transition" data-status="${escapeHtml(s)}">
                  ${s === 'rechazado' ? '✕ Rechazar' : `→ ${escapeHtml(getStatusLabel(s))}`}
                </button>`).join('')}
              <button class="btn btn-outline" id="btn-score">📊 Calcular Score</button>
              <a href="#/crm/offers/${escapeHtml(id)}" class="btn btn-outline">💰 Ver Ofertas</a>
            </div>
          </div></div>
        </div>
      </div>`;

    // Transitions
    app.querySelectorAll('.btn-transition').forEach(btn => {
      btn.addEventListener('click', async () => {
        const newStatus = btn.dataset.status;
        const confirmed = await confirmModal(
          'Cambiar Estado',
          `¿Cambiar el estado del expediente a "${getStatusLabel(newStatus)}"?`
        );
        if (confirmed) {
          try {
            await crmApi.post(`/expedientes/${id}/transition`, { estado: newStatus });
            notify.success(`Estado cambiado a ${getStatusLabel(newStatus)}`);
            CrmExpedienteDetail(params);
          } catch (err) { notify.error('Error al cambiar estado'); }
        }
      });
    });

    // Score
    const scoreBtn = document.getElementById('btn-score');
    if (scoreBtn) {
      scoreBtn.addEventListener('click', async () => {
        try {
          const res = await crmApi.post(`/expedientes/${id}/score`, {});
          const score = res.data?.score || res.score;
          notify.success(`Puntuación calculada: ${score}/100`);
          CrmExpedienteDetail(params);
        } catch (err) { notify.error('Error al calcular score'); }
      });
    }
  } catch (err) {
    app.innerHTML = '<div class="page-content"><p class="error">Error al cargar el expediente</p></div>';
    notify.error('Error al cargar expediente');
  }
}
