import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Calendar, Users, MapPin, Trash2, FileText, ChevronLeft, ChevronRight, ChevronDown, Cloud, CloudOff, RefreshCw, CheckCircle, Download, Loader2, Database, Clock, UserCircle, Sparkles } from 'lucide-react';
import { useEventContext, CreateEventParams, getEventDisplayName, PlannerEvent } from '@/contexts/EventContext';
import { useAppContext } from '@/contexts/AppContext';

import { DbClient, fetchClients, migrateLocalClientsToDb } from '@/data/clientDbStore';
import CreateEventModal from './CreateEventModal';
import CoordinatorHeader from './CoordinatorHeader';
import EventListCard from './EventListCard';
import { toast } from '@/components/ui/use-toast';
import { useAutoSaveStatus } from './EventAutoSaver';
import ClientDirectory from './ClientDirectory';
import { seedDemoData, clearDemoData } from '@/lib/demoSeed';
import { themeStyle, usePageTheme } from '@/theme/pageTheme';
import { getVenueOccupiedRange } from '@/data/venueScheduling';
import { getNextQuoteNumber } from '@/lib/quoteNumbering';



const GOLD = 'var(--pt-primary, #C9A24A)';
/** Warm grey so white cards read against the cream page without a heavy outline */
const CARD_BORDER = 'var(--pt-border, #D4CFC6)';
const CARD_SHADOW = '0 1px 3px rgba(26, 26, 26, 0.06)';
/** Slightly deeper than the page so the calendar panel reads, without a heavy frame */
const CAL_CANVAS = 'color-mix(in srgb, var(--pt-bg, #F5F4F0) 78%, var(--pt-border, #D4CFC6))';
const CAL_INK = 'var(--pt-text, #1A1A1A)';
const fmt = (n: number) => 'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface PlannerDashboardProps {
  onOpenEvent: (eventId: string) => void;
}

