import { store } from '../../utils/state.js';
import { router } from '../../utils/router.js';
import { escapeHtml } from '../../utils/helpers.js';

const sidebarLinks = [
  { icon: '📊', label: 'Dashboard', hash: '#/crm' },
  { icon: '📋', label: 'Leads', hash: '#/crm/leads' },
  { icon: '👥', label: 'Clientes', hash: '#/crm/clients' },
  { icon: '📁', label: 'Expedientes', hash: '#/crm/expedientes' },
  { icon: '✅', label: 'Tareas', hash: '#/crm/tasks' },
  { icon: '💰', label: 'Ofertas', hash: '#/crm/offers' },
  { icon: '📈', label: 'Reportes', hash: '#/backoffice/reports' },
  { icon: '🔍', label: 'Auditoría', hash: '#/backoffice/audit' },
];

/**
 * Renderiza la barra lateral del CRM.
 * Muestra enlaces de navegación con iconos y estado activo.
 */
export default function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  const navContainer = document.getElementById('sidebar-nav');

  if (!sidebar || !navContainer) return;

  const currentHash = window.location.hash || '#/crm';

  const isActive = (hash) => {
    if (hash === '#/crm') {
      return currentHash === '#/crm' || currentHash === '#/crm/' ? 'active' : '';
    }
    return currentHash.startsWith(hash) ? 'active' : '';
  };

  const linksHtml = sidebarLinks
    .map(
      (link) => `
      <a href="${link.hash}" class="sidebar-link ${isActive(link.hash)}" data-route="${escapeHtml(link.hash)}">
        <span class="sidebar-icon">${link.icon}</span>
        <span class="sidebar-label">${escapeHtml(link.label)}</span>
      </a>
    `
    )
    .join('');

  navContainer.innerHTML = linksHtml;

  // Mostrar sidebar
  sidebar.style.display = 'block';

  // Escuchar cambios de ruta para actualizar estado activo
  window.addEventListener('hashchange', () => renderSidebar(), { once: true });
}
