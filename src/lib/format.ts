const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export function formatCurrency(value: number): string {
  const [integer, cents] = Math.abs(value).toFixed(2).split('.');
  const withDots = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${value < 0 ? '-' : ''}R$ ${withDots},${cents}`;
}

// Aceita "1.234,56", "1234,56" ou "1234.56".
export function parseCurrency(text: string): number {
  const cleaned = text.replace(/[^\d,.]/g, '');
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  const value = Number(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
}

export function formatMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  return `${MONTHS[m - 1]} de ${year}`;
}

export function formatDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
}

export function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatDebtAge(days: number): string {
  if (days === 0) return 'Comprou fiado hoje';
  if (days === 1) return 'Deve desde ontem';
  return `Deve há ${days} dias`;
}
