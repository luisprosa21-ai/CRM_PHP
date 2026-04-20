import { crmApi } from '../../services/api.js';
import { store } from '../../utils/state.js';
import { router } from '../../utils/router.js';
import { escapeHtml, formatCurrency, formatDate, getStatusColor, getStatusLabel, timeAgo } from '../../utils/helpers.js';
import kpiCard from '../shared/KPICard.js';
import * as notify from '../../services/notification.js';

export default async function CrmDashboard(params) {
  const app = document.getElementById('app');
  const user = store.getState('user');
  const name = user ? escapeHtml(user.firstName || user.name || 'Asesor') : 'Asesor';

  app.innerHTML = `
    <div class="page-content crm-dashboard">
      <h1>Dashboard CRM</h1>
      <p class="subtitle">Hola, ${name}. Aquí tienes un resumen de tu actividad.</p>
      <div id="kpi-container" class="kpi-grid"><div class="loading-spinner"></div></div>
      <div class="dashboard-grid">
        <div class="section">
          <h2>Leads Recientes</h2>
          <div id="recent-leads"><div class="loading-spinner"></div></div>
        </div>
        <div class="section">
          <h2>Tareas Pendientes</h2>
          <div id="pending-tasks"><div class="loading-spinner"></div></div>
        </div>
      </div>
      <div class="section">
        <h2>Expedientes Recientes</h2>
        <div id="recent-expedientes"><div class="loading-spinner"></div></div>
      </div>
    </div>`;

  try {
    const res = await crmApi.get('/dashboard');
    const data = res.data || res;

    const leads = data.recentLeads || [];
    const expedientes = data.recentExpedientes || [];
    const tasks = data.pendingTasks || [];
    const offers = data.recentOffers || [];

    // KPIs
    const kpiContainer = document.getElementById('kpi-container');
    if (kpiContainer) {
      kpiContainer.innerHTML = [
        kpiCard({ title: 'Leads Activos', value: leads.length, icon: '📋', color: '#3b82f6' }),
        kpiCard({ title: 'Expedientes', value: expedientes.length, icon: '📁', color: '#10b981' }),
        kpiCard({ title: 'Tareas Pendientes', value: tasks.length, icon: '✅', color: '#f59e0b' }),
        kpiCard({ title: 'Ofertas Recibidas', value: offers.length, icon: '💰', color: '#8b5cf6' }),
      ].join('');
    }

    // Recent leads
    const leadsContainer = document.getElementById('recent-leads');
    if (leadsContainer) {
      if (leads.length === 0) {
        leadsContainer.innerHTML = '<p class="empty-state">No hay leads recientes</p>';
      } else {
        leadsContainer.innerHTML = `<table class="data-table"><thead><tr>
          <th>Nombre</th><th>Email</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>
          ${leads.map(l => `<tr class="datatable-row-clickable" data-id="${escapeHtml(l.id)}">
            <td>${escapeHtml(l.fullName || l.nombre || l.name || '')}</td>
            <td>${escapeHtml(l.email || '')}</td>
            <td><span class="badge ${getStatusColor(l.status || l.estado)}">${escapeHtml(getStatusLabel(l.status || l.estado))}</span></td>
            <td>${timeAgo(l.createdAt || l.created_at)}</td>
          </tr>`).join('')}</tbody></table>`;
        leadsContainer.querySelectorAll('.datatable-row-clickable').forEach(row => {
          row.addEventListener('click', () => router.navigate(`/crm/leads/${row.dataset.id}`));
        });
      }
    }

    // Pending tasks
    const tasksContainer = document.getElementById('pending-tasks');
    if (tasksContainer) {
      if (tasks.length === 0) {
        tasksContainer.innerHTML = '<p class="empty-state">No hay tareas pendientes</p>';
      } else {
        tasksContainer.innerHTML = `<ul class="task-list">${tasks.map(t => `
          <li class="task-item ${t.priority === 'urgent' || t.prioridad === 'urgente' ? 'task-urgent' : ''}">
            <span class="task-title">${escapeHtml(t.title || t.titulo || '')}</span>
            <span class="badge ${getStatusColor(t.priority || t.prioridad || 'media')}">${escapeHtml(getStatusLabel(t.priority || t.prioridad || 'media'))}</span>
            ${t.dueDate || t.fecha_limite ? `<span class="task-due">${formatDate(t.dueDate || t.fecha_limite)}</span>` : ''}
          </li>`).join('')}</ul>`;
      }
    }

    // Recent expedientes
    const expContainer = document.getElementById('recent-expedientes');
    if (expContainer) {
      if (expedientes.length === 0) {
        expContainer.innerHTML = '<p class="empty-state">No hay expedientes recientes</p>';
      } else {
        expContainer.innerHTML = `<div class="cards-grid">${expedientes.map(exp => `
          <div class="card card-clickable" data-id="${escapeHtml(exp.id)}">
            <div class="card-header">
              <span class="badge ${getStatusColor(exp.status || exp.estado)}">${escapeHtml(getStatusLabel(exp.status || exp.estado))}</span>
            </div>
            <div class="card-body">
              <p><strong>Importe:</strong> ${formatCurrency(exp.requestedAmount || exp.monto_solicitado)}</p>
              <p><strong>Cliente:</strong> ${escapeHtml(exp.clientName || exp.nombre_cliente || '')}</p>
              <p><small>${timeAgo(exp.createdAt || exp.created_at)}</small></p>
            </div>
          </div>`).join('')}</div>`;
        expContainer.querySelectorAll('.card-clickable').forEach(card => {
          card.addEventListener('click', () => router.navigate(`/crm/expedientes/${card.dataset.id}`));
        });
      }
    }
  } catch (err) {
    notify.error('Error al cargar el dashboard');
  }
}
