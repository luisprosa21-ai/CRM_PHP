import { login, isAuthenticated } from '../../services/auth.js';
import { router } from '../../utils/router.js';
import { escapeHtml } from '../../utils/helpers.js';
import * as notify from '../../services/notification.js';

export default function PortalLogin(params) {
  const app = document.getElementById('app');
  if (isAuthenticated()) { router.navigate('/portal'); return; }

  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <h2>Portal del Cliente</h2>
        <p class="auth-subtitle">Accede a tu espacio personal</p>
        <form id="login-form" class="form">
          <div class="form-group">
            <label for="email">Correo electrónico</label>
            <input type="email" id="email" class="form-control" placeholder="tu@email.com" required>
          </div>
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input type="password" id="password" class="form-control" placeholder="Tu contraseña" required>
          </div>
          <div id="login-error" class="form-error" style="display:none"></div>
          <button type="submit" class="btn btn-primary btn-block" id="login-btn">Iniciar Sesión</button>
        </form>
        <p class="auth-footer">¿No tienes cuenta? <a href="#/portal/register">Regístrate aquí</a></p>
        <p class="auth-footer"><a href="#/crm/login">Acceso CRM interno →</a></p>
      </div>
    </div>`;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    errEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Accediendo...';
    try {
      await login(email, password, 'portal');
      notify.success('Bienvenido');
      router.navigate('/portal');
    } catch (err) {
      errEl.textContent = err.message || 'Credenciales incorrectas';
      errEl.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Iniciar Sesión';
    }
  });
}
