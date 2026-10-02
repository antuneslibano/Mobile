import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatCurrency, formatDebtAge, parseCurrency } from '../src/lib/format.ts';
import { balanceOf, checkLimit, customerStatuses, daysSince, debtSince, overview } from '../src/lib/ledger.ts';
import { chargeMessage, greetingName, receiptMessage } from '../src/lib/messages.ts';
import { buildPixPayload, crc16, validatePixKey } from '../src/lib/pix.ts';
import { DEFAULT_SETTINGS, type Customer, type Entry, type Settings } from '../src/lib/types.ts';
import { compareVersions, parseRelease } from '../src/lib/updates.ts';
import { fillTemplate, whatsappUrl } from '../src/lib/whatsapp.ts';

test('Pix: reproduz o exemplo do manual do BR Code do Banco Central', () => {
  const payload = buildPixPayload({
    key: '123e4567-e12b-12d1-a456-426655440000',
    keyType: 'aleatoria',
    merchantName: 'Fulano de Tal',
    merchantCity: 'BRASILIA',
  });
  assert.equal(
    payload,
    '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR' +
      '5913Fulano de Tal6008BRASILIA62070503***63041D3D',
  );
});

test('Pix: inclui valor, remove acentos e mantém CRC válido', () => {
  const payload = buildPixPayload({
    key: '(11) 98765-4321',
    keyType: 'telefone',
    merchantName: 'Escolinha São João',
    merchantCity: 'São Paulo',
    amount: 150,
    txid: 'MENS-2026-10',
  });
  assert.ok(payload.includes('0114+5511987654321'));
  assert.ok(payload.includes('5406150.00'));
  assert.ok(payload.includes('5918Escolinha Sao Joao'));
  assert.ok(payload.includes('6009Sao Paulo'));
  assert.ok(payload.includes('0510MENS202610'));
  assert.equal(payload.slice(-4), crc16(payload.slice(0, -4)));
});

test('Pix: valida chaves', () => {
  assert.equal(validatePixKey('123.456.789-09', 'cpf_cnpj'), null);
  assert.notEqual(validatePixKey('123', 'cpf_cnpj'), null);
  assert.equal(validatePixKey('a@b.com', 'email'), null);
  assert.notEqual(validatePixKey('11999', 'telefone'), null);
});

test('Formatação de moeda', () => {
  assert.equal(formatCurrency(1234.5), 'R$ 1.234,50');
  assert.equal(parseCurrency('1.234,56'), 1234.56);
  assert.equal(parseCurrency('99.9'), 99.9);
  assert.equal(parseCurrency('abc'), 0);
});

test('WhatsApp: preenche modelo e monta link', () => {
  const text = fillTemplate('Oi {nome}, {valor} {desconhecido}', {
    nome: 'Ana',
    mes: '',
    valor: 'R$ 10,00',
    vencimento: '',
    pix: '',
    empresa: '',
  });
  assert.equal(text, 'Oi Ana, R$ 10,00 {desconhecido}');
  assert.equal(whatsappUrl('(11) 98765-4321', 'oi'), 'https://wa.me/5511987654321?text=oi');
});

test('Atualizações: compara versões e escolhe o APK do release', () => {
  assert.ok(compareVersions('1.0.10', '1.0.9') > 0);
  assert.equal(compareVersions('v1.2.0', '1.2.0'), 0);
  assert.ok(compareVersions('1.0.0', '1.1') < 0);

  const release = {
    tag_name: 'v1.1.0',
    html_url: 'https://github.com/x/y/releases/tag/v1.1.0',
    draft: false,
    prerelease: false,
    assets: [{ name: 'Cobrei-1.1.0.apk', browser_download_url: 'https://example.com/Cobrei-1.1.0.apk' }],
  };
  assert.equal(parseRelease(release, '1.0.0')?.downloadUrl, 'https://example.com/Cobrei-1.1.0.apk');
  assert.equal(parseRelease(release, '1.1.0'), null);
  assert.equal(parseRelease({ ...release, prerelease: true }, '1.0.0'), null);
});

const customer = (overrides: Partial<Customer> = {}): Customer => ({
  id: 'c1',
  name: 'João da Silva',
  phone: '11987654321',
  creditLimit: 0,
  notes: '',
  createdAt: '2026-09-01T10:00:00.000Z',
  ...overrides,
});

let seq = 0;
const entry = (type: Entry['type'], amount: number, date: string, overrides: Partial<Entry> = {}): Entry => ({
  id: `e${++seq}`,
  customerId: 'c1',
  type,
  amount,
  description: '',
  createdAt: new Date(date).toISOString(),
  ...overrides,
});

