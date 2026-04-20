import { escapeHtml, getStatusColor, getStatusLabel } from '../../utils/helpers.js';

/**
 * Genera un badge HTML para un estado dado.
 * @param {string} status - Clave del estado
 * @returns {string} HTML del badge
 */
export default function statusBadge(status) {
  return `<span class="badge ${getStatusColor(status)}">${escapeHtml(getStatusLabel(status))}</span>`;
}
