import { store } from '../../utils/state.js';
import { router } from '../../utils/router.js';
import { escapeHtml } from '../../utils/helpers.js';
import { logout, isAuthenticated, getUserRole } from '../../services/auth.js';

/**
 * Renderiza la barra de navegación principal.
 * Muestra enlaces según el rol del usuario autenticado.
 */
export default function renderNavbar() {
  const container = document.getElementById('navbar');
  if (!container) return;

  const authenticated = isAuthenticated();
  const role = getUserRole();
  const currentHash = window.location.hash || '#/';
  const user = store.getState('user');

  const isActive = (path) => currentHash.startsWith(path) ? 'active' : '';

  let linksHtml = '';

  if (!authenticated) {
    linksHtml = `
      <a href="#/portal/login" class="nav-link ${isActive('#/portal/login')}">Portal Login</a>
      <a href="#/crm/login" class="nav-link ${isActive('#/crm/login')}">CRM Acceso</a>
    `;
  } else if (role === 'client') {
    linksHtml = `
      <a href="#/portal" class="nav-link ${isActive('#/portal')}">Portal</a>
      <a href="#/portal/expedientes" class="nav-link ${isActive('#/portal/expedientes')}">Mis Expedientes</a>
      <a href="#/portal/documentos" class="nav-link ${isActive('#/portal/documentos')}">Documentos</a>
    `;
  } else if (role === 'advisor') {
    linksHtml = `
      <a href="#/crm" class="nav-link ${isActive('#/crm')}">CRM Dashboard</a>
      <a href="#/crm/leads" class="nav-link ${isActive('#/crm/leads')}">Leads</a>
      <a href="#/crm/clients" class="nav-link ${isActive('#/crm/clients')}">Clientes</a>
      <a href="#/crm/expedientes" class="nav-link ${isActive('#/crm/expedientes')}">Expedientes</a>
      <a href="#/crm/tasks" class="nav-link ${isActive('#/crm/tasks')}">Tareas</a>
    `;
  } else if (role === 'admin' || role === 'manager') {
    linksHtml = `
      <a href="#/crm" class="nav-link ${isActive('#/crm')}">CRM Dashboard</a>
      <a href="#/crm/leads" class="nav-link ${isActive('#/crm/leads')}">Leads</a>
      <a href="#/crm/clients" class="nav-link ${isActive('#/crm/clients')}">Clientes</a>
      <a href="#/crm/expedientes" class="nav-link ${isActive('#/crm/expedientes')}">Expedientes</a>
      <a href="#/crm/tasks" class="nav-link ${isActive('#/crm/tasks')}">Tareas</a>
      <a href="#/backoffice" class="nav-link ${isActive('#/backoffice')}">Backoffice</a>
    `;
  }

  const userName = user ? escapeHtml(user.name || user.email || '') : '';

  const userDropdownHtml = authenticated
    ? `
      <div class="nav-user-dropdown">
        <button class="nav-user-btn" id="nav-user-toggle">
          <span class="nav-user-name">${userName}</span>
          <span class="nav-user-arrow">▼</span>
        </button>
        <div class="nav-dropdown-menu" id="nav-dropdown-menu" style="display:none;">
          <a href="#/perfil" class="nav-dropdown-item">Mi Perfil</a>
          <button class="nav-dropdown-item nav-logout-btn" id="nav-logout-btn">Cerrar Sesión</button>
        </div>
      </div>
    `
    : '';

  container.innerHTML = `
    <nav class="navbar">
      <div class="navbar-brand">
        <a href="#/" class="navbar-logo">CRM Hipotecario</a>
        <button class="navbar-toggle" id="navbar-toggle" aria-label="Menú">☰</button>
      </div>
      <div class="navbar-links" id="navbar-links">
        ${linksHtml}
      </div>
      ${userDropdownHtml}
    </nav>
  `;

  // Toggle menú móvil
  const toggleBtn = container.querySelector('#navbar-toggle');
  const navLinks = container.querySelector('#navbar-links');
  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('navbar-links--open');
    });
  }

  // Toggle dropdown de usuario
  const userToggle = container.querySelector('#nav-user-toggle');
  const dropdownMenu = container.querySelector('#nav-dropdown-menu');
  if (userToggle && dropdownMenu) {
    userToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = dropdownMenu.style.display !== 'none';
      dropdownMenu.style.display = isVisible ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
      dropdownMenu.style.display = 'none';
    });
  }

  // Cerrar sesión
  const logoutBtn = container.querySelector('#nav-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logout();
      router.navigate('#/');
      renderNavbar();
    });
  }

  // Re-renderizar al cambiar autenticación o ruta
  store.subscribe('user', () => renderNavbar());
  window.addEventListener('hashchange', () => renderNavbar(), { once: true });
}
