import { formatCurrency, formatDate, formatTime } from './format.ts';
import { balanceOf } from './ledger.ts';
import { buildPixPayload, validatePixKey } from './pix.ts';
import type { Customer, Entry, Settings } from './types.ts';

export function pixConfigured(settings: Settings): boolean {
  return Boolean(settings.pixKey) && validatePixKey(settings.pixKey, settings.pixKeyType) === null;
}

export function pixFor(settings: Settings, amount: number, customer: Customer): string | null {
  if (!pixConfigured(settings) || amount <= 0) return null;
  return buildPixPayload({
    key: settings.pixKey,
    keyType: settings.pixKeyType,
    merchantName: settings.merchantName || settings.businessName,
    merchantCity: settings.merchantCity,
    amount,
    txid: `FIADO${customer.id}`,
  });
}

function shopName(settings: Settings): string {
  return settings.businessName.trim() || 'Caderninho';
}

const HONORIFICS = new Set(['dona', 'seu', 'sr', 'sr.', 'sra', 'sra.', 'tia', 'tio', 'dr', 'dr.', 'dra', 'dra.']);

// Como chamar o cliente na mensagem: "Dona Maria (rua 3)" vira "Dona Maria"; "João da Silva" vira "João".
export function greetingName(name: string): string {
  const words = name.replace(/\(.*?\)/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return name.trim();
  return HONORIFICS.has(words[0].toLowerCase()) && words[1] ? `${words[0]} ${words[1]}` : words[0];
}

function firstName(customer: Customer): string {
  return greetingName(customer.name);
}

function balanceLine(balance: number): string {
  if (balance > 0) return `Saldo em aberto: *${formatCurrency(balance)}*`;
  if (balance < 0) return `Você tem *${formatCurrency(-balance)}* de crédito.`;
  return 'Sua conta está *quitada*. Obrigado!';
}

// Comprovante enviado ao cliente logo após cada lançamento: é o que evita discussão depois.
export function receiptMessage(settings: Settings, customer: Customer, entry: Entry, newBalance: number): string {
  const when = `${formatDate(new Date(entry.createdAt))} às ${formatTime(new Date(entry.createdAt))}`;
  const what =
    entry.type === 'compra'
      ? `🧾 Compra anotada: *${formatCurrency(entry.amount)}*`
      : `✅ Pagamento recebido: *${formatCurrency(entry.amount)}*`;
  return [
    `*${shopName(settings)}*`,
    `Olá, ${firstName(customer)}!`,
    '',
    what,
    entry.description ? `Itens: ${entry.description}` : null,
    `Data: ${when}`,
    '',
    balanceLine(newBalance),
  ]
    .filter((line) => line !== null)
    .join('\n');
}

// Cobrança com extrato recente e Pix no valor exato do saldo.
export function chargeMessage(settings: Settings, customer: Customer, entries: Entry[], maxLines = 10): string {
  const balance = balanceOf(entries);
  const recent = entries.slice(-maxLines);
  const lines = recent.map((e) => {
    const sign = e.type === 'compra' ? '+' : '−';
    const label = e.description || (e.type === 'compra' ? 'compra' : 'pagamento');
    return `${formatDate(new Date(e.createdAt)).slice(0, 5)}  ${sign} ${formatCurrency(e.amount)}  ${label}`;
  });
  const pix = pixFor(settings, balance, customer);
  return [
    `*${shopName(settings)}*`,
    `Olá, ${firstName(customer)}! Segue o extrato da sua conta:`,
    '',
    entries.length > maxLines ? `(últimos ${maxLines} lançamentos)` : null,
    ...lines,
    '',
    balanceLine(balance),
    pix ? '\nPara pagar, use o Pix copia e cola abaixo:' : null,
    pix,
  ]
    .filter((line) => line !== null)
    .join('\n');
}
