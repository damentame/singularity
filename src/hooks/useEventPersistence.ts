import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { PlannerEvent } from '@/contexts/EventContext';

export interface SavedEventSummary {
  id: string;
  event_id: string;
  name: string;
  event_type: string;
  event_date: string | null;
  end_date: string | null;
  status: string;
  guest_count: number;
  venue: string | null;
  country: string | null;
  city: string | null;
  currency: string;
  total_client_price: number;
  total_supplier_cost: number;
  margin_percent: number;
  moments_count: number;
  line_items_count: number;
  last_auto_save_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Offline Queue Types ─────────────────────────────────────────────────────

interface QueuedSave {
  id: string;
  action: 'save' | 'save-batch' | 'delete';
  payload: any;
  queuedAt: string;
  retryCount: number;
  lastError?: string;
}

const QUEUE_STORAGE_KEY = 'theone_offline_save_queue';
const MAX_RETRIES = 5;
const RETRY_BACKOFF_BASE = 2000; // 2 seconds base

// ─── Queue Helpers ───────────────────────────────────────────────────────────

const loadQueue = (): QueuedSave[] => {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load offline queue:', e);
  }
  return [];
};

const persistQueue = (queue: QueuedSave[]) => {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('Failed to persist offline queue:', e);
  }
};

const addToQueue = (item: Omit<QueuedSave, 'id' | 'queuedAt' | 'retryCount'>): QueuedSave => {
  const queue = loadQueue();
  const newItem: QueuedSave = {
    ...item,
    id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    queuedAt: new Date().toISOString(),
    retryCount: 0,
  };
  queue.push(newItem);
  persistQueue(queue);
  return newItem;
};

const removeFromQueue = (id: string) => {
  const queue = loadQueue().filter(q => q.id !== id);
  persistQueue(queue);
};

const updateQueueItem = (id: string, updates: Partial<QueuedSave>) => {
  const queue = loadQueue().map(q => q.id === id ? { ...q, ...updates } : q);
  persistQueue(queue);
};

const clearQueue = () => {
  persistQueue([]);
};

// ─── Device ID ───────────────────────────────────────────────────────────────

const getDeviceId = (): string => {
  let id = localStorage.getItem('theone_device_id');
  if (!id) {
    id = 'dev-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('theone_device_id', id);
  }
  return id;
};

// ─── Sync Status Types ───────────────────────────────────────────────────────

export type SyncState = 'synced' | 'pending' | 'syncing' | 'error' | 'offline';

