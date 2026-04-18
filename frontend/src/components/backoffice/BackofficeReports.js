import { backofficeApi } from '../../services/api.js';
import { escapeHtml, formatCurrency } from '../../utils/helpers.js';
import renderDataTable from '../shared/DataTable.js';
import * as notify from '../../services/notification.js';

export default async function BackofficeReports(params) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-content">
      <h1>Reportes y Analítica</h1>
      <div class="tabs">
        <button class="tab-btn active" data-tab="pipeline">Pipeline</button>
        <button class="tab-btn" data-tab="conversion">Conversión</button>
        <button class="tab-btn" data-tab="advisors">Asesores</button>
      </div>
      <div id="tab-content"><div class="loading-spinner"></div></div>
    </div>`;

  let currentTab = 'pipeline';

  // Tab switching
  app.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      app.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
      loadTab(currentTab);
    });
  });

  await loadTab('pipeline');

  async function loadTab(tab) {
    const container = document.getElementById('tab-content');
    if (!container) return;
    container.innerHTML = '<div class="loading-spinner"></div>';

    try {
      if (tab === 'pipeline') {
        const res = await backofficeApi.get('/reports/pipeline');
        const data = res.data || res;
        const stages = Array.isArray(data) ? data : data.stages || data.etapas || [];

        if (stages.length === 0) {
          container.innerHTML = '<p class="empty-state">Sin datos de pipeline</p>';
          return;
        }

        const maxCount = Math.max(...stages.map(s => s.count || s.cantidad || 0), 1);
        container.innerHTML = `
          <div class="report-section">
            <h2>Embudo del Pipeline</h2>
            <div class="funnel">${stages.map(s => {
              const count = s.count || s.cantidad || 0;
              const pct = ((count / maxCount) * 100).toFixed(0);
              return `
                <div class="funnel-stage">
                  <span class="funnel-label">${escapeHtml(s.name || s.nombre || s.status || '')}</span>
                  <div class="funnel-bar"><div class="funnel-bar-fill" style="width:${pct}%"></div></div>
                  <span class="funnel-value">${count}</span>
                </div>`;
            }).join('')}</div>
          </div>`;
      } else if (tab === 'conversion') {
        const res = await backofficeApi.get('/reports/conversion');
        const data = res.data || res;

        container.innerHTML = `
          <div class="report-section">
            <h2>Métricas de Conversión</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Lead → Cliente</div>
                <div class="metric-value">${Number(data.leadToClient || data.lead_a_cliente || 0)}%</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Cliente → Expediente</div>
                <div class="metric-value">${Number(data.clientToExpediente || data.cliente_a_expediente || 0)}%</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Expediente → Oferta</div>
                <div class="metric-value">${Number(data.expedienteToOffer || data.expediente_a_oferta || 0)}%</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Oferta → Firma</div>
                <div class="metric-value">${Number(data.offerToClose || data.oferta_a_firma || 0)}%</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Tiempo medio (días)</div>
                <div class="metric-value">${Number(data.avgDays || data.dias_promedio || 0)}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Volumen cerrado</div>
                <div class="metric-value">${formatCurrency(data.closedVolume || data.volumen_cerrado || 0)}</div>
              </div>
            </div>
          </div>`;
      } else if (tab === 'advisors') {
        const res = await backofficeApi.get('/reports/advisors');
        const advisors = res.data || res || [];

        if (!Array.isArray(advisors) || advisors.length === 0) {
          container.innerHTML = '<p class="empty-state">Sin datos de asesores</p>';
          return;
        }

        container.innerHTML = '<div class="report-section"><h2>Rendimiento de Asesores</h2><div id="advisors-table"></div></div>';
        const tableEl = document.getElementById('advisors-table');

        renderDataTable(tableEl, {
          columns: [
            { key: 'name', label: 'Asesor', sortable: true, render: (v, row) => escapeHtml(v || row.nombre || '') },
            { key: 'leadsAssigned', label: 'Leads', sortable: true, render: (v, row) => String(v || row.leads_asignados || 0) },
            { key: 'expedientesActive', label: 'Expedientes', sortable: true, render: (v, row) => String(v || row.expedientes_activos || 0) },
            { key: 'offersClosed', label: 'Cerrados', sortable: true, render: (v, row) => String(v || row.ofertas_cerradas || 0) },
            { key: 'conversionRate', label: 'Conversión', sortable: true, render: (v, row) => `${v || row.tasa_conversion || 0}%` },
            { key: 'volume', label: 'Volumen', sortable: true, render: (v, row) => formatCurrency(v || row.volumen || 0) },
          ],
          data: advisors,
          searchable: true,
        });
      }
    } catch (err) {
      container.innerHTML = '<p class="error">Error al cargar el reporte</p>';
      notify.error('Error al cargar reporte');
    }
  }
}
