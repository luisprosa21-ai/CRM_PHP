import { login, isAuthenticated, getUserRole } from '../../services/auth.js';
import { router } from '../../utils/router.js';
import { escapeHtml } from '../../utils/helpers.js';
import * as notify from '../../services/notification.js';

export default function CrmLogin(params) {
  const app = document.getElementById('app');
  if (isAuthenticated()) {
    const role = getUserRole();
    if (role === 'admin' || role === 'manager') {
      router.navigate('/backoffice');
    } else {
      router.navigate('/crm');
    }
    return;
  }

  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <h2>CRM Hipotecario</h2>
        <p class="auth-subtitle">Acceso para asesores y gestores</p>
        <form id="crm-login-form" class="form">
          <div class="form-group">
            <label for="email">Correo electrónico</label>
            <input type="email" id="email" class="form-control" placeholder="tu@empresa.com" required>
          </div>
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input type="password" id="password" class="form-control" placeholder="Tu contraseña" required>
          </div>
          <div id="login-error" class="form-error" style="display:none"></div>
          <button type="submit" class="btn btn-primary btn-block" id="login-btn">Acceder al CRM</button>
        </form>
        <p class="auth-footer"><a href="#/portal/login">← Volver al portal de cliente</a></p>
      </div>
    </div>`;

  document.getElementById('crm-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    errEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Accediendo...';
    try {
      const { user } = await login(email, password, 'crm');
      notify.success('Bienvenido al CRM');
      const role = user?.role || user?.rol || 'advisor';
      if (role === 'admin' || role === 'manager') {
        router.navigate('/backoffice');
      } else {
        router.navigate('/crm');
      }
    } catch (err) {
      errEl.textContent = err.message || 'Credenciales incorrectas';
      errEl.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Acceder al CRM';
    }
  });
}
