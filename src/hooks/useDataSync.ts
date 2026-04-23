import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

// Types for database operations
export interface EventData {
  id?: string;
  user_id?: string;
  event_id: string;
  event_name: string;
  event_type: 'corporate' | 'wedding' | 'celebration';
  event_category?: string;
  country?: string;
  city?: string;
  start_date?: string;
  end_date?: string;
  total_days?: number;
  total_guests?: number;
  budget_min?: number;
  budget_max?: number;
  currency?: string;
  status?: string;
  notes?: string;
  questionnaire_responses?: Record<string, any>;
}

export interface SubEventData {
  id?: string;
  event_id: string;
  day_number: number;
  event_area_type: string;
  venue_name?: string;
  guest_count?: number;
  load_in_time?: string;
  event_start_time?: string;
  event_end_time?: string;
  strike_time?: string;
  color_scheme?: string[];
  setup_requirements?: string;
  notes?: string;
}

export interface GuestData {
  id?: string;
  event_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  rsvp_status?: 'pending' | 'confirmed' | 'declined' | 'maybe';
  dietary_requirements?: string[];
  allergies?: string;
  meal_preference?: string;
  plus_one?: boolean;
  plus_one_name?: string;
  plus_one_dietary?: string[];
  table_assignment?: string;
  seat_number?: number;
  group_name?: string;
  relationship?: string;
  notes?: string;
}

export interface ServiceProviderSelectionData {
  id?: string;
  event_id: string;
  category: string;
  supplier_id?: string;
  supplier_name?: string;
  options?: string[];
  lookbook_urls?: string[];
  flower_allergies?: string;
  special_requests?: string;
  status?: string;
  notes?: string;
}

