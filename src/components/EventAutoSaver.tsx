import React, { useEffect, useRef, useCallback, createContext, useContext, useState } from 'react';
import { useEventContext, PlannerEvent } from '@/contexts/EventContext';
import { useEventPersistence, SyncState } from '@/hooks/useEventPersistence';

// ─── Auto-Save Status Context ────────────────────────────────────────────────

interface AutoSaveStatus {
  isSaving: boolean;
  lastSaveTime: string | null;
  saveError: string | null;
  savedEvents: any[];
  isLoadingSaved: boolean;
  triggerSaveNow: () => Promise<void>;
  triggerSaveEvent: (event: PlannerEvent) => Promise<boolean>;
  loadSavedEvents: () => Promise<void>;
  loadEventData: (eventId: string) => Promise<PlannerEvent | null>;
  deleteEventFromDB: (eventId: string) => Promise<boolean>;
  // New sync status fields
  syncState: SyncState;
  pendingSaveCount: number;
  isOnline: boolean;
  forceSync: () => Promise<{ flushed: number; failed: number; remaining: number }>;
  getQueueInfo: () => { count: number; items: any[]; hasErrors: boolean; oldestQueuedAt: string | null };
  clearQueue: () => void;
}

const AutoSaveContext = createContext<AutoSaveStatus>({
  isSaving: false,
  lastSaveTime: null,
  saveError: null,
  savedEvents: [],
  isLoadingSaved: false,
  triggerSaveNow: async () => {},
  triggerSaveEvent: async () => false,
  loadSavedEvents: async () => {},
  loadEventData: async () => null,
  deleteEventFromDB: async () => false,
  // Defaults for new fields
  syncState: 'synced',
  pendingSaveCount: 0,
  isOnline: true,
  forceSync: async () => ({ flushed: 0, failed: 0, remaining: 0 }),
  getQueueInfo: () => ({ count: 0, items: [], hasErrors: false, oldestQueuedAt: null }),
  clearQueue: () => {},
});

export const useAutoSaveStatus = () => useContext(AutoSaveContext);

// ─── Auto-Save Provider ──────────────────────────────────────────────────────

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const DEBOUNCE_DELAY = 5000; // 5 seconds after last change

export const EventAutoSaveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { events, calculateSummary } = useEventContext();
  const {
    savedEvents,
    isLoading: isLoadingSaved,
    isSaving,
    lastSaveTime,
    saveError,
    syncState,
    pendingSaveCount,
    isOnline,
    loadSavedEvents: loadSaved,
    loadEventData: loadData,
    saveAllEvents,
    saveEvent,
    deleteEventFromDB: deleteFromDB,
    flushQueue,
    forceSync: forceSyncHook,
    getQueueInfo: getQueueInfoHook,
    clearQueue: clearQueueHook,
  } = useEventPersistence();

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventsRef = useRef(events);
  const calcRef = useRef(calculateSummary);
  const lastSavedHashRef = useRef<string>('');
  const [localLastSave, setLocalLastSave] = useState<string | null>(null);

  // Keep refs current
  useEffect(() => {
    eventsRef.current = events;
    calcRef.current = calculateSummary;
  }, [events, calculateSummary]);

  // Generate a simple hash of events to detect changes
  const getEventsHash = useCallback((evts: PlannerEvent[]) => {
    return evts.map(e => `${e.id}:${e.updatedAt}`).join('|');
  }, []);

  // Core save function
  const doSave = useCallback(async () => {
    const currentEvents = eventsRef.current;
    if (currentEvents.length === 0) return;

    const hash = getEventsHash(currentEvents);
    if (hash === lastSavedHashRef.current) return; // No changes

    const success = await saveAllEvents(currentEvents, calcRef.current);
    if (success) {
      lastSavedHashRef.current = hash;
      setLocalLastSave(new Date().toISOString());
    }
  }, [saveAllEvents, getEventsHash]);

  // Debounced save on events change
  useEffect(() => {
    if (events.length === 0) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      doSave();
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [events, doSave]);

  // Periodic auto-save + queue flush
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(async () => {
      await doSave();
      // Also try to flush any queued saves
      if (navigator.onLine) {
        await flushQueue();
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [doSave, flushQueue]);

  // Flush queue on app load
  useEffect(() => {
    if (navigator.onLine) {
      const timer = setTimeout(() => {
        flushQueue();
      }, 5000); // Wait 5s after mount
      return () => clearTimeout(timer);
    }
  }, [flushQueue]);

  // Manual save trigger
  const triggerSaveNow = useCallback(async () => {
    await doSave();
  }, [doSave]);

  // Save a single event
  const triggerSaveEvent = useCallback(async (event: PlannerEvent) => {
    const summary = calcRef.current(event.lineItems);
    return await saveEvent(event, summary);
  }, [saveEvent]);

  // Load saved events
  const loadSavedEvents = useCallback(async () => {
    await loadSaved();
  }, [loadSaved]);

  // Load event data
  const loadEventData = useCallback(async (eventId: string) => {
    return await loadData(eventId);
  }, [loadData]);

  // Delete from DB
  const deleteEventFromDB = useCallback(async (eventId: string) => {
    return await deleteFromDB(eventId);
  }, [deleteFromDB]);

  // Force sync wrapper
  const forceSync = useCallback(async () => {
    return await forceSyncHook();
  }, [forceSyncHook]);

  const effectiveLastSave = lastSaveTime || localLastSave;

  return (
    <AutoSaveContext.Provider
      value={{
        isSaving,
        lastSaveTime: effectiveLastSave,
        saveError,
        savedEvents,
        isLoadingSaved,
        triggerSaveNow,
        triggerSaveEvent,
        loadSavedEvents,
        loadEventData,
        deleteEventFromDB,
        // New sync fields
        syncState,
        pendingSaveCount,
        isOnline,
        forceSync,
        getQueueInfo: getQueueInfoHook,
        clearQueue: clearQueueHook,
      }}
    >
      {children}
    </AutoSaveContext.Provider>
  );
};

export default EventAutoSaveProvider;
