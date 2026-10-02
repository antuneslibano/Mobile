import type { Client, Payment } from './types';

export type ChargeStatus = 'pago' | 'pendente' | 'atrasado';

export interface Charge {
  client: Client;
  month: string;
  dueDate: Date;
  status: ChargeStatus;
  payment?: Payment;
}

export interface MonthSummary {
  received: number;
  pending: number;
  overdue: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number);
  return monthKey(new Date(year, m - 1 + delta, 1));
}

// Vencimento no dia escolhido; em meses curtos (ex.: dia 31 em fevereiro) usa o último dia.
export function dueDateFor(month: string, dueDay: number): Date {
  const [year, m] = month.split('-').map(Number);
  const lastDay = new Date(year, m, 0).getDate();
  return new Date(year, m - 1, Math.min(dueDay, lastDay));
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function clientStartMonth(client: Client): string {
  return monthKey(new Date(client.createdAt));
}

export function chargesForMonth(
  clients: Client[],
  payments: Payment[],
  month: string,
  today: Date = new Date(),
): Charge[] {
  const todayStart = startOfDay(today);
  return clients
    .filter((client) => client.active && clientStartMonth(client) <= month)
    .map((client) => {
      const dueDate = dueDateFor(month, client.dueDay);
      const payment = payments.find((p) => p.clientId === client.id && p.month === month);
      const status: ChargeStatus = payment ? 'pago' : dueDate < todayStart ? 'atrasado' : 'pendente';
      return { client, month, dueDate, status, payment };
    })
    .sort((a, b) => {
      const order = { atrasado: 0, pendente: 1, pago: 2 };
      return order[a.status] - order[b.status] || a.dueDate.getTime() - b.dueDate.getTime();
    });
}

export function summarize(charges: Charge[]): MonthSummary {
  const summary: MonthSummary = {
    received: 0,
    pending: 0,
    overdue: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
  };
  for (const charge of charges) {
    if (charge.status === 'pago') {
      summary.received += charge.payment?.amount ?? charge.client.amount;
      summary.paidCount++;
    } else if (charge.status === 'atrasado') {
      summary.overdue += charge.client.amount;
      summary.overdueCount++;
    } else {
      summary.pending += charge.client.amount;
      summary.pendingCount++;
    }
  }
  return summary;
}

// Meses em aberto de um cliente, do mais antigo ao mais recente, até o mês atual.
export function openMonthsForClient(
  client: Client,
  payments: Payment[],
  today: Date = new Date(),
): string[] {
  const current = monthKey(today);
  const paid = new Set(payments.filter((p) => p.clientId === client.id).map((p) => p.month));
  const months: string[] = [];
  for (let month = clientStartMonth(client); month <= current; month = shiftMonth(month, 1)) {
    if (!paid.has(month)) months.push(month);
  }
  return months;
}