export function useEventPersistence() {
  const [savedEvents, setSavedEvents] = useState<SavedEventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [pendingSaveCount, setPendingSaveCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingSaveRef = useRef<{ events: PlannerEvent[]; calculateSummary: any } | null>(null);
  const flushingRef = useRef(false);

  // ─── Online/Offline Detection ──────────────────────────────────────────────

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Attempt to flush queue when coming back online
      flushQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncState('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ─── Update pending count on mount and changes ─────────────────────────────

  const refreshPendingCount = useCallback(() => {
    const queue = loadQueue();
    setPendingSaveCount(queue.length);
    if (queue.length > 0 && syncState === 'synced') {
      setSyncState('pending');
    } else if (queue.length === 0 && syncState === 'pending') {
      setSyncState('synced');
    }
  }, [syncState]);

  useEffect(() => {
    refreshPendingCount();
  }, []);

  // ─── Core Edge Function Call with Offline Fallback ─────────────────────────

  const invokeWithFallback = useCallback(async (
    action: string,
    body: any,
    queueOnFail = true
  ): Promise<{ success: boolean; data?: any; queued?: boolean }> => {
    try {
      if (!navigator.onLine) {
        throw new Error('Device is offline');
      }

      const { data, error } = await supabase.functions.invoke('manage-events', {
        body: { ...body, action, deviceId: getDeviceId() },
      });

      if (error) throw error;

      if (data?.success) {
        return { success: true, data };
      } else {
        throw new Error(data?.error || `${action} failed`);
      }
    } catch (e: any) {
      console.warn(`Edge function "${action}" failed:`, e.message);

      if (queueOnFail) {
        addToQueue({
          action: action === 'delete' ? 'delete' : action === 'save-batch' ? 'save-batch' : 'save',
          payload: { ...body, action, deviceId: getDeviceId() },
        });
        refreshPendingCount();
        setSyncState('pending');
        return { success: false, queued: true };
      }

      return { success: false };
    }
  }, [refreshPendingCount]);

  // ─── Flush Offline Queue ───────────────────────────────────────────────────

  const flushQueue = useCallback(async (): Promise<{ flushed: number; failed: number; remaining: number }> => {
    if (flushingRef.current) return { flushed: 0, failed: 0, remaining: loadQueue().length };
    if (!navigator.onLine) return { flushed: 0, failed: 0, remaining: loadQueue().length };

    flushingRef.current = true;
    setSyncState('syncing');

    const queue = loadQueue();
    let flushed = 0;
    let failed = 0;

    for (const item of queue) {
      if (item.retryCount >= MAX_RETRIES) {
        // Too many retries — leave in queue but mark as error
        updateQueueItem(item.id, { lastError: 'Max retries exceeded' });
        failed++;
        continue;
      }

      try {
        const { data, error } = await supabase.functions.invoke('manage-events', {
          body: item.payload,
        });

        if (error) throw error;

        if (data?.success) {
          removeFromQueue(item.id);
          flushed++;
        } else {
          throw new Error(data?.error || 'Flush failed');
        }
      } catch (e: any) {
        updateQueueItem(item.id, {
          retryCount: item.retryCount + 1,
          lastError: e.message,
        });
        failed++;
      }
    }

    flushingRef.current = false;
    refreshPendingCount();

    const remaining = loadQueue().length;
    if (remaining === 0) {
      setSyncState('synced');
      setLastSaveTime(new Date().toISOString());
      setSaveError(null);
    } else if (failed > 0) {
      setSyncState('error');
      setSaveError(`${failed} save(s) failed to sync`);
    } else {
      setSyncState('pending');
    }

    return { flushed, failed, remaining };
  }, [refreshPendingCount]);

  // ─── Force Sync (Manual Retry) ─────────────────────────────────────────────

  const forceSync = useCallback(async (): Promise<{ flushed: number; failed: number; remaining: number }> => {
    // Reset retry counts before flushing
    const queue = loadQueue();
    queue.forEach(item => {
      updateQueueItem(item.id, { retryCount: 0, lastError: undefined });
    });
    return flushQueue();
  }, [flushQueue]);

  // ─── Load Saved Events ─────────────────────────────────────────────────────

  const loadSavedEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-events', {
        body: { action: 'list', deviceId: getDeviceId() },
      });
      if (data?.success && data.events) {
        setSavedEvents(data.events);
      }
    } catch (e: any) {
      console.error('Failed to load saved events:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Load Event Data ───────────────────────────────────────────────────────

  const loadEventData = useCallback(async (eventId: string): Promise<PlannerEvent | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-events', {
        body: { action: 'load', eventId, deviceId: getDeviceId() },
      });
      if (data?.success && data.event?.event_data) {
        return data.event.event_data as PlannerEvent;
      }
    } catch (e: any) {
      console.error('Failed to load event:', e);
    }
    return null;
  }, []);

  // ─── Save Single Event (with offline fallback) ─────────────────────────────

  const saveEvent = useCallback(async (eventData: PlannerEvent, summary?: any) => {
    setIsSaving(true);
    setSaveError(null);

    const result = await invokeWithFallback('save', {
      eventData,
      summary: summary || {},
    });

    if (result.success) {
      setLastSaveTime(new Date().toISOString());
      setSyncState('synced');
      setIsSaving(false);
      return true;
    } else if (result.queued) {
      // Queued for later — not a hard failure
      setIsSaving(false);
      return true; // Return true so auto-save doesn't keep retrying immediately
    } else {
      setSaveError('Save failed');
      setSyncState('error');
      setIsSaving(false);
      return false;
    }
  }, [invokeWithFallback]);

  // ─── Save All Events (batch, with offline fallback) ────────────────────────

  const saveAllEvents = useCallback(async (events: PlannerEvent[], calculateSummary: (items: any[]) => any) => {
    if (events.length === 0) return true;
    setIsSaving(true);
    setSaveError(null);

    const eventsPayload = events.map(e => ({
      eventData: e,
      summary: calculateSummary(e.lineItems),
    }));

    const result = await invokeWithFallback('save-batch', {
      events: eventsPayload,
    });

    if (result.success) {
      setLastSaveTime(new Date().toISOString());
      setSyncState('synced');
      setIsSaving(false);
      return true;
    } else if (result.queued) {
      setIsSaving(false);
      return true;
    } else {
      setSaveError('Batch save failed');
      setSyncState('error');
      setIsSaving(false);
      return false;
    }
  }, [invokeWithFallback]);

  // ─── Delete Event (with offline fallback) ──────────────────────────────────

  const deleteEventFromDB = useCallback(async (eventId: string) => {
    const result = await invokeWithFallback('delete', { eventId });

    if (result.success) {
      setSavedEvents(prev => prev.filter(e => e.event_id !== eventId));
      return true;
    } else if (result.queued) {
      // Optimistically remove from local list
      setSavedEvents(prev => prev.filter(e => e.event_id !== eventId));
      return true;
    }
    return false;
  }, [invokeWithFallback]);

  // ─── Auto-Save Setup ──────────────────────────────────────────────────────

  const startAutoSave = useCallback((events: PlannerEvent[], calculateSummary: (items: any[]) => any, intervalMs = 30000) => {
    pendingSaveRef.current = { events, calculateSummary };

    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setInterval(async () => {
      const pending = pendingSaveRef.current;
      if (pending && pending.events.length > 0) {
        await saveAllEvents(pending.events, pending.calculateSummary);
      }
      // Also try to flush queue periodically
      if (navigator.onLine && loadQueue().length > 0) {
        await flushQueue();
      }
    }, intervalMs);
  }, [saveAllEvents, flushQueue]);

  const updateAutoSaveData = useCallback((events: PlannerEvent[], calculateSummary: (items: any[]) => any) => {
    pendingSaveRef.current = { events, calculateSummary };
  }, []);

  const stopAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  // ─── Get Queue Info ────────────────────────────────────────────────────────

  const getQueueInfo = useCallback(() => {
    const queue = loadQueue();
    return {
      count: queue.length,
      items: queue,
      hasErrors: queue.some(q => q.retryCount >= MAX_RETRIES),
      oldestQueuedAt: queue.length > 0 ? queue[0].queuedAt : null,
    };
  }, []);

  // ─── Cleanup ───────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, []);

  // ─── Flush on mount (check for queued saves) ──────────────────────────────

  useEffect(() => {
    const queue = loadQueue();
    if (queue.length > 0 && navigator.onLine) {
      // Delay flush slightly to let app initialize
      const timer = setTimeout(() => {
        flushQueue();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  return {
    savedEvents,
    isLoading,
    isSaving,
    lastSaveTime,
    saveError,
    syncState,
    pendingSaveCount,
    isOnline,
    loadSavedEvents,
    loadEventData,
    saveEvent,
    saveAllEvents,
    deleteEventFromDB,
    startAutoSave,
    updateAutoSaveData,
    stopAutoSave,
    // New offline/sync methods
    flushQueue,
    forceSync,
    getQueueInfo,
    clearQueue: () => { clearQueue(); refreshPendingCount(); setSyncState('synced'); setSaveError(null); },
  };
}
