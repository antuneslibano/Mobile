import { dueDateFor } from './billing';
import { formatCurrency, formatDate, formatMonth } from './format';
import { buildPixPayload, validatePixKey } from './pix';
import type { Client, Settings } from './types';
import { fillTemplate, whatsappUrl } from './whatsapp';

export function pixConfigured(settings: Settings): boolean {
  return Boolean(settings.pixKey) && validatePixKey(settings.pixKey, settings.pixKeyType) === null;
}

export function pixForCharge(settings: Settings, client: Client, month: string): string | null {
  if (!pixConfigured(settings)) return null;
  return buildPixPayload({
    key: settings.pixKey,
    keyType: settings.pixKeyType,
    merchantName: settings.merchantName || settings.businessName,
    merchantCity: settings.merchantCity,
    amount: client.amount,
    txid: `M${month.replace('-', '')}${client.id}`,
  });
}

export function reminderMessage(settings: Settings, client: Client, month: string): string {
  const pix = pixForCharge(settings, client, month);
  const message = fillTemplate(settings.reminderTemplate, {
    nome: client.name.split(' ')[0],
    mes: formatMonth(month),
    valor: formatCurrency(client.amount),
    vencimento: formatDate(dueDateFor(month, client.dueDay)),
    pix: pix ? `Pix copia e cola:\n${pix}` : '',
    empresa: settings.businessName,
  });
  // Sem chave Pix configurada, {pix} fica vazio: remove as linhas em branco que sobram.
  return message.replace(/\n{3,}/g, '\n\n').trim();
}

export function reminderUrl(settings: Settings, client: Client, month: string): string {
  return whatsappUrl(client.phone, reminderMessage(settings, client, month));
}
