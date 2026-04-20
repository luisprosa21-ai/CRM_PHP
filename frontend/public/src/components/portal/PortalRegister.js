import { register } from '../../services/auth.js';
import { router } from '../../utils/router.js';
import { escapeHtml } from '../../utils/helpers.js';
import * as notify from '../../services/notification.js';

export default function PortalRegister(params) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <h2>Crear Cuenta</h2>
        <p class="auth-subtitle">Regístrate para solicitar tu hipoteca</p>
        <form id="register-form" class="form">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">Nombre</label>
              <input type="text" id="firstName" class="form-control" required>
            </div>
            <div class="form-group">
              <label for="lastName">Apellidos</label>
              <input type="text" id="lastName" class="form-control" required>
            </div>
          </div>
          <div class="form-group">
            <label for="email">Correo electrónico</label>
            <input type="email" id="email" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="phone">Teléfono</label>
            <input type="tel" id="phone" class="form-control" placeholder="+34 600 000 000">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="password">Contraseña</label>
              <input type="password" id="password" class="form-control" minlength="6" required>
            </div>
            <div class="form-group">
              <label for="confirmPassword">Confirmar contraseña</label>
              <input type="password" id="confirmPassword" class="form-control" required>
            </div>
          </div>
          <div id="reg-error" class="form-error" style="display:none"></div>
          <button type="submit" class="btn btn-primary btn-block" id="reg-btn">Registrarse</button>
        </form>
        <p class="auth-footer">¿Ya tienes cuenta? <a href="#/portal/login">Inicia sesión</a></p>
      </div>
    </div>`;

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('reg-error');
    const btn = document.getElementById('reg-btn');
    errEl.style.display = 'none';

    const data = {
      nombre: document.getElementById('firstName').value.trim(),
      apellido: document.getElementById('lastName').value.trim(),
      email: document.getElementById('email').value.trim(),
      telefono: document.getElementById('phone').value.trim(),
      password: document.getElementById('password').value,
    };
    if (data.password !== document.getElementById('confirmPassword').value) {
      errEl.textContent = 'Las contraseñas no coinciden';
      errEl.style.display = 'block';
      return;
    }
    btn.disabled = true; btn.textContent = 'Registrando...';
    try {
      await register(data);
      notify.success('Cuenta creada correctamente');
      router.navigate('/portal');
    } catch (err) {
      errEl.textContent = err.message || 'Error en el registro';
      errEl.style.display = 'block';
    } finally { btn.disabled = false; btn.textContent = 'Registrarse'; }
  });
}
