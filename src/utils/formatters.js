export function formatCurrency(valueInCents) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((valueInCents || 0) / 100);
}

export function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function parsePriceToCents(priceText) {
  const normalized = String(priceText ?? '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  const value = Number(normalized);

  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.round(value * 100);
}
