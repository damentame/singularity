import React, { useState, useEffect } from 'react';
import {
  Calendar, Users, MapPin, Cloud, CloudOff, RefreshCw, CheckCircle,
  Download, Loader2, Database, Clock, Trash2, FileText, Layers, ArrowRight,
} from 'lucide-react';
import { useEventContext, getEventDisplayName, PlannerEvent } from '@/contexts/EventContext';
import { useAutoSaveStatus } from './EventAutoSaver';
import { toast } from '@/components/ui/use-toast';

const GOLD = '#C9A24A';
const fmt = (n: number) => 'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface MyEventsPanelProps {
  onOpenEvent?: (eventId: string) => void;
}

const MyEventsPanel: React.FC<MyEventsPanelProps> = ({ onOpenEvent }) => {
  const { events, createEvent, updateEvent } = useEventContext();
  const {
    savedEvents,
    isLoadingSaved,
    isSaving,
    lastSaveTime,
    triggerSaveNow,
    loadSavedEvents,
    loadEventData,
    deleteEventFromDB,
  } = useAutoSaveStatus();

  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);

  // Load saved events on mount
  useEffect(() => {
    loadSavedEvents();
  }, [loadSavedEvents]);

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
        if (onOpenEvent) {
          onOpenEvent(eventData.id);
        }
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

  const handleSaveAll = async () => {
    await triggerSaveNow();
    toast({ title: 'Events Saved', description: `All events saved to database.` });
    loadSavedEvents();
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}>
              <Database className="w-6 h-6" style={{ color: GOLD }} />
            </div>
            <div>
              <h2 className="text-xl font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
                My Saved Events
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {savedEvents.length} event{savedEvents.length !== 1 ? 's' : ''} saved to database
                {lastSaveTime && <span className="ml-2">· Auto-saves every 30s</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Save status */}
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

            {/* Save All button */}
            <button
              onClick={handleSaveAll}
              disabled={isSaving || events.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
              style={{ backgroundColor: GOLD, color: '#FFF' }}
            >
              <Database className="w-3.5 h-3.5" />
              Save All
            </button>

            {/* Refresh */}
            <button
              onClick={loadSavedEvents}
              disabled={isLoadingSaved}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:bg-black/5"
              style={{ color: GOLD }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSaved ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Auto-save info banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Cloud className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-amber-900 mb-1">Auto-Save Active</h4>
            <p className="text-xs text-amber-700">
              Your events are automatically saved to the database every 30 seconds and 5 seconds after any change.
              You can also manually save using the "Save All" button above.
            </p>
          </div>
        </div>
      </div>

      {/* Events List */}
      {isLoadingSaved ? (
        <div className="text-center py-20">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: GOLD }} />
          <p className="text-sm text-gray-400">Loading saved events...</p>
        </div>
      ) : savedEvents.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
          <Cloud className="w-16 h-16 mx-auto mb-4" style={{ color: '#DDD' }} />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No events saved to database yet</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
            Events auto-save every 30 seconds after changes, or click "Save All" to save now.
            Create an event to get started!
          </p>
          {events.length > 0 && (
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all"
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
                key={saved.id || saved.event_id}
                className="bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-lg group"
                style={{ borderColor: 'rgba(201,162,74,0.15)' }}
              >
                {/* Card Header */}
                <div className="p-5">
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

                  {/* Event Name */}
                  <h3
                    className="text-lg font-light mb-3 group-hover:opacity-80 transition-opacity line-clamp-2"
                    style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}
                  >
                    {saved.name || 'Untitled Event'}
                  </h3>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    {saved.event_date && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD }} />
                        {new Date(saved.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {saved.end_date && saved.end_date !== saved.event_date && (
                          <span className="text-gray-400">— {new Date(saved.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        )}
                      </div>
                    )}
                    {(saved.venue || saved.city) && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD }} />
                        <span className="truncate">{[saved.venue, saved.city, saved.country].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD }} />
                      {saved.guest_count} guests
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD }} />
                      Last saved {formatTimeAgo(saved.last_auto_save_at || saved.updated_at)}
                    </div>
                  </div>

                  {/* Financial summary */}
                  <div className="h-px mb-3" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Client Price</span>
                      <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{fmt(Number(saved.total_client_price) || 0)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Items / Moments</span>
                      <span className="text-sm text-gray-600">{saved.line_items_count} / {saved.moments_count}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex border-t" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
                  {isLocal ? (
                    <button
                      onClick={() => {
                        if (onOpenEvent) {
                          onOpenEvent(saved.event_id);
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors hover:bg-amber-50"
                      style={{ color: GOLD }}
                    >
                      <FileText className="w-3.5 h-3.5" /> Open Event
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLoadFromDB(saved.event_id)}
                      disabled={isLoadingThis}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors hover:bg-amber-50 disabled:opacity-50"
                      style={{ color: GOLD }}
                    >
                      {isLoadingThis ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...</>
                      ) : (
                        <><Download className="w-3.5 h-3.5" /> Resume Editing</>
                      )}
                    </button>
                  )}
                  <div className="w-px" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />
                  <button
                    onClick={() => handleDeleteFromDB(saved.event_id, saved.name)}
                    className="px-4 flex items-center justify-center gap-1.5 py-3 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

function formatTimeAgo(iso: string | null) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default MyEventsPanel;
