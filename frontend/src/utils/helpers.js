/**
 * Utility / helper functions.
 */

export function formatCurrency(amount, currency = 'EUR') {
  if (amount == null || isNaN(amount)) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function truncate(str, len = 50) {
  if (!str) return '';
  if (str.length <= len) return str;
  return str.slice(0, len) + '…';
}

const STATUS_MAP = {
  nuevo: { color: 'status-new', label: 'Nuevo' },
  contactado: { color: 'status-contacted', label: 'Contactado' },
  calificado: { color: 'status-qualified', label: 'Calificado' },
  en_proceso: { color: 'status-in-progress', label: 'En Proceso' },
  documentacion: { color: 'status-docs', label: 'Documentación' },
  analisis: { color: 'status-analysis', label: 'Análisis' },
  enviado_banco: { color: 'status-sent', label: 'Enviado a Banco' },
  aprobado_banco: { color: 'status-approved', label: 'Aprobado por Banco' },
  oferta_recibida: { color: 'status-offer', label: 'Oferta Recibida' },
  oferta_aceptada: { color: 'status-accepted', label: 'Oferta Aceptada' },
  escritura: { color: 'status-notary', label: 'Escritura' },
  completado: { color: 'status-completed', label: 'Completado' },
  rechazado: { color: 'status-rejected', label: 'Rechazado' },
  cancelado: { color: 'status-cancelled', label: 'Cancelado' },
  pendiente: { color: 'status-pending', label: 'Pendiente' },
  activo: { color: 'status-active', label: 'Activo' },
  inactivo: { color: 'status-inactive', label: 'Inactivo' },
  verificado: { color: 'status-verified', label: 'Verificado' },
  subido: { color: 'status-uploaded', label: 'Subido' },
  alta: { color: 'priority-high', label: 'Alta' },
  media: { color: 'priority-medium', label: 'Media' },
  baja: { color: 'priority-low', label: 'Baja' },
};

export function getStatusColor(status) {
  return (STATUS_MAP[status] || { color: 'status-default' }).color;
}

export function getStatusLabel(status) {
  return (STATUS_MAP[status] || { label: status || '—' }).label;
}

export function calculateLTV(requestedAmount, propertyValue) {
  if (!requestedAmount || !propertyValue || propertyValue === 0) return 0;
  return ((requestedAmount / propertyValue) * 100).toFixed(2);
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function escapeHtml(str) {
  if (str == null) return '';
  const text = String(str);
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
  return /^[+]?[\d\s()-]{6,20}$/.test(phone);
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const past = new Date(dateStr);
  const seconds = Math.floor((now - past) / 1000);

  if (seconds < 60) return 'hace unos segundos';
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `hace ${Math.floor(seconds / 86400)} días`;
  return formatDate(dateStr);
}
