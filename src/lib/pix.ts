// Gera o "Pix copia e cola" (BR Code estático) seguindo o padrão EMV do Banco Central.
// Não depende de banco nem de API: qualquer app de banco consegue ler o código gerado.

export type PixKeyType = 'cpf_cnpj' | 'telefone' | 'email' | 'aleatoria';

export interface PixPayloadInput {
  key: string;
  keyType: PixKeyType;
  merchantName: string;
  merchantCity: string;
  amount?: number;
  description?: string;
  txid?: string;
}

function field(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

// Remove acentos e caracteres fora do conjunto aceito pelos leitores de BR Code.
export function sanitizeText(value: string, maxLength: number): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 .,\-/@]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function normalizePixKey(key: string, keyType: PixKeyType): string {
  const trimmed = key.trim();
  switch (keyType) {
    case 'cpf_cnpj':
      return trimmed.replace(/\D/g, '');
    case 'telefone': {
      const digits = trimmed.replace(/\D/g, '');
      return digits.startsWith('55') && digits.length > 11 ? `+${digits}` : `+55${digits}`;
    }
    case 'email':
      return trimmed.toLowerCase();
    case 'aleatoria':
      return trimmed.toLowerCase();
  }
}

// CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), exigido no campo 63.
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function buildPixPayload(input: PixPayloadInput): string {
  const key = normalizePixKey(input.key, input.keyType);
  const description = input.description ? sanitizeText(input.description, 40) : '';
  const txid = (input.txid ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';

  const accountInfo =
    field('00', 'br.gov.bcb.pix') + field('01', key) + (description ? field('02', description) : '');

  let payload =
    field('00', '01') +
    field('26', accountInfo) +
    field('52', '0000') +
    field('53', '986') +
    (input.amount && input.amount > 0 ? field('54', input.amount.toFixed(2)) : '') +
    field('58', 'BR') +
    field('59', sanitizeText(input.merchantName, 25) || 'RECEBEDOR') +
    field('60', sanitizeText(input.merchantCity, 15) || 'BRASIL') +
    field('62', field('05', txid));

  payload += '6304';
  return payload + crc16(payload);
}

export function validatePixKey(key: string, keyType: PixKeyType): string | null {
  const normalized = normalizePixKey(key, keyType);
  switch (keyType) {
    case 'cpf_cnpj':
      return normalized.length === 11 || normalized.length === 14
        ? null
        : 'CPF deve ter 11 dígitos e CNPJ 14 dígitos.';
    case 'telefone':
      return /^\+55\d{10,11}$/.test(normalized) ? null : 'Informe o celular com DDD.';
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? null : 'E-mail inválido.';
    case 'aleatoria':
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(normalized)
        ? null
        : 'Chave aleatória inválida.';
  }
}
