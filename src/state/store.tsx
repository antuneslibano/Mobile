import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEFAULT_SETTINGS, type AppData, type Client, type Payment, type Settings } from '@/lib/types';

const STORAGE_KEY = 'cobrei:data:v1';

const EMPTY_DATA: AppData = { clients: [], payments: [], settings: DEFAULT_SETTINGS };

export type ClientInput = Omit<Client, 'id' | 'createdAt' | 'active'>;

interface Store extends AppData {
  ready: boolean;
  addClient: (input: ClientInput) => Client;
  updateClient: (id: string, changes: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  markPaid: (client: Client, month: string) => void;
  undoPayment: (paymentId: string) => void;
  saveSettings: (settings: Settings) => void;
}

const StoreContext = createContext<Store | null>(null);

function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<AppData>;
        setData({
          clients: saved.clients ?? [],
          payments: saved.payments ?? [],
          settings: { ...DEFAULT_SETTINGS, ...saved.settings },
        });
      })
      .catch((error) => console.warn('Falha ao carregar dados', error))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch((error) =>
      console.warn('Falha ao salvar dados', error),
    );
  }, [data, ready]);

  const addClient = useCallback((input: ClientInput) => {
    const client: Client = { ...input, id: newId(), active: true, createdAt: new Date().toISOString() };
    setData((d) => ({ ...d, clients: [...d.clients, client] }));
    return client;
  }, []);

  const updateClient = useCallback((id: string, changes: Partial<Client>) => {
    setData((d) => ({ ...d, clients: d.clients.map((c) => (c.id === id ? { ...c, ...changes } : c)) }));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      clients: d.clients.filter((c) => c.id !== id),
      payments: d.payments.filter((p) => p.clientId !== id),
    }));
  }, []);

  const markPaid = useCallback((client: Client, month: string) => {
    setData((d) => {
      if (d.payments.some((p) => p.clientId === client.id && p.month === month)) return d;
      const payment: Payment = {
        id: newId(),
        clientId: client.id,
        month,
        amount: client.amount,
        paidAt: new Date().toISOString(),
      };
      return { ...d, payments: [...d.payments, payment] };
    });
  }, []);

  const undoPayment = useCallback((paymentId: string) => {
    setData((d) => ({ ...d, payments: d.payments.filter((p) => p.id !== paymentId) }));
  }, []);

  const saveSettings = useCallback((settings: Settings) => {
    setData((d) => ({ ...d, settings }));
  }, []);

  const value = useMemo<Store>(
    () => ({ ...data, ready, addClient, updateClient, deleteClient, markPaid, undoPayment, saveSettings }),
    [data, ready, addClient, updateClient, deleteClient, markPaid, undoPayment, saveSettings],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore precisa estar dentro de <StoreProvider>');
  return store;
}
