import { escapeHtml } from '../../utils/helpers.js';

/**
 * Genera el HTML de una tarjeta KPI.
 * @param {Object} params - Configuración de la tarjeta
 * @param {string} params.title - Título del KPI
 * @param {string|number} params.value - Valor principal
 * @param {string} [params.icon] - Icono (emoji o clase)
 * @param {string} [params.trend] - Texto de tendencia (ej: "+12%")
 * @param {string} [params.trendDirection] - "up" | "down" | "neutral"
 * @param {string} [params.color] - Color del borde/acento
 * @returns {string} HTML de la tarjeta
 */
export default function kpiCard({ title, value, icon, trend, trendDirection, color }) {
  const colorStyle = color ? `border-left: 4px solid ${escapeHtml(color)}` : '';
  const trendClass = trendDirection === 'up'
    ? 'kpi-trend--up'
    : trendDirection === 'down'
      ? 'kpi-trend--down'
      : 'kpi-trend--neutral';

  const trendIcon = trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '→';

  const trendHtml = trend
    ? `<div class="kpi-trend ${trendClass}"><span class="kpi-trend-icon">${trendIcon}</span> ${escapeHtml(String(trend))}</div>`
    : '';

  const iconHtml = icon ? `<div class="kpi-icon">${escapeHtml(String(icon))}</div>` : '';

  return `
    <div class="kpi-card" style="${colorStyle}">
      <div class="kpi-header">
        ${iconHtml}
        <span class="kpi-title">${escapeHtml(String(title))}</span>
      </div>
      <div class="kpi-value">${escapeHtml(String(value))}</div>
      ${trendHtml}
    </div>
  `;
}
