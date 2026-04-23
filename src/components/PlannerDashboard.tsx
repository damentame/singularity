import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Calendar, Users, MapPin, Trash2, Copy, FileText, Layers, ChevronLeft, ChevronRight, User, Cloud, CloudOff, RefreshCw, CheckCircle, Download, Loader2, Database, Clock, UserCircle } from 'lucide-react';
import { useEventContext, EVENT_TYPE_LABELS, CreateEventParams, getEventDisplayName, PlannerEvent } from '@/contexts/EventContext';

import { getCountryByCode } from '@/data/countries';
import { getClientAccountById, getClientDisplayName } from '@/data/clientAccountStore';
import CreateEventModal from './CreateEventModal';
import CoordinatorHeader from './CoordinatorHeader';
import { toast } from '@/components/ui/use-toast';
import { useAutoSaveStatus } from './EventAutoSaver';
import ClientDirectory from './ClientDirectory';



const GOLD = '#C9A24A';
const fmt = (n: number) => 'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface PlannerDashboardProps {
  onOpenEvent: (eventId: string) => void;
}

const PlannerDashboard: React.FC<PlannerDashboardProps> = ({ onOpenEvent }) => {
  const { events, createEvent, deleteEvent, duplicateEvent, calculateSummary, updateEvent } = useEventContext();
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar' | 'saved' | 'clients'>('grid');

  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
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

  const filtered = events.filter((e) => filter === 'all' || e.status === filter);

  // Load saved events when switching to saved tab
  useEffect(() => {
    if (viewMode === 'saved') {
      loadSavedEvents();
    }
  }, [viewMode, loadSavedEvents]);

  const handleCreate = (params: CreateEventParams) => {
    const id = createEvent(params);
    setShowCreate(false);
    toast({ title: 'Event Created', description: `"${params.name}" has been created and will auto-save shortly.` });
    onOpenEvent(id);
  };

  const handleDuplicate = (eventId: string, eventName: string) => {
    duplicateEvent(eventId);
    toast({ title: 'Event Duplicated', description: `Copy of "${eventName}" created.` });
  };

  const handleDelete = (eventId: string, eventName: string) => {
    if (confirm(`Delete "${eventName}"? This cannot be undone.`)) {
      deleteEvent(eventId);
      deleteEventFromDB(eventId);
      toast({ title: 'Event Deleted', description: `"${eventName}" has been removed.` });
    }
  };

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
        if (exists) {
          updateEvent(eventData.id, eventData);
          toast({ title: 'Event Updated', description: `"${getEventDisplayName(eventData)}" restored from database.` });
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
          toast({ title: 'Event Loaded', description: `"${getEventDisplayName(eventData)}" loaded from database.` });
        }
        setViewMode('grid');
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
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const days: { date: Date; isCurrentMonth: boolean; events: typeof events }[] = [];
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false, events: [] });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      const dayEvents = events.filter(e => {
        const start = e.date;
        const end = e.endDate || e.date;
        return start <= dateStr && dateStr <= end;
      });
      days.push({ date, isCurrentMonth: true, events: dayEvents });
    }
    while (days.length < 42) {
      const d = new Date(year, month + 1, days.length - lastDay.getDate() - startPad + 1);
      days.push({ date: d, isCurrentMonth: false, events: [] });
    }
    return days;
  }, [calendarMonth, events]);

  const monthLabel = calendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F4F0' }}>
      <CoordinatorHeader onCreateEvent={() => setShowCreate(true)} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Title + Save Controls */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-light mb-1" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
              {viewMode === 'clients' ? 'Clients' : 'Events'}
            </h1>
            <p className="text-sm text-gray-400" style={{ fontFamily: '"Inter", sans-serif' }}>
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

            {/* Save All button (hide on clients view) */}
            {viewMode !== 'clients' && (
              <button
                onClick={handleSaveAll}
                disabled={isSaving || events.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
                style={{ backgroundColor: GOLD, color: '#FFF' }}
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
          <div className="flex gap-1 mb-8 p-1 rounded-xl inline-flex" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
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
        )}

        {/* ─── CLIENTS DIRECTORY VIEW ─── */}
        {viewMode === 'clients' && (
          <ClientDirectory />
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
                    style={{ backgroundColor: GOLD, color: '#FFF' }}
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
                      style={{ borderColor: 'rgba(201,162,74,0.15)' }}
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
        {viewMode === 'calendar' && (
          <div className="bg-white rounded-2xl border p-6 mb-8" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-black/5 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <h2 className="text-lg font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>{monthLabel}</h2>
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-black/5 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-px mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[10px] uppercase tracking-wider text-gray-400 py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(201,162,74,0.08)' }}>
              {calendarDays.map((day, i) => {
                const isToday = day.date.toDateString() === new Date().toDateString();
                return (
                  <div key={i} className="min-h-[80px] p-1.5 transition-colors" style={{ backgroundColor: day.isCurrentMonth ? '#FFF' : '#FAFAF7' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${isToday ? 'w-6 h-6 rounded-full flex items-center justify-center' : ''}`} style={{ color: day.isCurrentMonth ? (isToday ? '#FFF' : '#1A1A1A') : '#CCC', backgroundColor: isToday ? GOLD : 'transparent' }}>
                        {day.date.getDate()}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {day.events.slice(0, 3).map(evt => (
                        <button key={evt.id} onClick={() => onOpenEvent(evt.id)} className="w-full text-left px-1.5 py-0.5 rounded text-[9px] truncate transition-colors hover:opacity-80" style={{ backgroundColor: 'rgba(201,162,74,0.1)', color: GOLD }} title={getEventDisplayName(evt)}>
                          {getEventDisplayName(evt)}
                        </button>
                      ))}
                      {day.events.length > 3 && <span className="text-[8px] text-gray-400 pl-1">+{day.events.length - 3} more</span>}
                    </div>
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
                <button onClick={() => setShowCreate(true)} className="px-6 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider" style={{ backgroundColor: GOLD, color: '#FFF' }}>
                  Create Your First Event
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((event) => {
                  const summary = calculateSummary(event.lineItems);
                  const countryObj = getCountryByCode(event.country || '');
                  const locationParts = [event.venue, event.city, countryObj?.name].filter(Boolean);
                  const displayName = getEventDisplayName(event);
                  const programCount = (event.programs || []).length;
                  const isMultiDay = event.endDate && event.endDate !== event.date;

                  return (
                    <div key={event.id} className="bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md group cursor-pointer" style={{ borderColor: 'rgba(201,162,74,0.15)' }} onClick={() => onOpenEvent(event.id)}>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: event.status === 'active' ? 'rgba(34,197,94,0.1)' : event.status === 'draft' ? 'rgba(0,0,0,0.04)' : 'rgba(201,162,74,0.1)', color: event.status === 'active' ? '#22C55E' : event.status === 'draft' ? '#999' : GOLD }}>
                              {event.status}
                            </span>
                            {event.eventType && (
                              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}>
                                {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                              </span>
                            )}
                            {programCount > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5" style={{ backgroundColor: 'rgba(59,130,246,0.08)', color: '#3B82F6' }}>
                                <Layers className="w-2.5 h-2.5" /> {programCount}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400">v{event.currentVersion}</span>
                        </div>
                        <h3 className="text-lg font-light mb-3 group-hover:opacity-80 transition-opacity" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
                          {displayName}
                        </h3>
                        {event.clientAccountId && (() => {
                          const acct = getClientAccountById(event.clientAccountId);
                          if (!acct) return null;
                          return (
                            <div className="flex items-center gap-1.5 mb-2 text-[10px] text-gray-400">
                              <User className="w-3 h-3" style={{ color: GOLD }} />
                              <span>{getClientDisplayName(acct)}</span>
                            </div>
                          );
                        })()}
                        <div className="space-y-2 mb-4">
                          {event.date && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3.5 h-3.5" style={{ color: GOLD }} />
                              {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {isMultiDay && <span className="text-gray-400">— {new Date(event.endDate!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                            </div>
                          )}
                          {locationParts.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <MapPin className="w-3.5 h-3.5" style={{ color: GOLD }} />
                              {locationParts.join(', ')}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Users className="w-3.5 h-3.5" style={{ color: GOLD }} />
                            {event.guestCount} guests
                          </div>
                        </div>
                        <div className="h-px mb-3" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Client Price</span>
                          <span className="font-semibold" style={{ color: '#1A1A1A' }}>{fmt(summary.totalClientPrice)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-gray-400">Margin</span>
                          <span className="font-medium" style={{ color: summary.marginWarning ? '#EF4444' : '#22C55E' }}>
                            {summary.grossMarginPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex border-t" style={{ borderColor: 'rgba(201,162,74,0.1)' }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleSaveSingle(event)} disabled={isSaving} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-gray-400 hover:text-green-600 transition-colors disabled:opacity-40">
                          <Cloud className="w-3 h-3" /> Save
                        </button>
                        <div className="w-px" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />
                        <button onClick={() => handleDuplicate(event.id, displayName)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                          <Copy className="w-3 h-3" /> Duplicate
                        </button>
                        <div className="w-px" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />
                        <button onClick={() => handleDelete(event.id, displayName)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <CreateEventModal open={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
    </div>
  );
};

export default PlannerDashboard;
