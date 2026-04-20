import { crmApi } from '../../services/api.js';
import { escapeHtml, formatDate, getStatusColor, getStatusLabel } from '../../utils/helpers.js';
import renderDataTable from '../shared/DataTable.js';
import { openModal, closeModal } from '../shared/Modal.js';
import renderForm from '../shared/Form.js';
import * as notify from '../../services/notification.js';

export default async function CrmTasks(params) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-content">
      <h1>Gestión de Tareas</h1>
      <div id="tasks-table"><div class="loading-spinner"></div></div>
    </div>`;

  const tableContainer = document.getElementById('tasks-table');

  const table = renderDataTable(tableContainer, {
    columns: [
      { key: 'title', label: 'Título', sortable: true, render: (v, row) => escapeHtml(v || row.titulo || '') },
      { key: 'description', label: 'Descripción', render: (v, row) => escapeHtml((v || row.descripcion || '').slice(0, 60)) },
      { key: 'priority', label: 'Prioridad', sortable: true, render: (v, row) => {
        const p = v || row.prioridad || 'media';
        return `<span class="badge ${getStatusColor(p)}">${escapeHtml(getStatusLabel(p))}</span>`;
      }},
      { key: 'status', label: 'Estado', render: (v, row) => {
        const s = v || row.estado || 'pendiente';
        return `<span class="badge ${getStatusColor(s)}">${escapeHtml(getStatusLabel(s))}</span>`;
      }},
      { key: 'dueDate', label: 'Fecha límite', sortable: true, render: (v, row) => formatDate(v || row.fecha_limite) },
      { key: 'actions', label: 'Acción', render: (v, row) => {
        const status = row.status || row.estado;
        if (status === 'completed' || status === 'completada') return '<span class="text-muted">Completada</span>';
        return `<button class="btn btn-sm btn-success btn-complete" data-id="${escapeHtml(row.id)}">✓ Completar</button>`;
      }},
    ],
    data: [],
    searchable: true,
    loading: true,
    actions: [
      { label: '+ Nueva Tarea', class: 'btn-primary', onClick: showCreateForm },
    ],
  });

  let tasksData = [];
  try {
    const res = await crmApi.get('/tasks');
    tasksData = res.data || res || [];
    table.refresh(tasksData);
  } catch (err) {
    notify.error('Error al cargar tareas');
    table.setLoading(false);
  }

  // Bind complete buttons (delegated)
  tableContainer.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-complete');
    if (!btn) return;
    e.stopPropagation();
    const taskId = btn.dataset.id;
    try {
      await crmApi.post(`/tasks/${taskId}/complete`, {});
      notify.success('Tarea completada');
      CrmTasks(params);
    } catch (err) {
      notify.error('Error al completar tarea');
    }
  });

  function showCreateForm() {
    openModal('Nueva Tarea', '<div id="task-form-container"></div>', []);
    const formContainer = document.getElementById('task-form-container') || document.querySelector('.modal-body');

    renderForm(formContainer, {
      fields: [
        { name: 'titulo', label: 'Título', type: 'text', required: true },
        { name: 'descripcion', label: 'Descripción', type: 'textarea' },
        { name: 'asignado_a', label: 'Asignado a (ID)', type: 'number', required: true },
        { name: 'prioridad', label: 'Prioridad', type: 'select', options: [
          { value: 'baja', label: 'Baja' },
          { value: 'media', label: 'Media' },
          { value: 'alta', label: 'Alta' },
          { value: 'urgente', label: 'Urgente' },
        ], value: 'media' },
        { name: 'fecha_limite', label: 'Fecha límite', type: 'date' },
      ],
      submitLabel: 'Crear Tarea',
      async onSubmit(values) {
        try {
          values.asignado_a = parseInt(values.asignado_a, 10);
          await crmApi.post('/tasks', values);
          notify.success('Tarea creada correctamente');
          closeModal();
          CrmTasks(params);
        } catch (err) {
          notify.error(err.message || 'Error al crear tarea');
        }
      },
    });
  }
}
