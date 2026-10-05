// ─── Client Database Store (Supabase) ─────────────────────────────────────────
import { supabase } from '@/lib/supabase';
import type { EventType, ClientDetails, CorporateClient, WeddingClient, CelebrationClient } from '@/contexts/EventContext';

export interface DbClient {
  id: string;
  coordinator_id: string;
  client_type: 'wedding' | 'celebration' | 'corporate';
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone_code: string;
  primary_contact_phone: string;
  company_name: string;
  country: string;
  region: string;
  city: string;
  billing_address: string;
  vat_number: string;
  registration_number: string;
  accounts_payable_email: string;
  divisions: string[];
  style_preferences: Record<string, any>;
  budget_history: Array<{ date: string; amount: number; eventName: string }>;
  notes: string;
  mood_board_refs: Array<{ url: string; label: string; momentName?: string }>;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbClientEvent {
  id: string;
  client_id: string;
  coordinator_id: string;
  event_local_id: string;
  event_name: string;
  event_type: string;
  event_date: string;
  venue: string;
  guest_count: number;
  total_budget: number;
  total_client_price: number;
  suppliers_used: Array<{ name: string; category?: string }>;
  mood_board_refs: Array<{ url: string; label: string }>;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type CreateClientInput = Omit<DbClient, 'id' | 'created_at' | 'updated_at'>;

// ─── Fetch all clients for current coordinator ───────────────────────────────

export const fetchClients = async (): Promise<DbClient[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('is_active', true)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
  return (data || []) as DbClient[];
};

// ─── Search clients ──────────────────────────────────────────────────────────

export const searchClients = async (query: string): Promise<DbClient[]> => {
  const q = query.trim().toLowerCase();
  if (!q) return fetchClients();

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('is_active', true)
    .or(`primary_contact_name.ilike.%${q}%,primary_contact_email.ilike.%${q}%,company_name.ilike.%${q}%`)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error searching clients:', error);
    return [];
  }
  return (data || []) as DbClient[];
};

// ─── Get single client ───────────────────────────────────────────────────────

export const getClientById = async (id: string): Promise<DbClient | null> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching client:', error);
    return null;
  }
  return data as DbClient;
};

// ─── Create client ───────────────────────────────────────────────────────────

export const createClient = async (input: CreateClientInput): Promise<DbClient | null> => {
  const { data, error } = await supabase
    .from('clients')
    .insert(input)
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    return null;
  }
  return data as DbClient;
};

// ─── Update client ───────────────────────────────────────────────────────────

export const updateClient = async (id: string, updates: Partial<DbClient>): Promise<DbClient | null> => {
  const { data, error } = await supabase
    .from('clients')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    return null;
  }
  return data as DbClient;
};

// ─── Remember a division for this client (for quick-pick reuse) ──────────────

export const addClientDivision = async (client: DbClient, division: string): Promise<void> => {
  const trimmed = division.trim();
  if (!trimmed) return;
  const existing = client.divisions || [];
  if (existing.some(d => d.toLowerCase() === trimmed.toLowerCase())) return;
  await updateClient(client.id, { divisions: [...existing, trimmed] });
};

// ─── Soft delete client ──────────────────────────────────────────────────────

export const deactivateClient = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('clients')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error deactivating client:', error);
    return false;
  }
  return true;
};

// ─── Client Events (History) ─────────────────────────────────────────────────

export const fetchClientEvents = async (clientId: string): Promise<DbClientEvent[]> => {
  const { data, error } = await supabase
    .from('client_events')
    .select('*')
    .eq('client_id', clientId)
    .order('event_date', { ascending: false });

  if (error) {
    console.error('Error fetching client events:', error);
    return [];
  }
  return (data || []) as DbClientEvent[];
};

export const upsertClientEvent = async (
  clientId: string,
  coordinatorId: string,
  eventLocalId: string,
  eventData: Partial<DbClientEvent>
): Promise<DbClientEvent | null> => {
  // Check if exists
  const { data: existing } = await supabase
    .from('client_events')
    .select('id')
    .eq('client_id', clientId)
    .eq('event_local_id', eventLocalId)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('client_events')
      .update({ ...eventData, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) { console.error('Error updating client event:', error); return null; }
    return data as DbClientEvent;
  } else {
    const { data, error } = await supabase
      .from('client_events')
      .insert({
        client_id: clientId,
        coordinator_id: coordinatorId,
        event_local_id: eventLocalId,
        ...eventData,
      })
      .select()
      .single();
    if (error) { console.error('Error creating client event:', error); return null; }
    return data as DbClientEvent;
  }
};

