import assert from 'node:assert/strict';
import { test } from 'node:test';

import { chargesForMonth, dueDateFor, openMonthsForClient, shiftMonth, summarize } from '../src/lib/billing.ts';
import { formatCurrency, parseCurrency } from '../src/lib/format.ts';
import { buildPixPayload, crc16, validatePixKey } from '../src/lib/pix.ts';
import type { Client, Payment } from '../src/lib/types.ts';
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

const client = (overrides: Partial<Client> = {}): Client => ({
  id: 'c1',
  name: 'Ana',
  phone: '11987654321',
  amount: 100,
  dueDay: 10,
  notes: '',
  active: true,
  createdAt: new Date(2026, 7, 1).toISOString(),
  ...overrides,
});

test('Cobrança: vencimento ajusta para o último dia em meses curtos', () => {
  assert.equal(dueDateFor('2026-02', 31).getDate(), 28);
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
});

test('Cobrança: classifica pago, pendente e atrasado', () => {
  const clients = [
    client({ id: 'a', dueDay: 5 }),
    client({ id: 'b', dueDay: 20, amount: 80 }),
    client({ id: 'c', dueDay: 1, amount: 50 }),
    client({ id: 'd', active: false }),
    client({ id: 'e', createdAt: new Date(2026, 10, 1).toISOString() }),
  ];
  const payments: Payment[] = [
    { id: 'p', clientId: 'c', month: '2026-10', amount: 50, paidAt: new Date().toISOString() },
  ];
  const charges = chargesForMonth(clients, payments, '2026-10', new Date(2026, 9, 12));
  assert.deepEqual(
    charges.map((c) => [c.client.id, c.status]),
    [
      ['a', 'atrasado'],
      ['b', 'pendente'],
      ['c', 'pago'],
    ],
  );
  assert.deepEqual(summarize(charges), {
    received: 50,
    pending: 80,
    overdue: 100,
    paidCount: 1,
    pendingCount: 1,
    overdueCount: 1,
  });
});

test('Cobrança: lista meses em aberto desde o cadastro', () => {
  const payments: Payment[] = [
    { id: 'p', clientId: 'c1', month: '2026-09', amount: 100, paidAt: new Date().toISOString() },
  ];
  assert.deepEqual(openMonthsForClient(client(), payments, new Date(2026, 9, 2)), ['2026-08', '2026-10']);
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
