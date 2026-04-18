/**
 * Notification / toast service.
 */

const CONTAINER_ID = 'toast-container';

function getContainer() {
  let el = document.getElementById(CONTAINER_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = CONTAINER_ID;
    el.className = 'toast-container';
    document.body.appendChild(el);
  }
  return el;
}

export function show(message, type = 'info', duration = 3000) {
  const container = getContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Cerrar">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => dismiss(toast));

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-show'));

  if (duration > 0) {
    setTimeout(() => dismiss(toast), duration);
  }

  return toast;
}

function dismiss(toast) {
  toast.classList.remove('toast-show');
  toast.classList.add('toast-hide');
  setTimeout(() => toast.remove(), 300);
}

export function success(message, duration) {
  return show(message, 'success', duration);
}

export function error(message, duration = 5000) {
  return show(message, 'error', duration);
}

export function warning(message, duration = 4000) {
  return show(message, 'warning', duration);
}

export function info(message, duration) {
  return show(message, 'info', duration);
}
