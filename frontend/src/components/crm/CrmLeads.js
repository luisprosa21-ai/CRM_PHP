import { crmApi } from '../../services/api.js';
import { router } from '../../utils/router.js';
import { escapeHtml, formatDate, getStatusColor, getStatusLabel } from '../../utils/helpers.js';
import renderDataTable from '../shared/DataTable.js';
import { openModal, closeModal } from '../shared/Modal.js';
import renderForm from '../shared/Form.js';
import * as notify from '../../services/notification.js';

export default async function CrmLeads(params) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-content">
      <h1>Gestión de Leads</h1>
      <div id="leads-table"><div class="loading-spinner"></div></div>
    </div>`;

  const tableContainer = document.getElementById('leads-table');

  const table = renderDataTable(tableContainer, {
    columns: [
      { key: 'fullName', label: 'Nombre', sortable: true, render: (v, row) => escapeHtml(v || row.nombre || '') },
      { key: 'email', label: 'Email', sortable: true, render: (v) => escapeHtml(v || '') },
      { key: 'phone', label: 'Teléfono', render: (v, row) => escapeHtml(v || row.telefono || '') },
      { key: 'source', label: 'Origen', render: (v, row) => escapeHtml(v || row.origen || '') },
      { key: 'status', label: 'Estado', render: (v, row) => {
        const s = v || row.estado;
        return `<span class="badge ${getStatusColor(s)}">${escapeHtml(getStatusLabel(s))}</span>`;
      }},
      { key: 'createdAt', label: 'Fecha', sortable: true, render: (v, row) => formatDate(v || row.created_at) },
    ],
    data: [],
    searchable: true,
    loading: true,
    onRowClick: (row) => router.navigate(`/crm/leads/${row.id}`),
    actions: [
      { label: '+ Nuevo Lead', class: 'btn-primary', onClick: showCreateForm },
    ],
  });

  try {
    const res = await crmApi.get('/leads');
    const leads = res.data || res || [];
    table.refresh(leads);
  } catch (err) {
    notify.error('Error al cargar leads');
    table.setLoading(false);
  }

  function showCreateForm() {
    const formContainer = document.createElement('div');

    openModal('Nuevo Lead', formContainer.outerHTML || '<div id="lead-form-container"></div>', []);

    const modalFormContainer = document.querySelector('#lead-form-container') || document.querySelector('.modal-body');

    renderForm(modalFormContainer, {
      fields: [
        { name: 'nombre', label: 'Nombre completo', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'telefono', label: 'Teléfono', type: 'tel', required: true },
        { name: 'origen', label: 'Origen', type: 'select', required: true, options: [
          { value: 'web', label: 'Web' },
          { value: 'phone', label: 'Teléfono' },
          { value: 'referral', label: 'Referido' },
          { value: 'partner', label: 'Partner' },
          { value: 'advertising', label: 'Publicidad' },
        ]},
        { name: 'notas', label: 'Notas', type: 'textarea' },
      ],
      submitLabel: 'Crear Lead',
      async onSubmit(values) {
        try {
          await crmApi.post('/leads', values);
          notify.success('Lead creado correctamente');
          closeModal();
          CrmLeads(params);
        } catch (err) {
          notify.error(err.message || 'Error al crear lead');
        }
      },
    });
  }
}