test('Caderno: saldo sem erro de centavos', () => {
  const entries = [entry('compra', 0.1, '2026-09-01'), entry('compra', 0.2, '2026-09-02'), entry('pagamento', 0.3, '2026-09-03')];
  assert.equal(balanceOf(entries), 0);
  assert.equal(balanceOf([entry('compra', 23.5, '2026-09-01'), entry('pagamento', 10, '2026-09-02')]), 13.5);
});

test('Caderno: dívida conta a partir da compra mais antiga não quitada', () => {
  const entries = [
    entry('compra', 50, '2026-09-01T12:00:00'),
    entry('compra', 30, '2026-09-10T12:00:00'),
    entry('pagamento', 60, '2026-09-15T12:00:00'),
  ];
  assert.equal(debtSince(entries)?.getDate(), 10);
  assert.equal(debtSince([...entries, entry('pagamento', 20, '2026-09-20')]), null);
  assert.equal(daysSince(new Date(2026, 8, 10, 23), new Date(2026, 9, 2, 1)), 22);
  assert.equal(formatDebtAge(0), 'Comprou fiado hoje');
  assert.equal(formatDebtAge(1), 'Deve desde ontem');
  assert.equal(formatDebtAge(5), 'Deve há 5 dias');
});

test('Caderno: ordena devedores pelo débito mais antigo e resume o mês', () => {
  const customers = [
    customer({ id: 'a', name: 'Ana' }),
    customer({ id: 'b', name: 'Bia' }),
    customer({ id: 'c', name: 'Caio' }),
  ];
  const entries = [
    entry('compra', 40, '2026-10-01T12:00:00', { customerId: 'a' }),
    entry('compra', 25, '2026-09-20T12:00:00', { customerId: 'b' }),
    entry('compra', 10, '2026-10-01T12:00:00', { customerId: 'c' }),
    entry('pagamento', 10, '2026-10-02T12:00:00', { customerId: 'c' }),
  ];
  assert.deepEqual(
    customerStatuses(customers, entries).map((s) => s.customer.id),
    ['b', 'a', 'c'],
  );
  assert.deepEqual(overview(customers, entries, new Date(2026, 9, 2)), {
    outstanding: 65,
    debtors: 2,
    soldThisMonth: 50,
    receivedThisMonth: 10,
  });
});

test('Caderno: limite de fiado', () => {
  assert.deepEqual(checkLimit(customer({ creditLimit: 100 }), 90, 15), { exceeds: true, newBalance: 105 });
  assert.equal(checkLimit(customer({ creditLimit: 100 }), 90, 10).exceeds, false);
  assert.equal(checkLimit(customer(), 1000, 500).exceeds, false);
});

const settings: Settings = {
  ...DEFAULT_SETTINGS,
  businessName: 'Mercadinho Bom Preço',
  pixKey: 'loja@exemplo.com',
  pixKeyType: 'email',
  merchantCity: 'Campinas',
};

test('Mensagens: comprovante de compra com saldo', () => {
  const e = entry('compra', 23.5, '2026-10-02T14:32:00', { description: 'pão, leite' });
  const text = receiptMessage(settings, customer(), e, 87);
  assert.ok(text.startsWith('*Mercadinho Bom Preço*\nOlá, João!'));
  assert.ok(text.includes('Compra anotada: *R$ 23,50*'));
  assert.ok(text.includes('Itens: pão, leite'));
  assert.ok(text.includes('02/10/2026 às 14:32'));
  assert.ok(text.endsWith('Saldo em aberto: *R$ 87,00*'));
  assert.ok(receiptMessage(settings, customer(), entry('pagamento', 87, '2026-10-02'), 0).includes('quitada'));
});

test('Mensagens: cobrança com extrato e Pix no valor do saldo', () => {
  const entries = [entry('compra', 50, '2026-09-01T12:00:00'), entry('pagamento', 20, '2026-09-05T12:00:00')];
  const text = chargeMessage(settings, customer(), entries);
  assert.ok(text.includes('01/09  + R$ 50,00  compra'));
  assert.ok(text.includes('05/09  − R$ 20,00  pagamento'));
  assert.ok(text.includes('Saldo em aberto: *R$ 30,00*'));
  assert.ok(text.includes('540530.00'));
  assert.ok(!chargeMessage({ ...settings, pixKey: '' }, customer(), entries).includes('Pix'));
});

test('Mensagens: nome usado na saudação', () => {
  assert.equal(greetingName('João da Silva'), 'João');
  assert.equal(greetingName('Dona Maria (rua 3)'), 'Dona Maria');
  assert.equal(greetingName('seu Jorge'), 'seu Jorge');
  assert.equal(greetingName('Bruno (filho da Cida)'), 'Bruno');
  assert.equal(greetingName('Tia'), 'Tia');
});
