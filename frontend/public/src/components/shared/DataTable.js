import { escapeHtml, debounce } from '../../utils/helpers.js';

/**
 * Renderiza una tabla de datos reutilizable con búsqueda, ordenación y paginación.
 * @param {HTMLElement} container - Elemento contenedor
 * @param {Object} config - Configuración de la tabla
 * @returns {{ refresh: Function, setLoading: Function, getSearchTerm: Function }}
 */
export default function renderDataTable(container, config) {
  let {
    columns = [],
    data = [],
    actions = [],
    onRowClick,
    searchable = false,
    pagination = null,
    emptyMessage = 'No se encontraron registros.',
    loading = false,
  } = config;

  let searchTerm = '';
  let sortKey = null;
  let sortDirection = 'asc';

  function getFilteredData() {
    let filtered = [...data];

    if (searchable && searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((row) =>
        columns.some((col) => {
          const val = row[col.key];
          return val != null && String(val).toLowerCase().includes(term);
        })
      );
    }

    if (sortKey) {
      filtered.sort((a, b) => {
        const aVal = a[sortKey] ?? '';
        const bVal = b[sortKey] ?? '';
        const cmp = String(aVal).localeCompare(String(bVal), 'es', { numeric: true });
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return filtered;
  }

  function renderToolbar() {
    let html = '<div class="datatable-toolbar">';

    if (searchable) {
      html += `
        <div class="datatable-search">
          <input type="text" class="datatable-search-input" placeholder="Buscar..." value="${escapeHtml(searchTerm)}" />
        </div>
      `;
    }

    if (actions.length > 0) {
      html += '<div class="datatable-actions">';
      actions.forEach((action, i) => {
        html += `<button class="btn ${escapeHtml(action.class || '')}" data-action-index="${i}">${escapeHtml(action.label)}</button>`;
      });
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function renderHeader() {
    let html = '<thead><tr>';
    columns.forEach((col) => {
      const sortable = col.sortable ? 'datatable-sortable' : '';
      let sortIcon = '';
      if (col.sortable) {
        if (sortKey === col.key) {
          sortIcon = sortDirection === 'asc' ? ' ▲' : ' ▼';
        } else {
          sortIcon = ' ⇅';
        }
      }
      html += `<th class="${sortable}" data-sort-key="${escapeHtml(col.key)}">${escapeHtml(col.label)}${sortIcon}</th>`;
    });
    if (config.actions && config.actions.length > 0) {
      // No row-level actions column header needed if actions are toolbar-level
    }
    if (onRowClick || (config.rowActions && config.rowActions.length > 0)) {
      // placeholder
    }
    html += '</tr></thead>';
    return html;
  }

  function renderBody(filteredData) {
    if (filteredData.length === 0) {
      return `<tbody><tr><td colspan="${columns.length}" class="datatable-empty">${escapeHtml(emptyMessage)}</td></tr></tbody>`;
    }

    let html = '<tbody>';
    filteredData.forEach((row, rowIndex) => {
      const clickable = onRowClick ? 'datatable-row-clickable' : '';
      html += `<tr class="datatable-row ${clickable}" data-row-index="${rowIndex}">`;
      columns.forEach((col) => {
        const rawValue = row[col.key];
        let cellContent;
        if (col.render && typeof col.render === 'function') {
          cellContent = col.render(rawValue, row);
        } else {
          cellContent = escapeHtml(rawValue != null ? String(rawValue) : '');
        }
        html += `<td>${cellContent}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody>';
    return html;
  }

  function renderPagination() {
    if (!pagination) return '';

    const { page = 1, pageSize = 10, total = 0 } = pagination;
    const totalPages = Math.ceil(total / pageSize) || 1;

    let html = '<div class="datatable-pagination">';
    html += `<span class="datatable-pagination-info">Página ${page} de ${totalPages} (${total} registros)</span>`;
    html += '<div class="datatable-pagination-controls">';
    html += `<button class="btn btn-sm datatable-prev" ${page <= 1 ? 'disabled' : ''}>← Anterior</button>`;
    html += `<button class="btn btn-sm datatable-next" ${page >= totalPages ? 'disabled' : ''}>Siguiente →</button>`;
    html += '</div></div>';
    return html;
  }

  function renderLoading() {
    return `
      <div class="datatable-loading">
        <div class="datatable-spinner"></div>
        <p>Cargando datos...</p>
      </div>
    `;
  }

  function render() {
    if (loading) {
      container.innerHTML = renderLoading();
      return;
    }

    const filtered = getFilteredData();

    container.innerHTML = `
      <div class="datatable">
        ${renderToolbar()}
        <div class="datatable-wrapper">
          <table class="datatable-table">
            ${renderHeader()}
            ${renderBody(filtered)}
          </table>
        </div>
        ${renderPagination()}
      </div>
    `;

    bindEvents(filtered);
  }

  function bindEvents(filteredData) {
    // Búsqueda
    const searchInput = container.querySelector('.datatable-search-input');
    if (searchInput) {
      searchInput.addEventListener(
        'input',
        debounce((e) => {
          searchTerm = e.target.value;
          render();
        }, 300)
      );
    }

    // Ordenación
    container.querySelectorAll('.datatable-sortable').forEach((th) => {
      th.addEventListener('click', () => {
        const key = th.dataset.sortKey;
        if (sortKey === key) {
          sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          sortKey = key;
          sortDirection = 'asc';
        }
        render();
      });
    });

    // Click en fila
    if (onRowClick) {
      container.querySelectorAll('.datatable-row-clickable').forEach((tr) => {
        tr.addEventListener('click', () => {
          const index = parseInt(tr.dataset.rowIndex, 10);
          onRowClick(filteredData[index]);
        });
      });
    }

    // Acciones de toolbar
    container.querySelectorAll('[data-action-index]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.actionIndex, 10);
        if (actions[idx] && actions[idx].onClick) {
          actions[idx].onClick();
        }
      });
    });

    // Paginación
    const prevBtn = container.querySelector('.datatable-prev');
    const nextBtn = container.querySelector('.datatable-next');
    if (prevBtn && pagination && pagination.onPageChange) {
      prevBtn.addEventListener('click', () => {
        if (pagination.page > 1) {
          pagination.onPageChange(pagination.page - 1);
        }
      });
    }
    if (nextBtn && pagination && pagination.onPageChange) {
      nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(pagination.total / pagination.pageSize) || 1;
        if (pagination.page < totalPages) {
          pagination.onPageChange(pagination.page + 1);
        }
      });
    }
  }

  render();

  return {
    refresh(newData) {
      data = newData;
      loading = false;
      render();
    },
    setLoading(isLoading) {
      loading = isLoading;
      render();
    },
    getSearchTerm() {
      return searchTerm;
    },
  };
}
