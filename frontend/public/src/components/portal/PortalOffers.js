import { portalApi } from '../../services/api.js';
import { escapeHtml, formatCurrency, getStatusColor } from '../../utils/helpers.js';
import * as notify from '../../services/notification.js';

export default async function PortalOffers(params) {
  const app = document.getElementById('app');
  const expId = params.id;
  app.innerHTML = '<div class="page-content"><div class="loading-spinner"></div></div>';

  try {
    const res = await portalApi.get(`/offers/${expId}`);
    const offers = res.data || res || [];
    let bestIdx = -1;
    if (offers.length > 0) {
      let minPay = Infinity;
      offers.forEach((o, i) => { const p = o.monthlyPayment || o.monthly_payment || Infinity; if (p < minPay) { minPay = p; bestIdx = i; } });
    }

    app.innerHTML = `
      <div class="page-content">
        <a href="#/portal/expedientes/${escapeHtml(expId)}" class="btn-back">← Volver al expediente</a>
        <h1>Comparar Ofertas</h1>
        ${offers.length === 0 ? '<p class="empty-state">No hay ofertas disponibles para este expediente.</p>' : `
        <div class="cards-grid offers-comparison">
          ${offers.map((o, i) => `
            <div class="card offer-card ${i === bestIdx ? 'best-offer' : ''}">
              ${i === bestIdx ? '<div class="best-badge">⭐ Mejor Oferta</div>' : ''}
              <div class="card-header"><strong>${escapeHtml(o.bankName || o.bank_name || 'Banco')}</strong>
                <span class="status-badge ${getStatusColor(o.status)}">${escapeHtml(o.status)}</span></div>
              <div class="card-body">
                <div class="offer-rate">${o.interestRate || o.interest_rate}% <small>TIN</small></div>
                <p><strong>Cuota mensual:</strong> ${formatCurrency(o.monthlyPayment || o.monthly_payment)}</p>
                <p><strong>Coste total:</strong> ${formatCurrency(o.totalCost || o.total_cost)}</p>
                <p><strong>Plazo:</strong> ${o.term} meses</p>
                ${o.conditions ? `<p><strong>Condiciones:</strong> ${escapeHtml(o.conditions)}</p>` : ''}
              </div>
              ${o.status === 'pending' ? `<div class="card-footer">
                <button class="btn btn-success btn-sm accept-offer" data-id="${escapeHtml(o.id)}">Aceptar</button>
                <button class="btn btn-danger btn-sm reject-offer" data-id="${escapeHtml(o.id)}">Rechazar</button>
              </div>` : ''}
            </div>`).join('')}
        </div>`}
      </div>`;

    app.querySelectorAll('.accept-offer').forEach(btn => {
      btn.addEventListener('click', async () => {
        try { await portalApi.post(`/offers/${btn.dataset.id}/accept`); notify.success('Oferta aceptada'); PortalOffers(params); } catch (e) { notify.error('Error'); }
      });
    });
    app.querySelectorAll('.reject-offer').forEach(btn => {
      btn.addEventListener('click', async () => {
        try { await portalApi.post(`/offers/${btn.dataset.id}/reject`); notify.success('Oferta rechazada'); PortalOffers(params); } catch (e) { notify.error('Error'); }
      });
    });
  } catch (err) {
    app.innerHTML = '<div class="page-content"><p class="error">Error al cargar ofertas</p></div>';
  }
}
