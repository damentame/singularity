// ─── Client Account Store (localStorage) ─────────────────────────────────────
import { ClientAccount, ClientType } from '@/contexts/EventContext';

const STORAGE_KEY = 'theone_client_accounts_v1';

const loadAccounts = (): ClientAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

const saveAccounts = (accounts: ClientAccount[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
};

const uid = () => `ca-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

export const getAllClientAccounts = (): ClientAccount[] => loadAccounts().filter(a => a.isActive);

export const getAllClientAccountsIncludingInactive = (): ClientAccount[] => loadAccounts();

export const getClientAccountById = (id: string): ClientAccount | undefined =>
  loadAccounts().find(a => a.id === id);

export const createClientAccount = (data: Omit<ClientAccount, 'id' | 'createdAt' | 'updatedAt'>): ClientAccount => {
  const accounts = loadAccounts();
  const now = new Date().toISOString();
  const account: ClientAccount = { ...data, id: uid(), createdAt: now, updatedAt: now };
  accounts.push(account);
  saveAccounts(accounts);
  return account;
};

export const updateClientAccount = (id: string, updates: Partial<ClientAccount>): ClientAccount | undefined => {
  const accounts = loadAccounts();
  const idx = accounts.findIndex(a => a.id === id);
  if (idx === -1) return undefined;
  accounts[idx] = { ...accounts[idx], ...updates, updatedAt: new Date().toISOString() };
  saveAccounts(accounts);
  return accounts[idx];
};

export const deactivateClientAccount = (id: string): void => {
  updateClientAccount(id, { isActive: false });
};

export const searchClientAccounts = (query: string): ClientAccount[] => {
  const q = query.toLowerCase().trim();
  if (!q) return getAllClientAccounts();
  return getAllClientAccounts().filter(a =>
    a.primaryContactName.toLowerCase().includes(q) ||
    a.primaryContactEmail.toLowerCase().includes(q) ||
    a.companyName.toLowerCase().includes(q)
  );
};

export const getClientDisplayName = (account: ClientAccount): string => {
  if (account.clientType === 'corporate' && account.companyName) return account.companyName;
  return account.primaryContactName || account.primaryContactEmail || 'Unnamed Client';
};
