import { portalApi } from '../../services/api.js';
import { escapeHtml, formatDate, getStatusColor } from '../../utils/helpers.js';
import * as notify from '../../services/notification.js';

const CATEGORIES = ['identity','payslip','tax_return','property_deed','bank_statement','appraisal','contract','other'];
const CAT_LABELS = { identity:'Identidad', payslip:'Nómina', tax_return:'Declaración fiscal', property_deed:'Escritura', bank_statement:'Extracto bancario', appraisal:'Tasación', contract:'Contrato', other:'Otro' };

export default async function PortalDocuments(params) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-content">
      <h1>Mis Documentos</h1>
      <div class="card">
        <div class="card-body">
          <h3>Subir Documento</h3>
          <form id="upload-form" class="form">
            <div class="form-row">
              <div class="form-group">
                <label for="doc-category">Categoría</label>
                <select id="doc-category" class="form-control">
                  ${CATEGORIES.map(c => `<option value="${c}">${escapeHtml(CAT_LABELS[c] || c)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="doc-file">Archivo</label>
                <input type="file" id="doc-file" class="form-control" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" required>
              </div>
            </div>
            <button type="submit" class="btn btn-primary" id="upload-btn">Subir Documento</button>
          </form>
        </div>
      </div>
      <div class="section">
        <h2>Documentos Subidos</h2>
        <div id="doc-list"><div class="loading-spinner"></div></div>
      </div>
    </div>`;

  loadDocuments();

  document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = document.getElementById('doc-file').files[0];
    if (!file) return;
    const btn = document.getElementById('upload-btn');
    btn.disabled = true; btn.textContent = 'Subiendo...';
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', document.getElementById('doc-category').value);
      await portalApi.upload('/documents', fd);
      notify.success('Documento subido correctamente');
      document.getElementById('upload-form').reset();
      loadDocuments();
    } catch (err) {
      notify.error('Error al subir documento');
    } finally { btn.disabled = false; btn.textContent = 'Subir Documento'; }
  });
}

async function loadDocuments() {
  try {
    const res = await portalApi.get('/documents');
    const docs = res.data || res || [];
    const container = document.getElementById('doc-list');
    if (!container) return;
    if (docs.length === 0) { container.innerHTML = '<p class="empty-state">No has subido documentos aún</p>'; return; }
    container.innerHTML = `<table class="data-table"><thead><tr>
      <th>Nombre</th><th>Categoría</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>
      ${docs.map(d => `<tr>
        <td>${escapeHtml(d.fileName || d.file_name)}</td>
        <td>${escapeHtml(d.type || d.category || '')}</td>
        <td><span class="status-badge ${getStatusColor(d.status)}">${escapeHtml(d.status)}</span></td>
        <td>${formatDate(d.createdAt || d.created_at)}</td>
      </tr>`).join('')}</tbody></table>`;
  } catch { /* silent */ }
}
