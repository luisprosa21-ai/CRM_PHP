import { escapeHtml } from '../../utils/helpers.js';

let currentModal = null;

function getContainer() {
  let container = document.getElementById('modal-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'modal-container';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Abre un diálogo modal.
 * @param {string} title - Título del modal
 * @param {string} contentHtml - Contenido HTML del cuerpo
 * @param {Array} actions - Botones [{label, class, onClick}]
 */
export function openModal(title, contentHtml, actions = []) {
  const container = getContainer();

  const actionsHtml = actions
    .map(
      (action, i) =>
        `<button class="btn ${escapeHtml(action.class || '')}" data-modal-action="${i}">${escapeHtml(action.label)}</button>`
    )
    .join('');

  container.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3 class="modal-title">${escapeHtml(title)}</h3>
          <button class="modal-close" id="modal-close-btn" aria-label="Cerrar">&times;</button>
        </div>
        <div class="modal-body">
          ${contentHtml}
        </div>
        <div class="modal-footer">
          ${actionsHtml}
        </div>
      </div>
    </div>
  `;

  container.style.display = 'block';

  // Cerrar con botón X
  const closeBtn = container.querySelector('#modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal());
  }

  // Cerrar al hacer clic en overlay
  const overlay = container.querySelector('#modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  // Cerrar con ESC
  currentModal = handleEscKey;
  document.addEventListener('keydown', handleEscKey);

  // Vincular acciones
  container.querySelectorAll('[data-modal-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.modalAction, 10);
      if (actions[idx] && actions[idx].onClick) {
        actions[idx].onClick();
      }
    });
  });
}

function handleEscKey(e) {
  if (e.key === 'Escape') {
    closeModal();
  }
}

/**
 * Cierra el modal activo.
 */
export function closeModal() {
  const container = getContainer();
  container.innerHTML = '';
  container.style.display = 'none';

  if (currentModal) {
    document.removeEventListener('keydown', currentModal);
    currentModal = null;
  }
}

/**
 * Muestra un modal de confirmación.
 * @param {string} title - Título
 * @param {string} message - Mensaje de confirmación
 * @returns {Promise<boolean>} - true si confirma, false si cancela
 */
export function confirmModal(title, message) {
  return new Promise((resolve) => {
    openModal(
      title,
      `<p>${escapeHtml(message)}</p>`,
      [
        {
          label: 'Cancelar',
          class: 'btn-secondary',
          onClick: () => {
            closeModal();
            resolve(false);
          },
        },
        {
          label: 'Confirmar',
          class: 'btn-primary',
          onClick: () => {
            closeModal();
            resolve(true);
          },
        },
      ]
    );
  });
}
