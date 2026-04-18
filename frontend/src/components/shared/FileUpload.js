import { escapeHtml } from '../../utils/helpers.js';

/**
 * Renderiza un componente de subida de archivos con arrastrar y soltar.
 * @param {HTMLElement} container - Elemento contenedor
 * @param {Object} config - Configuración
 * @param {Function} config.onUpload - Callback al subir archivos
 * @param {string} [config.accept] - Tipos de archivo aceptados
 * @param {boolean} [config.multiple] - Permitir múltiples archivos
 * @param {number} [config.maxSize] - Tamaño máximo en bytes
 */
export default function renderFileUpload(container, config) {
  const { onUpload, accept = '', multiple = false, maxSize = 10 * 1024 * 1024 } = config;
  let selectedFiles = [];

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function render() {
    const acceptAttr = accept ? `accept="${escapeHtml(accept)}"` : '';
    const multipleAttr = multiple ? 'multiple' : '';

    const filesHtml = selectedFiles.length > 0
      ? `
        <div class="file-upload-list">
          <h4>Archivos seleccionados:</h4>
          <ul>
            ${selectedFiles
              .map(
                (file, i) => `
              <li class="file-upload-item">
                <span class="file-upload-name">${escapeHtml(file.name)}</span>
                <span class="file-upload-size">(${formatSize(file.size)})</span>
                <button class="btn btn-sm btn-danger file-remove-btn" data-file-index="${i}" aria-label="Eliminar">✕</button>
              </li>
            `
              )
              .join('')}
          </ul>
        </div>
      `
      : '';

    const uploadBtnHtml = selectedFiles.length > 0
      ? '<button class="btn btn-primary file-upload-submit">Subir Archivos</button>'
      : '';

    container.innerHTML = `
      <div class="file-upload">
        <div class="file-upload-dropzone" id="file-dropzone">
          <div class="file-upload-icon">📂</div>
          <p class="file-upload-text">Arrastra archivos aquí o haz clic para seleccionar</p>
          <p class="file-upload-hint">Tamaño máximo: ${formatSize(maxSize)}</p>
          <input type="file" class="file-upload-input" id="file-input" ${acceptAttr} ${multipleAttr} style="display:none;" />
        </div>
        ${filesHtml}
        ${uploadBtnHtml}
      </div>
    `;

    bindEvents();
  }

  function addFiles(fileList) {
    const newFiles = Array.from(fileList);
    const validFiles = [];
    const errors = [];

    newFiles.forEach((file) => {
      if (file.size > maxSize) {
        errors.push(`"${file.name}" excede el tamaño máximo permitido.`);
        return;
      }
      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (multiple) {
      selectedFiles = [...selectedFiles, ...validFiles];
    } else {
      selectedFiles = validFiles.slice(0, 1);
    }

    render();
  }

  function bindEvents() {
    const dropzone = container.querySelector('#file-dropzone');
    const fileInput = container.querySelector('#file-input');

    if (dropzone) {
      dropzone.addEventListener('click', () => {
        if (fileInput) fileInput.click();
      });

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('file-upload-dropzone--active');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('file-upload-dropzone--active');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('file-upload-dropzone--active');
        if (e.dataTransfer.files.length > 0) {
          addFiles(e.dataTransfer.files);
        }
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          addFiles(e.target.files);
        }
      });
    }

    // Botones de eliminar archivo
    container.querySelectorAll('.file-remove-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.fileIndex, 10);
        selectedFiles.splice(idx, 1);
        render();
      });
    });

    // Botón subir
    const submitBtn = container.querySelector('.file-upload-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        if (onUpload && selectedFiles.length > 0) {
          onUpload(selectedFiles);
        }
      });
    }
  }

  render();
}
