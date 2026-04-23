import React, { useMemo } from 'react';
import { Clock, MapPin, Building2, Users } from 'lucide-react';
import { PlannerEvent, EventMoment, MOMENT_TYPE_LABELS } from '@/contexts/EventContext';

const GOLD = '#C9A24A';

// Moment type color mapping for visual variety
const MOMENT_COLORS: Record<string, string> = {
  welcome_drinks: '#D4AF5A',
  ceremony: '#8B5CF6',
  cocktail_hour: '#3B82F6',
  reception: '#C9A24A',
  dinner: '#059669',
  after_party: '#EC4899',
  breakfast: '#F59E0B',
  other: '#6B7280',
};

const formatTime = (time: string): string => {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
};

const getDuration = (start: string, end: string): string => {
  if (!start || !end) return '';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let totalMins = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMins < 0) totalMins += 24 * 60; // crosses midnight
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

interface EventTimelineProps {
  event: PlannerEvent;
  onMomentClick?: (momentId: string) => void;
}

const EventTimeline: React.FC<EventTimelineProps> = ({ event, onMomentClick }) => {
  const sortedMoments = useMemo(() => {
    return [...(event.moments || [])]
      .filter(m => !m.parentMomentId)
      .sort((a, b) => {
        // Sort by date first, then by startTime, then by sortOrder
        if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
        if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });
  }, [event.moments]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: { date: string; moments: EventMoment[] }[] = [];
    sortedMoments.forEach(m => {
      const date = m.date || event.date || '';
      const existing = groups.find(g => g.date === date);
      if (existing) {
        existing.moments.push(m);
      } else {
        groups.push({ date, moments: [m] });
      }
    });
    return groups;
  }, [sortedMoments, event.date]);

  if (sortedMoments.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 mx-auto mb-3" style={{ color: '#DDD' }} />
        <p className="text-xs text-gray-400">Add moments with start/end times to generate a timeline</p>
      </div>
    );
  }

  const venueSpaces = event.venueSpaces || [];

  return (
    <div className="space-y-6">
      {groupedByDate.map((group, gi) => (
        <div key={group.date || gi}>
          {/* Date Header */}
          {group.date && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.08)' }}>
                <Clock className="w-4 h-4" style={{ color: GOLD }} />
              </div>
              <div>
                <div className="text-xs font-medium" style={{ color: '#1A1A1A' }}>
                  {new Date(group.date + 'T00:00:00').toLocaleDateString('en-GB', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </div>
                <div className="text-[10px] text-gray-400">{group.moments.length} moments</div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="relative ml-4">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px" style={{ backgroundColor: 'rgba(201,162,74,0.15)' }} />

            <div className="space-y-1">
              {group.moments.map((moment, mi) => {
                const color = MOMENT_COLORS[moment.momentType] || MOMENT_COLORS.other;
                const space = venueSpaces.find(s => s.id === moment.venueSpaceId);
                const duration = getDuration(moment.startTime, moment.endTime);
                const hasTime = !!moment.startTime;

                return (
                  <div
                    key={moment.id}
                    className="relative flex items-stretch gap-4 group cursor-pointer"
                    onClick={() => onMomentClick?.(moment.id)}
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center flex-shrink-0 z-10 pt-3">
                      <div
                        className="w-[10px] h-[10px] rounded-full ring-2 ring-white transition-transform group-hover:scale-125"
                        style={{ backgroundColor: color }}
                      />
                    </div>

                    {/* Content Card */}
                    <div
                      className="flex-1 py-2.5 px-4 rounded-xl border transition-all group-hover:shadow-sm mb-1"
                      style={{ borderColor: 'rgba(201,162,74,0.1)', borderLeft: `3px solid ${color}` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{moment.name}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider" style={{ backgroundColor: `${color}12`, color }}>
                              {MOMENT_TYPE_LABELS[moment.momentType]}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            {hasTime && (
                              <span className="text-[11px] font-medium" style={{ color }}>
                                {formatTime(moment.startTime)}
                                {moment.endTime && <span className="text-gray-400 mx-1">—</span>}
                                {moment.endTime && formatTime(moment.endTime)}
                              </span>
                            )}
                            {duration && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> {duration}
                              </span>
                            )}
                            {space && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                <Building2 className="w-2.5 h-2.5" /> {space.name}
                              </span>
                            )}
                          </div>
                          {moment.notes && (
                            <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{moment.notes}</p>
                          )}
                        </div>

                        {!hasTime && (
                          <span className="text-[9px] text-gray-300 italic flex-shrink-0 mt-1">Set time</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventTimeline;
