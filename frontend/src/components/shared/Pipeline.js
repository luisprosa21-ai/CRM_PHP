import { escapeHtml } from '../../utils/helpers.js';

/**
 * Renderiza un pipeline/kanban con columnas y tarjetas.
 * @param {HTMLElement} container - Elemento contenedor
 * @param {Object} config - Configuración del pipeline
 * @param {Array} config.columns - [{key, label, color}]
 * @param {Array} config.items - [{id, title, subtitle, status, meta}]
 * @param {Function} [config.onItemClick] - Callback al hacer clic en una tarjeta
 */
export default function renderPipeline(container, config) {
  const { columns = [], items = [], onItemClick } = config;

  function getColumnItems(columnKey) {
    return items.filter((item) => item.status === columnKey);
  }

  function renderCard(item) {
    const subtitleHtml = item.subtitle
      ? `<p class="pipeline-card-subtitle">${escapeHtml(String(item.subtitle))}</p>`
      : '';
    const metaHtml = item.meta
      ? `<div class="pipeline-card-meta">${escapeHtml(String(item.meta))}</div>`
      : '';

    return `
      <div class="pipeline-card" data-item-id="${escapeHtml(String(item.id))}">
        <h4 class="pipeline-card-title">${escapeHtml(String(item.title))}</h4>
        ${subtitleHtml}
        ${metaHtml}
      </div>
    `;
  }

  function render() {
    const columnsHtml = columns
      .map((col) => {
        const colItems = getColumnItems(col.key);
        const colorStyle = col.color ? `border-top: 3px solid ${escapeHtml(col.color)}` : '';
        const cardsHtml = colItems.map(renderCard).join('');

        return `
          <div class="pipeline-column" style="${colorStyle}">
            <div class="pipeline-column-header">
              <span class="pipeline-column-title">${escapeHtml(String(col.label))}</span>
              <span class="pipeline-column-count">${colItems.length}</span>
            </div>
            <div class="pipeline-column-body">
              ${cardsHtml || '<p class="pipeline-empty">Sin elementos</p>'}
            </div>
          </div>
        `;
      })
      .join('');

    container.innerHTML = `<div class="pipeline">${columnsHtml}</div>`;

    // Vincular eventos de clic en tarjetas
    if (onItemClick) {
      container.querySelectorAll('.pipeline-card').forEach((card) => {
        card.addEventListener('click', () => {
          const itemId = card.dataset.itemId;
          const item = items.find((i) => String(i.id) === itemId);
          if (item) onItemClick(item);
        });
      });
    }
  }

  render();
}