export interface SupplierWorkbookData {
  id?: string;
  event_id: string;
  supplier_id?: string;
  supplier_name?: string;
  supplier_category?: string;
  service_items?: Array<{
    category: string;
    item: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal_1?: number;
  delivery_cost?: number;
  setup_cost?: number;
  collection_cost?: number;
  collection_timing?: string;
  logistics_notes?: string;
  subtotal_2?: number;
  vat_rate?: number;
  vat_amount?: number;
  contingency_percentage?: number;
  contingency_amount?: number;
  refundable_deposit?: number;
  subtotal_3?: number;
  additional_items?: Array<{
    description: string;
    amount: number;
  }>;
  additional_items_total?: number;
  damages_deductions?: Array<{
    description: string;
    amount: number;
  }>;
  damages_total?: number;
  final_total?: number;
  refund_due?: number;
  client_bank_name?: string;
  client_account_name?: string;
  client_account_number?: string;
  client_routing_number?: string;
  client_swift_code?: string;
  client_iban?: string;
  additional_invoice_url?: string;
  additional_invoice_notes?: string;
  status?: string;
  currency?: string;
  notes?: string;
}

// Generate unique event ID
const generateEventId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'EVT-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const useDataSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Save event to database
  const saveEvent = useCallback(async (eventData: Omit<EventData, 'event_id'> & { event_id?: string }): Promise<EventData | null> => {
    setIsSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to save your event.',
          variant: 'destructive',
        });
        return null;
      }

      const eventId = eventData.event_id || generateEventId();
      const dataToSave = {
        ...eventData,
        event_id: eventId,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('events')
        .upsert(dataToSave, { onConflict: 'event_id' })
        .select()
        .single();

      if (error) {
        console.error('Error saving event:', error);
        toast({
          title: 'Save Failed',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      }

      setLastSyncTime(new Date());
      toast({
        title: 'Event Saved',
        description: `Event ${eventId} has been saved successfully.`,
      });
      return data;
    } catch (error) {
      console.error('Save event error:', error);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Load event from database
  const loadEvent = useCallback(async (eventId: string): Promise<EventData | null> => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_id', eventId)
        .single();

      if (error) {
        console.error('Error loading event:', error);
        return null;
      }

      setLastSyncTime(new Date());
      return data;
    } catch (error) {
      console.error('Load event error:', error);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Load all events for current user
  const loadUserEvents = useCallback(async (): Promise<EventData[]> => {
    setIsSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading events:', error);
        return [];
      }

      setLastSyncTime(new Date());
      return data || [];
    } catch (error) {
      console.error('Load events error:', error);
      return [];
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Save sub-events
  const saveSubEvents = useCallback(async (eventDbId: string, subEvents: Omit<SubEventData, 'event_id'>[]): Promise<boolean> => {
    setIsSyncing(true);
    try {
      // First delete existing sub-events for this event
      await supabase
        .from('sub_events')
        .delete()
        .eq('event_id', eventDbId);

      // Then insert new sub-events
      const dataToSave = subEvents.map(se => ({
        ...se,
        event_id: eventDbId,
      }));

      const { error } = await supabase
        .from('sub_events')
        .insert(dataToSave);

      if (error) {
        console.error('Error saving sub-events:', error);
        return false;
      }

      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      console.error('Save sub-events error:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Load sub-events
  const loadSubEvents = useCallback(async (eventDbId: string): Promise<SubEventData[]> => {
    try {
      const { data, error } = await supabase
        .from('sub_events')
        .select('*')
        .eq('event_id', eventDbId)
        .order('day_number', { ascending: true });

      if (error) {
        console.error('Error loading sub-events:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Load sub-events error:', error);
      return [];
    }
  }, []);

  // Save guests
  const saveGuests = useCallback(async (eventDbId: string, guests: Omit<GuestData, 'event_id'>[]): Promise<boolean> => {
    setIsSyncing(true);
    try {
      // Delete existing guests
      await supabase
        .from('guests')
        .delete()
        .eq('event_id', eventDbId);

      // Insert new guests
      const dataToSave = guests.map(g => ({
        ...g,
        event_id: eventDbId,
      }));

      const { error } = await supabase
        .from('guests')
        .insert(dataToSave);

      if (error) {
        console.error('Error saving guests:', error);
        return false;
      }

      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      console.error('Save guests error:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Load guests
  const loadGuests = useCallback(async (eventDbId: string): Promise<GuestData[]> => {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventDbId)
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error loading guests:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Load guests error:', error);
      return [];
    }
  }, []);

  // Save service provider selections
  const saveServiceProviders = useCallback(async (eventDbId: string, providers: Omit<ServiceProviderSelectionData, 'event_id'>[]): Promise<boolean> => {
    setIsSyncing(true);
    try {
      // Delete existing selections
      await supabase
        .from('service_provider_selections')
        .delete()
        .eq('event_id', eventDbId);

      // Insert new selections
      const dataToSave = providers.map(p => ({
        ...p,
        event_id: eventDbId,
      }));

      const { error } = await supabase
        .from('service_provider_selections')
        .insert(dataToSave);

      if (error) {
        console.error('Error saving service providers:', error);
        return false;
      }

      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      console.error('Save service providers error:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Load service provider selections
  const loadServiceProviders = useCallback(async (eventDbId: string): Promise<ServiceProviderSelectionData[]> => {
    try {
      const { data, error } = await supabase
        .from('service_provider_selections')
        .select('*')
        .eq('event_id', eventDbId);

      if (error) {
        console.error('Error loading service providers:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Load service providers error:', error);
      return [];
    }
  }, []);

  // Save supplier workbook
  const saveWorkbook = useCallback(async (workbook: SupplierWorkbookData): Promise<SupplierWorkbookData | null> => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('supplier_workbooks')
        .upsert(workbook)
        .select()
        .single();

      if (error) {
        console.error('Error saving workbook:', error);
        toast({
          title: 'Save Failed',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      }

      setLastSyncTime(new Date());
      toast({
        title: 'Workbook Saved',
        description: 'Supplier workbook has been saved successfully.',
      });
      return data;
    } catch (error) {
      console.error('Save workbook error:', error);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Load workbooks for event
  const loadWorkbooks = useCallback(async (eventDbId: string): Promise<SupplierWorkbookData[]> => {
    try {
      const { data, error } = await supabase
        .from('supplier_workbooks')
        .select('*')
        .eq('event_id', eventDbId);

      if (error) {
        console.error('Error loading workbooks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Load workbooks error:', error);
      return [];
    }
  }, []);

  // Delete event and all related data
  const deleteEvent = useCallback(async (eventDbId: string): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventDbId);

      if (error) {
        console.error('Error deleting event:', error);
        toast({
          title: 'Delete Failed',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Event Deleted',
        description: 'Event and all related data have been deleted.',
      });
      return true;
    } catch (error) {
      console.error('Delete event error:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Save complete event with all related data
  const saveCompleteEvent = useCallback(async (
    eventData: Omit<EventData, 'event_id'> & { event_id?: string },
    subEvents: Omit<SubEventData, 'event_id'>[],
    guests: Omit<GuestData, 'event_id'>[],
    serviceProviders: Omit<ServiceProviderSelectionData, 'event_id'>[]
  ): Promise<EventData | null> => {
    setIsSyncing(true);
    try {
      // First save the main event
      const savedEvent = await saveEvent(eventData);
      if (!savedEvent || !savedEvent.id) {
        return null;
      }

      // Then save related data in parallel
      await Promise.all([
        subEvents.length > 0 ? saveSubEvents(savedEvent.id, subEvents) : Promise.resolve(true),
        guests.length > 0 ? saveGuests(savedEvent.id, guests) : Promise.resolve(true),
        serviceProviders.length > 0 ? saveServiceProviders(savedEvent.id, serviceProviders) : Promise.resolve(true),
      ]);

      toast({
        title: 'Event Saved Successfully',
        description: `Your event ${savedEvent.event_id} has been saved with all details.`,
      });

      return savedEvent;
    } catch (error) {
      console.error('Save complete event error:', error);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [saveEvent, saveSubEvents, saveGuests, saveServiceProviders]);

  // Load complete event with all related data
  const loadCompleteEvent = useCallback(async (eventId: string): Promise<{
    event: EventData | null;
    subEvents: SubEventData[];
    guests: GuestData[];
    serviceProviders: ServiceProviderSelectionData[];
    workbooks: SupplierWorkbookData[];
  }> => {
    setIsSyncing(true);
    try {
      const event = await loadEvent(eventId);
      if (!event || !event.id) {
        return { event: null, subEvents: [], guests: [], serviceProviders: [], workbooks: [] };
      }

      const [subEvents, guests, serviceProviders, workbooks] = await Promise.all([
        loadSubEvents(event.id),
        loadGuests(event.id),
        loadServiceProviders(event.id),
        loadWorkbooks(event.id),
      ]);

      return { event, subEvents, guests, serviceProviders, workbooks };
    } catch (error) {
      console.error('Load complete event error:', error);
      return { event: null, subEvents: [], guests: [], serviceProviders: [], workbooks: [] };
    } finally {
      setIsSyncing(false);
    }
  }, [loadEvent, loadSubEvents, loadGuests, loadServiceProviders, loadWorkbooks]);

  return {
    isSyncing,
    lastSyncTime,
    saveEvent,
    loadEvent,
    loadUserEvents,
    saveSubEvents,
    loadSubEvents,
    saveGuests,
    loadGuests,
    saveServiceProviders,
    loadServiceProviders,
    saveWorkbook,
    loadWorkbooks,
    deleteEvent,
    saveCompleteEvent,
    loadCompleteEvent,
  };
};
