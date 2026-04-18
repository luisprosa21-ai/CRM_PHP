import { backofficeApi } from '../../services/api.js';
import { escapeHtml, formatCurrency } from '../../utils/helpers.js';
import kpiCard from '../shared/KPICard.js';
import * as notify from '../../services/notification.js';

export default async function BackofficeDashboard(params) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-content backoffice-dashboard">
      <h1>Panel de Dirección</h1>
      <p class="subtitle">Métricas clave del negocio</p>
      <div id="kpi-section" class="kpi-grid"><div class="loading-spinner"></div></div>
      <div class="dashboard-grid">
        <div class="section">
          <h2>Resumen de Leads</h2>
          <div id="leads-summary"><div class="loading-spinner"></div></div>
        </div>
        <div class="section">
          <h2>Resumen de Expedientes</h2>
          <div id="exp-summary"><div class="loading-spinner"></div></div>
        </div>
      </div>
      <div class="section">
        <h2>Resumen de Ofertas</h2>
        <div id="offers-summary"><div class="loading-spinner"></div></div>
      </div>
      <p id="generated-at" class="text-muted"></p>
    </div>`;

  try {
    const res = await backofficeApi.get('/reports/dashboard');
    const data = res.data || res;
    const leads = data.leads || {};
    const expedientes = data.expedientes || {};
    const offers = data.offers || {};
    const clients = data.clients || {};

    // KPIs
    const kpiSection = document.getElementById('kpi-section');
    if (kpiSection) {
      kpiSection.innerHTML = [
        kpiCard({ title: 'Total Leads', value: leads.total || leads.count || 0, icon: '📋', color: '#3b82f6', trend: leads.trend, trendDirection: leads.trendDirection || 'neutral' }),
        kpiCard({ title: 'Total Clientes', value: clients.total || clients.count || 0, icon: '👥', color: '#10b981', trend: clients.trend, trendDirection: clients.trendDirection || 'neutral' }),
        kpiCard({ title: 'Expedientes Activos', value: expedientes.active || expedientes.activos || 0, icon: '📁', color: '#f59e0b', trend: expedientes.trend, trendDirection: expedientes.trendDirection || 'neutral' }),
        kpiCard({ title: 'Ofertas Recibidas', value: offers.total || offers.count || 0, icon: '💰', color: '#8b5cf6', trend: offers.trend, trendDirection: offers.trendDirection || 'neutral' }),
        kpiCard({ title: 'Tasa Conversión', value: `${leads.conversionRate || leads.tasa_conversion || 0}%`, icon: '📈', color: '#ec4899' }),
        kpiCard({ title: 'Volumen Total', value: formatCurrency(expedientes.totalVolume || expedientes.volumen_total || 0), icon: '🏦', color: '#059669' }),
      ].join('');
    }

    // Leads summary
    const leadsSummary = document.getElementById('leads-summary');
    if (leadsSummary) {
      const byStatus = leads.byStatus || leads.por_estado || {};
      const entries = Object.entries(byStatus);
      if (entries.length === 0) {
        leadsSummary.innerHTML = '<p class="empty-state">Sin datos de leads</p>';
      } else {
        const maxCount = Math.max(...entries.map(e => e[1]), 1);
        leadsSummary.innerHTML = `<div class="summary-bars">${entries.map(([status, count]) => `
          <div class="summary-bar-item">
            <span class="summary-bar-label">${escapeHtml(status)}</span>
            <div class="summary-bar"><div class="summary-bar-fill" style="width:${Math.min(100, (count / maxCount) * 100)}%"></div></div>
            <span class="summary-bar-value">${count}</span>
          </div>`).join('')}</div>`;
      }
    }

    // Expedientes summary
    const expSummary = document.getElementById('exp-summary');
    if (expSummary) {
      const byStatus = expedientes.byStatus || expedientes.por_estado || {};
      const entries = Object.entries(byStatus);
      if (entries.length === 0) {
        expSummary.innerHTML = '<p class="empty-state">Sin datos de expedientes</p>';
      } else {
        const maxCount = Math.max(...entries.map(e => e[1]), 1);
        expSummary.innerHTML = `<div class="summary-bars">${entries.map(([status, count]) => `
          <div class="summary-bar-item">
            <span class="summary-bar-label">${escapeHtml(status)}</span>
            <div class="summary-bar"><div class="summary-bar-fill" style="width:${Math.min(100, (count / maxCount) * 100)}%"></div></div>
            <span class="summary-bar-value">${count}</span>
          </div>`).join('')}</div>`;
      }
    }

    // Offers summary
    const offersSummary = document.getElementById('offers-summary');
    if (offersSummary) {
      const accepted = offers.accepted || offers.aceptadas || 0;
      const rejected = offers.rejected || offers.rechazadas || 0;
      const pending = offers.pending || offers.pendientes || 0;
      const total = accepted + rejected + pending;
      offersSummary.innerHTML = `
        <div class="offer-stats">
          <div class="offer-stat"><span class="offer-stat-value text-success">${accepted}</span><span class="offer-stat-label">Aceptadas</span></div>
          <div class="offer-stat"><span class="offer-stat-value text-danger">${rejected}</span><span class="offer-stat-label">Rechazadas</span></div>
          <div class="offer-stat"><span class="offer-stat-value text-warning">${pending}</span><span class="offer-stat-label">Pendientes</span></div>
          <div class="offer-stat"><span class="offer-stat-value">${total}</span><span class="offer-stat-label">Total</span></div>
        </div>`;
    }

    // Generated at
    const generatedEl = document.getElementById('generated-at');
    if (generatedEl && data.generatedAt) {
      generatedEl.textContent = `Datos generados: ${new Date(data.generatedAt).toLocaleString('es-ES')}`;
    }
  } catch (err) {
    notify.error('Error al cargar el panel de dirección');
  }
}
