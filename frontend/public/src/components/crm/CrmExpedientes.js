import { crmApi } from '../../services/api.js';
import { router } from '../../utils/router.js';
import { escapeHtml, formatCurrency, getStatusLabel } from '../../utils/helpers.js';
import renderPipeline from '../shared/Pipeline.js';
import * as notify from '../../services/notification.js';

const PIPELINE_COLUMNS = [
  { key: 'nuevo', label: 'Nuevo', color: '#6b7280' },
  { key: 'en_estudio', label: 'En Estudio', color: '#3b82f6' },
  { key: 'documentacion_pendiente', label: 'Documentación', color: '#f59e0b' },
  { key: 'enviado_a_banco', label: 'Enviado a Banco', color: '#8b5cf6' },
  { key: 'oferta_recibida', label: 'Oferta Recibida', color: '#10b981' },
  { key: 'negociacion', label: 'Negociación', color: '#ec4899' },
  { key: 'aprobado', label: 'Aprobado', color: '#22c55e' },
  { key: 'firmado', label: 'Firmado', color: '#059669' },
  { key: 'rechazado', label: 'Rechazado', color: '#ef4444' },
];

export default async function CrmExpedientes(params) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-content">
      <div class="page-header">
        <h1>Pipeline de Expedientes</h1>
        <div class="page-actions">
          <button class="btn btn-primary" id="btn-new-exp">+ Nuevo Expediente</button>
        </div>
      </div>
      <div id="pipeline-container"><div class="loading-spinner"></div></div>
    </div>`;

  try {
    const res = await crmApi.get('/expedientes');
    const expedientes = res.data || res || [];

    const pipelineContainer = document.getElementById('pipeline-container');
    if (pipelineContainer) {
      const items = expedientes.map(exp => ({
        id: exp.id,
        title: `#${String(exp.id).slice(0, 8)}`,
        subtitle: escapeHtml(exp.clientName || exp.nombre_cliente || ''),
        status: exp.status || exp.estado,
        meta: formatCurrency(exp.requestedAmount || exp.monto_solicitado),
      }));

      renderPipeline(pipelineContainer, {
        columns: PIPELINE_COLUMNS,
        items,
        onItemClick: (item) => router.navigate(`/crm/expedientes/${item.id}`),
      });
    }
  } catch (err) {
    notify.error('Error al cargar expedientes');
  }

  // New expediente button
  const newBtn = document.getElementById('btn-new-exp');
  if (newBtn) {
    newBtn.addEventListener('click', () => {
      router.navigate('/crm/expedientes/new');
    });
  }
}
