import { backofficeApi } from '../../services/api.js';
import { escapeHtml, formatDateTime } from '../../utils/helpers.js';
import renderDataTable from '../shared/DataTable.js';
import * as notify from '../../services/notification.js';

export default async function BackofficeAudit(params) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-content">
      <h1>Registro de Auditoría</h1>
      <div class="audit-filters">
        <div class="form-group form-inline">
          <label for="filter-entity">Entidad:</label>
          <select id="filter-entity" class="form-control form-control-sm">
            <option value="">Todas</option>
            <option value="lead">Leads</option>
            <option value="client">Clientes</option>
            <option value="expediente">Expedientes</option>
            <option value="offer">Ofertas</option>
            <option value="task">Tareas</option>
            <option value="document">Documentos</option>
            <option value="user">Usuarios</option>
          </select>
        </div>
      </div>
      <div id="audit-table"><div class="loading-spinner"></div></div>
    </div>`;

  const tableContainer = document.getElementById('audit-table');

  const table = renderDataTable(tableContainer, {
    columns: [
      { key: 'createdAt', label: 'Fecha', sortable: true, render: (v, row) => formatDateTime(v || row.created_at) },
      { key: 'action', label: 'Acción', sortable: true, render: (v, row) => escapeHtml(v || row.accion || '') },
      { key: 'entityType', label: 'Entidad', sortable: true, render: (v, row) => escapeHtml(v || row.tipo_entidad || '') },
      { key: 'entityId', label: 'ID Entidad', render: (v, row) => escapeHtml(String(v || row.entidad_id || '').slice(0, 8)) },
      { key: 'userName', label: 'Usuario', sortable: true, render: (v, row) => escapeHtml(v || row.nombre_usuario || '') },
      { key: 'details', label: 'Detalles', render: (v, row) => {
        const detail = v || row.detalles || '';
        const text = typeof detail === 'object' ? JSON.stringify(detail) : String(detail);
        return escapeHtml(text.length > 80 ? text.slice(0, 80) + '…' : text);
      }},
      { key: 'ipAddress', label: 'IP', render: (v, row) => escapeHtml(v || row.ip || '') },
    ],
    data: [],
    searchable: true,
    loading: true,
  });

  await loadAudit();

  // Filter by entity type
  const filterSelect = document.getElementById('filter-entity');
  if (filterSelect) {
    filterSelect.addEventListener('change', () => loadAudit());
  }

  async function loadAudit() {
    table.setLoading(true);
    try {
      const entityType = document.getElementById('filter-entity')?.value || '';
      const query = entityType ? `?entity_type=${entityType}` : '';
      const res = await backofficeApi.get(`/audit${query}`);
      const logs = res.data || res || [];
      table.refresh(logs);
    } catch (err) {
      notify.error('Error al cargar auditoría');
      table.setLoading(false);
    }
  }
}
