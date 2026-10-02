import type { PixKeyType } from './pix';

export interface Client {
  id: string;
  name: string;
  phone: string;
  amount: number;
  dueDay: number;
  notes: string;
  active: boolean;
  createdAt: string;
}

// Um pagamento quita a mensalidade de um cliente em um mês ("YYYY-MM").
export interface Payment {
  id: string;
  clientId: string;
  month: string;
  amount: number;
  paidAt: string;
}

export interface Settings {
  businessName: string;
  pixKey: string;
  pixKeyType: PixKeyType;
  merchantName: string;
  merchantCity: string;
  reminderTemplate: string;
}

export interface AppData {
  clients: Client[];
  payments: Payment[];
  settings: Settings;
}

export const DEFAULT_REMINDER_TEMPLATE =
  'Olá, {nome}! Tudo bem? Passando para lembrar da mensalidade de {mes} no valor de {valor}, ' +
  'com vencimento em {vencimento}.\n\n{pix}\n\nObrigado! {empresa}';

export const DEFAULT_SETTINGS: Settings = {
  businessName: '',
  pixKey: '',
  pixKeyType: 'cpf_cnpj',
  merchantName: '',
  merchantCity: '',
  reminderTemplate: DEFAULT_REMINDER_TEMPLATE,
};
