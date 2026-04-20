import { crmApi } from '../../services/api.js';
import { router } from '../../utils/router.js';
import { escapeHtml, formatDate, formatCurrency } from '../../utils/helpers.js';
import renderDataTable from '../shared/DataTable.js';
import * as notify from '../../services/notification.js';

export default async function CrmClients(params) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-content">
      <h1>Gestión de Clientes</h1>
      <div id="clients-table"><div class="loading-spinner"></div></div>
    </div>`;

  const tableContainer = document.getElementById('clients-table');

  const table = renderDataTable(tableContainer, {
    columns: [
      { key: 'firstName', label: 'Nombre', sortable: true, render: (v, row) => escapeHtml(`${v || row.nombre || ''} ${row.lastName || row.apellidos || ''}`.trim()) },
      { key: 'email', label: 'Email', sortable: true, render: (v) => escapeHtml(v || '') },
      { key: 'phone', label: 'Teléfono', render: (v, row) => escapeHtml(v || row.telefono || '') },
      { key: 'documentNumber', label: 'Documento', render: (v, row) => escapeHtml(v || row.numero_documento || '') },
      { key: 'monthlyIncome', label: 'Ingresos', sortable: true, render: (v, row) => formatCurrency(v || row.ingresos_mensuales) },
      { key: 'createdAt', label: 'Alta', sortable: true, render: (v, row) => formatDate(v || row.created_at) },
    ],
    data: [],
    searchable: true,
    loading: true,
    onRowClick: (row) => router.navigate(`/crm/clients/${row.id}`),
  });

  try {
    const res = await crmApi.get('/clients');
    const clients = res.data || res || [];
    table.refresh(clients);
  } catch (err) {
    notify.error('Error al cargar clientes');
    table.setLoading(false);
  }
}
