import type { PixKeyType } from './pix';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  // Limite de fiado em reais; 0 significa sem limite.
  creditLimit: number;
  notes: string;
  createdAt: string;
}

export type EntryType = 'compra' | 'pagamento';

// Cada linha do caderno: uma compra fiada ou um pagamento recebido.
export interface Entry {
  id: string;
  customerId: string;
  type: EntryType;
  amount: number;
  description: string;
  createdAt: string;
}

export interface Settings {
  businessName: string;
  pixKey: string;
  pixKeyType: PixKeyType;
  merchantName: string;
  merchantCity: string;
}

export interface AppData {
  customers: Customer[];
  entries: Entry[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  businessName: '',
  pixKey: '',
  pixKeyType: 'cpf_cnpj',
  merchantName: '',
  merchantCity: '',
};
