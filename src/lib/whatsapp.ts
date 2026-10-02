export interface ReminderValues {
  nome: string;
  mes: string;
  valor: string;
  vencimento: string;
  pix: string;
  empresa: string;
}

export function fillTemplate(template: string, values: ReminderValues): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key as keyof ReminderValues] : match,
  );
}

export function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('55') && digits.length > 11 ? digits : `55${digits}`;
}

export function whatsappUrl(phone: string, message: string): string {
  return `https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(message)}`;
}
