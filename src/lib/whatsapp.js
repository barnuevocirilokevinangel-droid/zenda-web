/** Número de respaldo (solo dígitos, con código de país) si VITE_WHATSAPP_NUMBER no está definido. */
const FALLBACK_WHATSAPP_NUMBER = '51904610510';

/** Número de WhatsApp de Zenda solo con dígitos. */
export function getWhatsAppNumber() {
  const raw = import.meta.env.VITE_WHATSAPP_NUMBER;
  return String(raw || '').replace(/\D/g, '') || FALLBACK_WHATSAPP_NUMBER;
}

/** Número legible, p. ej. "+51 904 610 510" (formato peruano) o "+<dígitos>". */
export function formatWhatsAppNumber() {
  const n = getWhatsAppNumber();
  if (n.startsWith('51') && n.length === 11) {
    return `+51 ${n.slice(2, 5)} ${n.slice(5, 8)} ${n.slice(8)}`;
  }
  return `+${n}`;
}

/** Enlace wa.me con mensaje prellenado. */
export function buildWhatsAppLink(message = '') {
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${getWhatsAppNumber()}${text}`;
}
