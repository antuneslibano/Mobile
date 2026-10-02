import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEFAULT_SETTINGS, type AppData, type Customer, type Entry, type Settings } from '@/lib/types';

const STORAGE_KEY = 'caderninho:data:v1';

const EMPTY_DATA: AppData = { customers: [], entries: [], settings: DEFAULT_SETTINGS };

export type CustomerInput = Omit<Customer, 'id' | 'createdAt'>;
export type EntryInput = Omit<Entry, 'id' | 'createdAt'>;

interface Store extends AppData {
  ready: boolean;
  addCustomer: (input: CustomerInput) => Customer;
  updateCustomer: (id: string, changes: Partial<CustomerInput>) => void;
  deleteCustomer: (id: string) => void;
  addEntry: (input: EntryInput) => Entry;
  deleteEntry: (id: string) => void;
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
          customers: saved.customers ?? [],
          entries: saved.entries ?? [],
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

  const addCustomer = useCallback((input: CustomerInput) => {
    const customer: Customer = { ...input, id: newId(), createdAt: new Date().toISOString() };
    setData((d) => ({ ...d, customers: [...d.customers, customer] }));
    return customer;
  }, []);

  const updateCustomer = useCallback((id: string, changes: Partial<CustomerInput>) => {
    setData((d) => ({ ...d, customers: d.customers.map((c) => (c.id === id ? { ...c, ...changes } : c)) }));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      customers: d.customers.filter((c) => c.id !== id),
      entries: d.entries.filter((e) => e.customerId !== id),
    }));
  }, []);

  const addEntry = useCallback((input: EntryInput) => {
    const entry: Entry = { ...input, id: newId(), createdAt: new Date().toISOString() };
    setData((d) => ({ ...d, entries: [...d.entries, entry] }));
    return entry;
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setData((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== id) }));
  }, []);

  const saveSettings = useCallback((settings: Settings) => {
    setData((d) => ({ ...d, settings }));
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...data,
      ready,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addEntry,
      deleteEntry,
      saveSettings,
    }),
    [data, ready, addCustomer, updateCustomer, deleteCustomer, addEntry, deleteEntry, saveSettings],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore precisa estar dentro de <StoreProvider>');
  return store;
}