// ─── Display name helper ─────────────────────────────────────────────────────

// ─── Map a client record onto the ClientDetails shape a proposal needs ───────
// Snapshot, not a live link — captures the client record's details at the
// moment it's applied (new proposal, or switching an existing one to a
// different client), so later edits to the client record don't retroactively
// rewrite an already-created proposal.
export const buildClientDetailsFromAccount = (account: DbClient, type: EventType): ClientDetails => {
  if (type === 'corporate') {
    const [contactFirstName, ...rest] = (account.primary_contact_name || '').split(' ');
    const details: CorporateClient = {
      companyName: account.company_name || '',
      vatNumber: account.vat_number || '',
      registrationNumber: account.registration_number || '',
      billingAddress: account.billing_address || '',
      contactFirstName: contactFirstName || '',
      contactSurname: rest.join(' '),
      contactEmail: account.primary_contact_email || '',
      contactTelephoneCode: account.primary_contact_phone_code || '+27',
      contactTelephone: account.primary_contact_phone || '',
      accountsPayableEmail: account.accounts_payable_email || '',
    };
    return details;
  }
  if (type === 'wedding') {
    const [partner1FirstName, ...partner1Rest] = (account.primary_contact_name || '').split(' ');
    const details: WeddingClient = {
      partner1FirstName: partner1FirstName || '', partner1Surname: partner1Rest.join(' '),
      partner2FirstName: '', partner2Surname: '',
      primaryEmail: account.primary_contact_email || '',
      primaryTelephoneCode: account.primary_contact_phone_code || '+27',
      primaryTelephone: account.primary_contact_phone || '',
      billingName: account.primary_contact_name || '',
      billingAddress: account.billing_address || '',
    };
    return details;
  }
  const details: CelebrationClient = {
    hostFirstName: '', hostSurname: '',
    hostEmail: account.primary_contact_email || '',
    hostTelephoneCode: account.primary_contact_phone_code || '+27',
    hostTelephone: account.primary_contact_phone || '',
    billingName: account.primary_contact_name || '',
    billingAddress: account.billing_address || '',
  };
  return details;
};

export const getDbClientDisplayName = (client: DbClient): string => {
  if (client.client_type === 'corporate' && client.company_name) return client.company_name;
  return client.primary_contact_name || client.primary_contact_email || 'Unnamed Client';
};

// ─── Migrate localStorage clients to DB ──────────────────────────────────────

export const migrateLocalClientsToDb = async (coordinatorId: string): Promise<number> => {
  const STORAGE_KEY = 'theone_client_accounts_v1';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const localClients = JSON.parse(raw);
    if (!Array.isArray(localClients) || localClients.length === 0) return 0;

    let migrated = 0;
    for (const lc of localClients) {
      if (!lc.isActive) continue;
      // Check if already exists by email
      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .eq('coordinator_id', coordinatorId)
        .eq('primary_contact_email', lc.primaryContactEmail || '')
        .maybeSingle();

      if (!existing) {
        await createClient({
          coordinator_id: coordinatorId,
          client_type: lc.clientType || 'wedding',
          primary_contact_name: lc.primaryContactName || '',
          primary_contact_email: lc.primaryContactEmail || '',
          primary_contact_phone_code: lc.primaryContactPhoneCode || '+27',
          primary_contact_phone: lc.primaryContactPhone || '',
          company_name: lc.companyName || '',
          country: lc.country || '',
          region: lc.region || '',
          city: lc.city || '',
          billing_address: lc.billingAddress || '',
          vat_number: lc.vatNumber || '',
          registration_number: '',
          accounts_payable_email: '',
          divisions: [],
          style_preferences: {},
          budget_history: [],
          notes: '',
          mood_board_refs: [],
          tags: [],
          is_active: true,
        });
        migrated++;
      }
    }
    return migrated;
  } catch (err) {
    console.error('Migration error:', err);
    return 0;
  }
};