const PlannerDashboard: React.FC<PlannerDashboardProps> = ({ onOpenEvent }) => {
  const pageTheme = usePageTheme('coordinator-dashboard');
  const { events, createEvent, deleteEvent, duplicateEvent, calculateSummary, updateEvent } = useEventContext();
  const { user } = useAppContext();
  const [showCreate, setShowCreate] = useState(false);
  const [preselectedClientId, setPreselectedClientId] = useState<string | undefined>(undefined);
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar' | 'saved' | 'clients'>('calendar');
  const [clientsById, setClientsById] = useState<Record<string, DbClient>>({});

  // Migrate any legacy localStorage clients into the shared Supabase store once,
  // then load the client map used to label events with their client name.
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      await migrateLocalClientsToDb(user.id);
      const clients = await fetchClients();
      setClientsById(Object.fromEntries(clients.map(c => [c.id, c])));
    })();
  }, [user?.id]);

  const handleNewQuoteForClient = useCallback((clientId: string) => {
    setPreselectedClientId(clientId);
    setShowCreate(true);
  }, []);

  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [calendarScale, setCalendarScale] = useState<'month' | 'year'>('year');
  const [hoveredDayKey, setHoveredDayKey] = useState<string | null>(null);
  const yearScrollRef = useRef<HTMLDivElement>(null);
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);

  const {
    savedEvents,
    isLoadingSaved,
    isSaving,
    lastSaveTime,
    saveError,
    loadSavedEvents,
    loadEventData,
    triggerSaveNow,
    triggerSaveEvent,
    deleteEventFromDB,
  } = useAutoSaveStatus();

  const filtered = useMemo(
    () => events.filter((e) => filter === 'all' || e.status === filter),
    [events, filter],
  );

  const sortedFiltered = useMemo(() => {
    const now = Date.now();
    const dayMs = 1000 * 60 * 60 * 24;
    return [...filtered].sort((a, b) => {
      const aUpdated = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bUpdated = new Date(b.updatedAt || b.createdAt || 0).getTime();
      const aStart = a.date ? new Date(a.date + 'T12:00:00').getTime() : Number.POSITIVE_INFINITY;
      const bStart = b.date ? new Date(b.date + 'T12:00:00').getTime() : Number.POSITIVE_INFINITY;
      const aScore = (now - aUpdated) / dayMs + (Number.isFinite(aStart) ? Math.abs(aStart - now) / dayMs : 1e6);
      const bScore = (now - bUpdated) / dayMs + (Number.isFinite(bStart) ? Math.abs(bStart - now) / dayMs : 1e6);
      if (Math.abs(aScore - bScore) > 0.01) return aScore - bScore;
      return bUpdated - aUpdated;
    });
  }, [filtered]);

  const { recentEvents, remainingEvents } = useMemo(() => {
    const byUpdated = [...filtered].sort((a, b) => {
      const aT = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bT = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bT - aT;
    });
    const recentCount = Math.min(8, byUpdated.length);
    const recent = byUpdated.slice(0, recentCount);
    const recentIds = new Set(recent.map((e) => e.id));
    return {
      recentEvents: recent,
      remainingEvents: sortedFiltered.filter((e) => !recentIds.has(e.id)),
    };
  }, [filtered, sortedFiltered]);

  // Load saved events when switching to saved tab
  useEffect(() => {
    if (viewMode === 'saved') {
      loadSavedEvents();
    }
  }, [viewMode, loadSavedEvents]);

  const handleCreate = (params: CreateEventParams) => {
    const id = createEvent(params);
    setShowCreate(false);
    setPreselectedClientId(undefined);
    toast({ title: 'Event Created', description: `"${params.name}" has been created and will auto-save shortly.` });
    onOpenEvent(id);

    // Allocate the universal quote number in the background so creation is never blocked on it
    getNextQuoteNumber().then(quoteNumber => updateEvent(id, { quoteNumber }));
  };

  const handleDuplicate = (eventId: string, eventName: string) => {
    const newId = duplicateEvent(eventId);
    toast({ title: 'Event Duplicated', description: `Copy of "${eventName}" created.` });
    getNextQuoteNumber().then(quoteNumber => updateEvent(newId, { quoteNumber }));
  };

  const handleDelete = (eventId: string, eventName: string) => {
    if (confirm(`Delete "${eventName}"? This cannot be undone.`)) {
      deleteEvent(eventId);
      deleteEventFromDB(eventId);
      toast({ title: 'Event Deleted', description: `"${eventName}" has been removed.` });
    }
  };

  const handleLoadDemo = () => {
    const added = seedDemoData();
    if (added === 0) {
      toast({ title: 'Demo Already Loaded', description: 'Demo events are already in your workspace.' });
    } else {
      // Force a page reload so EventContext re-reads localStorage
      window.location.reload();
    }
  };

  const handleClearDemo = () => {
    if (!confirm('Remove all demo events? Your real events will not be affected.')) return;
    clearDemoData();
    window.location.reload();
  };

  const hasDemoEvents = events.some(e => e.id.startsWith('demo-event-'));

  const handleSaveAll = async () => {
    await triggerSaveNow();
    toast({ title: 'Events Saved', description: `${events.length} event(s) saved to database.` });
  };

  const handleSaveSingle = async (event: PlannerEvent) => {
    const success = await triggerSaveEvent(event);
    if (success) {
      toast({ title: 'Event Saved', description: `"${getEventDisplayName(event)}" saved to database.` });
    } else {
      toast({ title: 'Save Failed', description: saveError || 'Could not save event.', variant: 'destructive' });
    }
  };

  const handleLoadFromDB = async (eventId: string) => {
    setLoadingEventId(eventId);
    try {
      const eventData = await loadEventData(eventId);
      if (eventData) {
        const exists = events.find(e => e.id === eventData.id);
        let finalId = eventData.id;
        if (exists) {
          updateEvent(eventData.id, eventData);
        } else {
          const id = createEvent({
            name: eventData.name,
            date: eventData.date,
            endDate: eventData.endDate,
            eventType: eventData.eventType,
            venue: eventData.venue,
            country: eventData.country,
            region: eventData.region,
            city: eventData.city,
            guestCount: eventData.guestCount,
          });
          updateEvent(id, { ...eventData, id });
          finalId = id;
        }
        onOpenEvent(finalId);
      } else {
        toast({ title: 'Load Failed', description: 'Event data not found in database.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Load Failed', description: 'Could not load event from database.', variant: 'destructive' });
    } finally {
      setLoadingEventId(null);
    }
  };

  const handleDeleteFromDB = async (eventId: string, eventName: string) => {
    if (confirm(`Remove "${eventName}" from the database? Local copy will remain.`)) {
      const success = await deleteEventFromDB(eventId);
      if (success) {
        toast({ title: 'Removed from Database', description: `"${eventName}" deleted from cloud.` });
        loadSavedEvents();
      }
    }
  };

  const formatTimeAgo = (iso: string | null) => {
    if (!iso) return 'Never';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // Calendar helpers
  interface CalendarDayEvent { event: PlannerEvent; isPadding: boolean }
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const days: { date: Date; isCurrentMonth: boolean; events: CalendarDayEvent[] }[] = [];
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false, events: [] });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      const dayEvents = filtered
        .filter(e => {
          const { start, end } = getVenueOccupiedRange(e);
          return start <= dateStr && dateStr <= end;
        })
        .map(e => ({
          event: e,
          // Setup/strike padding day vs. the event's actual show dates
          isPadding: dateStr < e.date || dateStr > (e.endDate || e.date),
        }));
      days.push({ date, isCurrentMonth: true, events: dayEvents });
    }
    while (days.length < 42) {
      const d = new Date(year, month + 1, days.length - lastDay.getDate() - startPad + 1);
      days.push({ date: d, isCurrentMonth: false, events: [] });
    }
    return days;
  }, [calendarMonth, filtered]);

  const yearMonths = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const pad = (n: number) => String(n).padStart(2, '0');
    return Array.from({ length: 12 }, (_, month) => {
      const start = `${year}-${pad(month + 1)}-01`;
      const last = new Date(year, month + 1, 0);
      const end = `${year}-${pad(month + 1)}-${pad(last.getDate())}`;
      const monthEvents = filtered
        .filter((e) => {
          if (!e.date) return false;
          const { start: eventStart, end: eventEnd } = getVenueOccupiedRange(e);
          return eventStart <= end && eventEnd >= start;
        })
        .sort((a, b) => a.date.localeCompare(b.date) || getEventDisplayName(a).localeCompare(getEventDisplayName(b)));
      return {
        month,
        label: new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long' }),
        events: monthEvents,
        isCurrent: month === new Date().getMonth() && year === new Date().getFullYear(),
      };
    });
  }, [calendarMonth, filtered]);

  useEffect(() => {
    if (viewMode !== 'calendar' || calendarScale !== 'year') return;
    const scroller = yearScrollRef.current;
    const current = scroller?.querySelector('[data-current-month="true"]') as HTMLElement | null;
    if (!scroller || !current) return;
    scroller.scrollLeft = Math.max(0, current.offsetLeft - 12);
  }, [viewMode, calendarScale, calendarMonth]);

  const monthLabel = calendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const yearLabel = String(calendarMonth.getFullYear());

  return (
    <div className="min-h-screen" style={themeStyle(pageTheme)}>
      <CoordinatorHeader onCreateEvent={() => setShowCreate(true)} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Title + Save Controls */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-light mb-1" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: 'var(--pt-text, #1A1A1A)' }}>
              {viewMode === 'clients' ? 'Clients' : 'Events'}
            </h1>
            <p className="text-sm" style={{ fontFamily: '"Inter", sans-serif', color: 'var(--pt-muted, #8A8175)' }}>
              {viewMode === 'clients' ? 'Manage your client directory' : `${events.length} event${events.length !== 1 ? 's' : ''} total`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-save status indicator (hide on clients view) */}
            {viewMode !== 'clients' && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: GOLD }} />
                    <span>Saving...</span>
                  </>
                ) : lastSaveTime ? (
                  <>
                    <Cloud className="w-3.5 h-3.5" style={{ color: '#22C55E' }} />
                    <span>Saved {formatTimeAgo(lastSaveTime)}</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-3.5 h-3.5" />
                    <span>Not saved</span>
                  </>
                )}
              </div>
            )}

            {/* Demo data button (hide on clients view) */}
            {viewMode !== 'clients' && !hasDemoEvents && (
              <button
                onClick={handleLoadDemo}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border"
                style={{ borderColor: 'rgba(201,162,74,0.25)', color: GOLD, backgroundColor: 'rgba(201,162,74,0.04)' }}
                title="Load demo events"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Demo
              </button>
            )}
            {viewMode !== 'clients' && hasDemoEvents && (
              <button
                onClick={handleClearDemo}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border"
                style={{ borderColor: 'rgba(239,68,68,0.2)', color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.04)' }}
                title="Remove demo events"
              >
                Clear Demo
              </button>
            )}

            {/* Save All button (hide on clients view) */}
            {viewMode !== 'clients' && (
              <button
                onClick={handleSaveAll}
                disabled={isSaving || events.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
                style={{ backgroundColor: GOLD, color: 'var(--pt-on-primary, #FFF)' }}
              >
                <Database className="w-3.5 h-3.5" />
                Save All
              </button>
            )}


            {/* View toggle */}
            <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
              <button
                onClick={() => setViewMode('grid')}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: viewMode === 'grid' ? '#FFF' : 'transparent',
                  color: viewMode === 'grid' ? '#1A1A1A' : '#999',
                  boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: viewMode === 'calendar' ? '#FFF' : 'transparent',
                  color: viewMode === 'calendar' ? '#1A1A1A' : '#999',
                  boxShadow: viewMode === 'calendar' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <Calendar className="w-3 h-3 inline mr-1" />
                Calendar
              </button>
              <button
                onClick={() => setViewMode('saved')}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: viewMode === 'saved' ? '#FFF' : 'transparent',
                  color: viewMode === 'saved' ? '#1A1A1A' : '#999',
                  boxShadow: viewMode === 'saved' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <Cloud className="w-3 h-3 inline mr-1" />
                My Events
              </button>
              <button
                onClick={() => setViewMode('clients')}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: viewMode === 'clients' ? '#FFF' : 'transparent',
                  color: viewMode === 'clients' ? '#1A1A1A' : '#999',
                  boxShadow: viewMode === 'clients' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <UserCircle className="w-3 h-3 inline mr-1" />
                Clients
              </button>
            </div>
          </div>
        </div>

        {/* Filter tabs (for grid/calendar only) */}
        {(viewMode === 'grid' || viewMode === 'calendar') && (
          <div className={`mb-8 flex items-center gap-3 ${viewMode === 'calendar' ? 'justify-between' : ''}`}>
            <div className="flex gap-1 p-1 rounded-xl inline-flex" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
              {(['all', 'active', 'draft', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-all"
                  style={{
                    backgroundColor: filter === f ? '#FFF' : 'transparent',
                    color: filter === f ? '#1A1A1A' : '#999',
                    boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
            {viewMode === 'calendar' && (
              <label className="relative shrink-0">
                <span className="sr-only">Calendar range</span>
                <select
                  value={calendarScale}
                  onChange={(e) => setCalendarScale(e.target.value as 'month' | 'year')}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg text-xs font-medium uppercase tracking-wider cursor-pointer"
                  style={{
                    backgroundColor: '#FFF',
                    color: '#1A1A1A',
                    border: `1px solid ${CARD_BORDER}`,
                    boxShadow: CARD_SHADOW,
                  }}
                >
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </label>
            )}
          </div>
        )}

        {/* ─── CLIENTS DIRECTORY VIEW ─── */}
        {viewMode === 'clients' && (
          <ClientDirectory onNewQuote={handleNewQuoteForClient} />
        )}


        {/* ─── MY EVENTS (SAVED TO DATABASE) VIEW ─── */}
        {viewMode === 'saved' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}>
                    <Database className="w-5 h-5" style={{ color: GOLD }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
                      My Saved Events
                    </h2>
                    <p className="text-xs text-gray-400">
                      {savedEvents.length} event{savedEvents.length !== 1 ? 's' : ''} saved to database
                      {lastSaveTime && <span className="ml-2">· Auto-saves every 30s</span>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={loadSavedEvents}
                  disabled={isLoadingSaved}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-black/5"
                  style={{ color: GOLD }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSaved ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Saved Events List */}
            {isLoadingSaved ? (
              <div className="text-center py-20">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: GOLD }} />
                <p className="text-sm text-gray-400">Loading saved events...</p>
              </div>
            ) : savedEvents.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
                <Cloud className="w-12 h-12 mx-auto mb-4" style={{ color: '#DDD' }} />
                <p className="text-gray-400 mb-2">No events saved to database yet</p>
                <p className="text-xs text-gray-300 mb-6">Events auto-save every 30 seconds, or click "Save All" to save now</p>
                {events.length > 0 && (
                  <button
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider"
                    style={{ backgroundColor: GOLD, color: 'var(--pt-on-primary, #FFF)' }}
                  >
                    {isSaving ? 'Saving...' : `Save ${events.length} Event${events.length !== 1 ? 's' : ''} Now`}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {savedEvents.map((saved) => {
                  const isLocal = events.some(e => e.id === saved.event_id);
                  const isLoadingThis = loadingEventId === saved.event_id;

                  return (
                    <div
                      key={saved.id}
                      className="bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md group"
                      style={{ borderColor: CARD_BORDER, boxShadow: CARD_SHADOW }}
                    >
                      <div className="p-6">
                        {/* Status badges */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-medium"
                              style={{
                                backgroundColor: saved.status === 'active' ? 'rgba(34,197,94,0.1)' : saved.status === 'draft' ? 'rgba(0,0,0,0.04)' : 'rgba(201,162,74,0.1)',
                                color: saved.status === 'active' ? '#22C55E' : saved.status === 'draft' ? '#999' : GOLD,
                              }}
                            >
                              {saved.status}
                            </span>
                            <span
                              className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}
                            >
                              {saved.event_type}
                            </span>
                            {isLocal && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5" style={{ backgroundColor: 'rgba(34,197,94,0.08)', color: '#22C55E' }}>
                                <CheckCircle className="w-2.5 h-2.5" /> Local
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Cloud className="w-2.5 h-2.5" /> Saved
                          </span>
                        </div>

                        <h3
                          className="text-lg font-light mb-3 group-hover:opacity-80 transition-opacity"
                          style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}
                        >
                          {saved.name || 'Untitled Event'}
                        </h3>

                        <div className="space-y-2 mb-4">
                          {saved.event_date && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3.5 h-3.5" style={{ color: GOLD }} />
                              {new Date(saved.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          )}
                          {(saved.venue || saved.city) && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <MapPin className="w-3.5 h-3.5" style={{ color: GOLD }} />
                              {[saved.venue, saved.city, saved.country].filter(Boolean).join(', ')}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Users className="w-3.5 h-3.5" style={{ color: GOLD }} />
                            {saved.guest_count} guests
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5" style={{ color: GOLD }} />
                            Last saved {formatTimeAgo(saved.last_auto_save_at || saved.updated_at)}
                          </div>
                        </div>

                        {/* Financial summary */}
                        <div className="h-px mb-3" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Client Price</span>
                          <span className="font-semibold" style={{ color: '#1A1A1A' }}>{fmt(Number(saved.total_client_price) || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-gray-400">Items / Moments</span>
                          <span className="text-gray-500">{saved.line_items_count} items · {saved.moments_count} moments</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex border-t" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
                        {isLocal ? (
                          <button
                            onClick={() => {
                              const localEvent = events.find(e => e.id === saved.event_id);
                              if (localEvent) onOpenEvent(localEvent.id);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors"
                            style={{ color: GOLD }}
                          >
                            <FileText className="w-3 h-3" /> Open
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLoadFromDB(saved.event_id)}
                            disabled={isLoadingThis}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors disabled:opacity-50"
                            style={{ color: GOLD }}
                          >
                            {isLoadingThis ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Loading...</>
                            ) : (
                              <><Download className="w-3 h-3" /> Resume Editing</>
                            )}
                          </button>
                        )}
                        <div className="w-px" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />
                        <button
                          onClick={() => handleDeleteFromDB(saved.event_id, saved.name)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── CALENDAR VIEW ─── */}
        {viewMode === 'calendar' && calendarScale === 'year' && (
          <div className="rounded-2xl border p-5 sm:p-6 mb-8" style={{ backgroundColor: CAL_CANVAS, borderColor: '#D4CFC6', boxShadow: CARD_SHADOW }}>
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear() - 1, calendarMonth.getMonth(), 1))} className="p-2.5 rounded-full transition-colors" style={{ backgroundColor: '#FFF', border: '1px solid #D4CFC6', color: '#6B6560' }} aria-label="Previous year">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-1" style={{ color: '#5E584F' }}>Year</p>
                <h2 className="text-4xl leading-none" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: CAL_INK, fontWeight: 600 }}>{yearLabel}</h2>
                <div className="mx-auto mt-2 h-0.5 w-12 rounded-full" style={{ backgroundColor: GOLD }} />
              </div>
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear() + 1, calendarMonth.getMonth(), 1))} className="p-2.5 rounded-full transition-colors" style={{ backgroundColor: '#FFF', border: '1px solid #D4CFC6', color: '#6B6560' }} aria-label="Next year">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div ref={yearScrollRef} className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
              {yearMonths.map((month) => (
                <section
                  key={month.month}
                  data-current-month={month.isCurrent ? 'true' : undefined}
                  className="w-[240px] shrink-0 rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: '#FBF9F5',
                    border: month.isCurrent ? `1px solid ${GOLD}` : '1px solid #D4CFC6',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarMonth(new Date(calendarMonth.getFullYear(), month.month, 1));
                      setCalendarScale('month');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                    style={{ backgroundColor: month.isCurrent ? '#F6EFD9' : '#F3EEE6' }}
                  >
                    <span className="text-sm font-medium" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#3F3A34' }}>
                      {month.label}
                    </span>
                    <span
                      className="text-[10px] tabular-nums px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(26,26,26,0.05)', color: '#6B6560' }}
                    >
                      {month.events.length}
                    </span>
                  </button>
                  <div className="p-3">
                    {month.events.length === 0 ? (
                      <p className="text-[11px] px-0.5" style={{ color: '#9A948A' }}>No events</p>
                    ) : (
                      <div className="space-y-2">
                        {month.events.map((evt) => (
                          <EventListCard
                            key={evt.id}
                            event={evt}
                            summary={calculateSummary(evt.lineItems || [])}
                            clientsById={clientsById}
                            variant="compact"
                            onOpen={onOpenEvent}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'calendar' && calendarScale === 'month' && (
          <div className="rounded-2xl border p-5 sm:p-6 mb-8" style={{ backgroundColor: CAL_CANVAS, borderColor: '#D4CFC6', boxShadow: CARD_SHADOW }}>
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="p-2.5 rounded-full transition-colors" style={{ backgroundColor: '#FFF', border: '1px solid #D4CFC6', color: '#6B6560' }} aria-label="Previous month">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-1" style={{ color: '#5E584F' }}>Month</p>
                <h2 className="text-3xl leading-none" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: CAL_INK, fontWeight: 600 }}>{monthLabel}</h2>
                <div className="mx-auto mt-2 h-0.5 w-12 rounded-full" style={{ backgroundColor: GOLD }} />
              </div>
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="p-2.5 rounded-full transition-colors" style={{ backgroundColor: '#FFF', border: '1px solid #D4CFC6', color: '#6B6560' }} aria-label="Next month">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-px mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[10px] font-medium uppercase tracking-wider py-2" style={{ color: '#8A8175' }}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px rounded-xl overflow-visible" style={{ backgroundColor: '#E4DDD0' }}>
              {calendarDays.map((day, i) => {
                const isToday = day.date.toDateString() === new Date().toDateString();
                const dayKey = day.date.toISOString().slice(0, 10);
                const isHovered = hoveredDayKey === dayKey;
                const alignRight = day.date.getDay() >= 4;
                return (
                  <div
                    key={i}
                    className="relative min-h-[96px] p-1.5 transition-colors"
                    style={{ backgroundColor: day.isCurrentMonth ? '#FFFCF7' : '#F3EFE6', zIndex: isHovered ? 30 : 1 }}
                    onMouseEnter={() => day.events.length > 0 && setHoveredDayKey(dayKey)}
                    onMouseLeave={() => setHoveredDayKey((current) => (current === dayKey ? null : current))}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${isToday ? 'w-6 h-6 rounded-full flex items-center justify-center' : ''}`} style={{ color: isToday || day.isCurrentMonth ? '#3F3A34' : '#A39E93', backgroundColor: isToday ? GOLD : 'transparent' }}>
                        {day.date.getDate()}
                      </span>
                      {day.events.length > 0 && !isHovered && (
                        <span className="text-[9px] tabular-nums" style={{ color: '#8A8175' }}>{day.events.length}</span>
                      )}
                    </div>
                    {!isHovered && (
                      <div className="space-y-1">
                        {day.events.slice(0, 2).map(({ event: evt, isPadding }) => (
                          <button
                            key={evt.id}
                            type="button"
                            onClick={() => onOpenEvent(evt.id)}
                            className="w-full text-left px-1.5 py-1.5 rounded-md text-[10px] font-medium leading-tight line-clamp-2"
                            style={
                              isPadding
                                ? { backgroundColor: 'transparent', color: '#8A8175', border: '1px dashed #D4CFC6' }
                                : {
                                    backgroundColor: '#FBF8F3',
                                    border: '1px solid #D4CFC6',
                                    color: '#3F3A34',
                                  }
                            }
                            title={`${getEventDisplayName(evt)}${isPadding ? ' (venue setup/strike)' : ''}`}
                          >
                            {getEventDisplayName(evt)}
                          </button>
                        ))}
                        {day.events.length > 2 && (
                          <span className="text-[9px] text-gray-400 pl-0.5">+{day.events.length - 2} more</span>
                        )}
                      </div>
                    )}
                    {isHovered && day.events.length > 0 && (
                      <div
                        className="absolute top-0 w-[240px] max-h-[320px] overflow-y-auto rounded-xl p-2 space-y-2 bg-white"
                        style={{
                          border: `1px solid ${CARD_BORDER}`,
                          boxShadow: '0 12px 32px rgba(26,26,26,0.12)',
                          left: alignRight ? 'auto' : 0,
                          right: alignRight ? 0 : 'auto',
                        }}
                      >
                        <div className="px-1 pb-1 text-[10px] uppercase tracking-wider text-gray-400">
                          {day.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                        {day.events.map(({ event: evt }) => (
                          <EventListCard
                            key={evt.id}
                            event={evt}
                            summary={calculateSummary(evt.lineItems || [])}
                            clientsById={clientsById}
                            variant="compact"
                            onOpen={onOpenEvent}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── GRID VIEW ─── */}
        {viewMode === 'grid' && (
          <>
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: '#DDD' }} />
                <p className="text-gray-400 mb-4">No events yet</p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <button onClick={() => setShowCreate(true)} className="px-6 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider" style={{ backgroundColor: GOLD, color: 'var(--pt-on-primary, #FFF)' }}>
                    Create Your First Event
                  </button>
                  <button onClick={handleLoadDemo} className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider border transition-all hover:shadow-sm" style={{ borderColor: 'rgba(201,162,74,0.3)', color: GOLD, backgroundColor: 'rgba(201,162,74,0.04)' }}>
                    <Sparkles className="w-3.5 h-3.5" />
                    Load Demo Data
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {recentEvents.length > 0 && (
                  <section>
                    <div className="flex items-end justify-between gap-3 mb-3 px-1">
                      <div>
                        <h2
                          className="text-lg font-light"
                          style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}
                        >
                          Recently worked on
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Scroll sideways to pick up work you left
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-400 tabular-nums shrink-0">
                        {recentEvents.length} recent
                      </span>
                    </div>
                    <div
                      className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory -mx-1 px-1"
                      style={{ scrollbarWidth: 'thin' }}
                    >
                      {recentEvents.map((event) => (
                        <EventListCard
                          key={`recent-${event.id}`}
                          event={event}
                          summary={calculateSummary(event.lineItems || [])}
                          clientsById={clientsById}
                          featured
                          onOpen={onOpenEvent}
                          onSave={handleSaveSingle}
                          onDuplicate={handleDuplicate}
                          onDelete={handleDelete}
                          isSaving={isSaving}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {remainingEvents.length > 0 && (
                  <section>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                      {remainingEvents.map((event) => (
                        <EventListCard
                          key={event.id}
                          event={event}
                          summary={calculateSummary(event.lineItems || [])}
                          clientsById={clientsById}
                          onOpen={onOpenEvent}
                          onSave={handleSaveSingle}
                          onDuplicate={handleDuplicate}
                          onDelete={handleDelete}
                          isSaving={isSaving}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <CreateEventModal
        open={showCreate}
        onClose={() => { setShowCreate(false); setPreselectedClientId(undefined); }}
        onCreate={handleCreate}
        preselectedClientId={preselectedClientId}
      />
    </div>
  );
};

export default PlannerDashboard;
