import type { Customer, Entry } from './types.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

function cents(value: number): number {
  return Math.round(value * 100);
}

export function entriesFor(entries: Entry[], customerId: string): Entry[] {
  return entries
    .filter((e) => e.customerId === customerId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// Saldo devedor: compras menos pagamentos. Negativo significa crédito a favor do cliente.
export function balanceOf(entries: Entry[]): number {
  const total = entries.reduce((sum, e) => sum + (e.type === 'compra' ? cents(e.amount) : -cents(e.amount)), 0);
  return total / 100;
}

// Data da compra mais antiga ainda não quitada. Os pagamentos abatem as compras mais antigas primeiro.
export function debtSince(entries: Entry[]): Date | null {
  const sorted = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let paid = sorted.filter((e) => e.type === 'pagamento').reduce((sum, e) => sum + cents(e.amount), 0);
  for (const entry of sorted) {
    if (entry.type !== 'compra') continue;
    const amount = cents(entry.amount);
    if (paid >= amount) {
      paid -= amount;
    } else {
      return new Date(entry.createdAt);
    }
  }
  return null;
}

export function daysSince(date: Date, today: Date = new Date()): number {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.max(0, Math.round((end - start) / DAY_MS));
}

export interface CustomerStatus {
  customer: Customer;
  balance: number;
  since: Date | null;
  lastEntry: Entry | null;
}

export function customerStatuses(customers: Customer[], entries: Entry[]): CustomerStatus[] {
  return customers
    .map((customer) => {
      const own = entriesFor(entries, customer.id);
      return {
        customer,
        balance: balanceOf(own),
        since: debtSince(own),
        lastEntry: own[own.length - 1] ?? null,
      };
    })
    .sort((a, b) => {
      // Quem deve aparece primeiro, do débito mais antigo para o mais novo.
      if ((a.balance > 0) !== (b.balance > 0)) return a.balance > 0 ? -1 : 1;
      if (a.since && b.since) return a.since.getTime() - b.since.getTime();
      return a.customer.name.localeCompare(b.customer.name, 'pt-BR');
    });
}

export interface Overview {
  outstanding: number;
  debtors: number;
  soldThisMonth: number;
  receivedThisMonth: number;
}

export function overview(customers: Customer[], entries: Entry[], today: Date = new Date()): Overview {
  const statuses = customerStatuses(customers, entries);
  const debtors = statuses.filter((s) => s.balance > 0);
  let sold = 0;
  let received = 0;
  for (const entry of entries) {
    const date = new Date(entry.createdAt);
    if (date.getFullYear() !== today.getFullYear() || date.getMonth() !== today.getMonth()) continue;
    if (entry.type === 'compra') sold += cents(entry.amount);
    else received += cents(entry.amount);
  }
  return {
    outstanding: debtors.reduce((sum, s) => sum + cents(s.balance), 0) / 100,
    debtors: debtors.length,
    soldThisMonth: sold / 100,
    receivedThisMonth: received / 100,
  };
}

export interface LimitCheck {
  exceeds: boolean;
  newBalance: number;
}

export function checkLimit(customer: Customer, currentBalance: number, purchase: number): LimitCheck {
  const newBalance = (cents(currentBalance) + cents(purchase)) / 100;
  return { exceeds: customer.creditLimit > 0 && newBalance > customer.creditLimit, newBalance };
}
