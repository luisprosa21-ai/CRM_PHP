/**
 * CRM Hipotecario — SPA Entry Point
 * Initialises authentication, routing, navigation and sidebar.
 */

import { router } from './utils/router.js';
import { store } from './utils/state.js';
import { initAuth, isAuthenticated, getUserRole, logout } from './services/auth.js';
import renderNavbar from './components/shared/Navbar.js';
import renderSidebar from './components/shared/Sidebar.js';

// ─── Portal pages ─────────────────────────────────────────────────────────────
import PortalLogin from './components/portal/PortalLogin.js';
import PortalRegister from './components/portal/PortalRegister.js';
import PortalDashboard from './components/portal/PortalDashboard.js';
import PortalExpedientes from './components/portal/PortalExpedientes.js';
import PortalExpedienteDetail from './components/portal/PortalExpedienteDetail.js';
import PortalDocuments from './components/portal/PortalDocuments.js';
import PortalOffers from './components/portal/PortalOffers.js';

// ─── CRM pages ────────────────────────────────────────────────────────────────
import CrmLogin from './components/crm/CrmLogin.js';
import CrmDashboard from './components/crm/CrmDashboard.js';
import CrmLeads from './components/crm/CrmLeads.js';
import CrmLeadDetail from './components/crm/CrmLeadDetail.js';
import CrmClients from './components/crm/CrmClients.js';
import CrmClientDetail from './components/crm/CrmClientDetail.js';
import CrmExpedientes from './components/crm/CrmExpedientes.js';
import CrmExpedienteDetail from './components/crm/CrmExpedienteDetail.js';
import CrmTasks from './components/crm/CrmTasks.js';
import CrmOffers from './components/crm/CrmOffers.js';

// ─── Backoffice pages ─────────────────────────────────────────────────────────
import BackofficeDashboard from './components/backoffice/BackofficeDashboard.js';
import BackofficeReports from './components/backoffice/BackofficeReports.js';
import BackofficeAudit from './components/backoffice/BackofficeAudit.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Show or hide the sidebar depending on the current section. */
function updateLayout() {
  const sidebar = document.getElementById('sidebar');
  const hash = window.location.hash || '#/';
  const isCrmOrBackoffice = hash.startsWith('#/crm') || hash.startsWith('#/backoffice');
  const isLoginPage = hash.includes('/login');

  if (sidebar) {
    if (isCrmOrBackoffice && !isLoginPage && isAuthenticated()) {
      sidebar.classList.remove('hidden');
      renderSidebar();
    } else {
      sidebar.classList.add('hidden');
    }
  }

  // Add layout class to main content
  const mainContent = document.getElementById('app');
  if (mainContent) {
    if (isCrmOrBackoffice && !isLoginPage && isAuthenticated()) {
      mainContent.classList.add('with-sidebar');
    } else {
      mainContent.classList.remove('with-sidebar');
    }
  }
}

// ─── Route Guard ──────────────────────────────────────────────────────────────

const PUBLIC_ROUTES = ['/', '/portal/login', '/portal/register', '/crm/login'];

router.beforeEach = (path) => {
  const isPublic = PUBLIC_ROUTES.includes(path);

  if (!isPublic && !isAuthenticated()) {
    // Redirect to appropriate login
    if (path.startsWith('/crm') || path.startsWith('/backoffice')) {
      router.navigate('/crm/login');
    } else {
      router.navigate('/portal/login');
    }
    return false;
  }

  // Role-based access control
  if (isAuthenticated()) {
    const role = getUserRole();
    if (path.startsWith('/backoffice') && role !== 'admin' && role !== 'manager') {
      router.navigate('/crm');
      return false;
    }
  }

  // Update layout after each navigation
  setTimeout(updateLayout, 0);
  return true;
};

// ─── Register Routes ──────────────────────────────────────────────────────────

// Public / Landing
router.addRoute('/', (params) => {
  if (isAuthenticated()) {
    const role = getUserRole();
    if (role === 'client') {
      router.navigate('/portal');
    } else if (role === 'admin' || role === 'manager') {
      router.navigate('/backoffice');
    } else {
      router.navigate('/crm');
    }
  } else {
    router.navigate('/portal/login');
  }
});

// Portal routes
router.addRoute('/portal/login', PortalLogin);
router.addRoute('/portal/register', PortalRegister);
router.addRoute('/portal', PortalDashboard);
router.addRoute('/portal/expedientes', PortalExpedientes);
router.addRoute('/portal/expedientes/:id', PortalExpedienteDetail);
router.addRoute('/portal/documents', PortalDocuments);
router.addRoute('/portal/documentos', PortalDocuments);
router.addRoute('/portal/offers/:id', PortalOffers);

// CRM routes
router.addRoute('/crm/login', CrmLogin);
router.addRoute('/crm', CrmDashboard);
router.addRoute('/crm/leads', CrmLeads);
router.addRoute('/crm/leads/:id', CrmLeadDetail);
router.addRoute('/crm/clients', CrmClients);
router.addRoute('/crm/clients/:id', CrmClientDetail);
router.addRoute('/crm/expedientes', CrmExpedientes);
router.addRoute('/crm/expedientes/:id', CrmExpedienteDetail);
router.addRoute('/crm/tasks', CrmTasks);
router.addRoute('/crm/offers', CrmOffers);
router.addRoute('/crm/offers/:id', CrmOffers);

// Backoffice routes
router.addRoute('/backoffice', BackofficeDashboard);
router.addRoute('/backoffice/reports', BackofficeReports);
router.addRoute('/backoffice/audit', BackofficeAudit);

// ─── Bootstrap ────────────────────────────────────────────────────────────────

initAuth();
renderNavbar();
  // Re-renderizar al cambiar autenticación o ruta
  store.subscribe('user', () => renderNavbar());
  window.addEventListener('hashchange', () => renderNavbar(), { once: true });
updateLayout();
router.start();
