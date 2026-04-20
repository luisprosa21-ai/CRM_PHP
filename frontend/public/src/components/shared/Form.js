import { escapeHtml, validateEmail, validatePhone } from '../../utils/helpers.js';

/**
 * Renderiza un formulario dinámico con validación.
 * @param {HTMLElement} container - Elemento contenedor
 * @param {Object} config - Configuración del formulario
 * @returns {{ getValues: Function, setValues: Function, setLoading: Function, reset: Function }}
 */
export default function renderForm(container, config) {
  let {
    fields = [],
    onSubmit,
    submitLabel = 'Guardar',
    loading = false,
  } = config;

  let errors = {};

  function renderField(field) {
    const value = field.value != null ? field.value : '';
    const escapedName = escapeHtml(field.name);
    const escapedLabel = escapeHtml(field.label);
    const escapedPlaceholder = escapeHtml(field.placeholder || '');
    const requiredMark = field.required ? '<span class="form-required">*</span>' : '';
    const errorHtml = errors[field.name]
      ? `<span class="form-error">${escapeHtml(errors[field.name])}</span>`
      : '';
    const errorClass = errors[field.name] ? 'form-field--error' : '';

    let inputHtml = '';

    switch (field.type) {
      case 'select':
        inputHtml = `<select class="form-control" name="${escapedName}" id="field-${escapedName}">
          <option value="">${escapeHtml(field.placeholder || '-- Seleccionar --')}</option>
          ${(field.options || [])
            .map(
              (opt) => {
                const optValue = typeof opt === 'object' ? opt.value : opt;
                const optLabel = typeof opt === 'object' ? opt.label : opt;
                const selected = String(value) === String(optValue) ? 'selected' : '';
                return `<option value="${escapeHtml(String(optValue))}" ${selected}>${escapeHtml(String(optLabel))}</option>`;
              }
            )
            .join('')}
        </select>`;
        break;

      case 'textarea':
        inputHtml = `<textarea class="form-control" name="${escapedName}" id="field-${escapedName}" placeholder="${escapedPlaceholder}" rows="4">${escapeHtml(String(value))}</textarea>`;
        break;

      case 'checkbox':
        inputHtml = `<label class="form-checkbox-label">
          <input type="checkbox" name="${escapedName}" id="field-${escapedName}" ${value ? 'checked' : ''} />
          ${escapedLabel}
        </label>`;
        break;

      default:
        inputHtml = `<input type="${escapeHtml(field.type || 'text')}" class="form-control" name="${escapedName}" id="field-${escapedName}" placeholder="${escapedPlaceholder}" value="${escapeHtml(String(value))}" />`;
        break;
    }

    const labelHtml = field.type !== 'checkbox'
      ? `<label class="form-label" for="field-${escapedName}">${escapedLabel} ${requiredMark}</label>`
      : '';

    return `
      <div class="form-group ${errorClass}">
        ${labelHtml}
        ${inputHtml}
        ${errorHtml}
      </div>
    `;
  }

  function validate() {
    errors = {};
    let valid = true;

    fields.forEach((field) => {
      const el = container.querySelector(`[name="${field.name}"]`);
      if (!el) return;

      const val = field.type === 'checkbox' ? el.checked : el.value.trim();

      if (field.required && (val === '' || val === false)) {
        errors[field.name] = `${field.label} es obligatorio.`;
        valid = false;
      }

      if (field.type === 'email' && val && !validateEmail(val)) {
        errors[field.name] = 'El formato de email no es válido.';
        valid = false;
      }

      if (field.type === 'tel' && val && !validatePhone(val)) {
        errors[field.name] = 'El formato de teléfono no es válido.';
        valid = false;
      }
    });

    return valid;
  }

  function getValues() {
    const values = {};
    fields.forEach((field) => {
      const el = container.querySelector(`[name="${field.name}"]`);
      if (!el) return;
      values[field.name] = field.type === 'checkbox' ? el.checked : el.value;
    });
    return values;
  }

  function render() {
    const fieldsHtml = fields.map(renderField).join('');

    container.innerHTML = `
      <form class="form" novalidate>
        ${fieldsHtml}
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" ${loading ? 'disabled' : ''}>
            ${loading ? '<span class="spinner-sm"></span> Procesando...' : escapeHtml(submitLabel)}
          </button>
        </div>
      </form>
    `;

    const form = container.querySelector('form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validate()) {
          if (onSubmit) onSubmit(getValues());
        } else {
          render();
        }
      });
    }
  }

  render();

  return {
    getValues,
    setValues(obj) {
      fields = fields.map((f) => ({
        ...f,
        value: obj[f.name] !== undefined ? obj[f.name] : f.value,
      }));
      render();
    },
    setLoading(isLoading) {
      loading = isLoading;
      render();
    },
    reset() {
      fields = fields.map((f) => ({ ...f, value: '' }));
      errors = {};
      render();
    },
  };
}
