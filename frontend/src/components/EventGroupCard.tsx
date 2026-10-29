import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getEventDisplayName, PlannerEvent } from '@/contexts/EventContext';
import { formatGroupDateSpan } from './eventGroups';

const GOLD = 'var(--pt-accent, #C9A24A)';
const BORDER = 'var(--pt-border, #C4BFB6)';

const fmt = (n: number) =>
  'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const GroupRibbonBar: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div
    className={`relative flex items-center ${compact ? 'h-5 pl-4 pr-2.5' : 'h-7 pl-5 pr-4'}`}
    style={{ backgroundColor: '#C9A24A' }}
  >
    <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: '#8A6A2F' }} />
    <span className={`font-semibold uppercase tracking-[0.18em] text-[#1A1A1A] ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
      Event group
    </span>
  </div>
);

interface EventGroupCardProps {
  code: string;
  events: PlannerEvent[];
  combinedTotal: number | null;
  onOpenGroup: () => void;
}

const EventGroupCard: React.FC<EventGroupCardProps> = ({ code, events, combinedTotal, onOpenGroup }) => {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const dateLabel = formatGroupDateSpan(events);

  return (
    <div
      className="w-[280px] sm:w-[300px] shrink-0 self-end rounded-2xl overflow-hidden flex flex-col"
      style={{
        border: `1px solid ${hovered ? 'rgba(201,162,74,0.45)' : BORDER}`,
        backgroundColor: hovered ? 'rgba(255,249,230,0.72)' : 'var(--pt-surface, #FFFCF7)',
        boxShadow: hovered ? '0 10px 28px rgba(201,162,74,0.12)' : 'none',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'background-color 280ms ease, border-color 280ms ease, box-shadow 280ms ease, transform 280ms ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <GroupRibbonBar />
      <button
        type="button"
        className="w-full text-left px-5 py-4"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-mono font-semibold tracking-wide" style={{ color: '#1A1A1A' }}>{code}</p>
            <p className="text-xs mt-2" style={{ color: '#8A8175' }}>
              {events.length} quote{events.length === 1 ? '' : 's'}
            </p>
            <p
              className="text-xs transition-opacity duration-200 ease-out overflow-hidden"
              style={{ color: '#8A8175', marginTop: expanded ? 0 : 8, opacity: expanded ? 0 : 1, height: expanded ? 0 : 'auto' }}
            >
              {dateLabel}
            </p>
          </div>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ease-out"
            style={{ backgroundColor: 'rgba(0,0,0,0.03)', transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          >
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>
      </button>
      <div
        className="overflow-hidden transition-[max-height,opacity] duration-200 ease-out"
        aria-hidden={!expanded}
        style={{ maxHeight: expanded ? 180 : 0, opacity: expanded ? 1 : 0, pointerEvents: expanded ? 'auto' : 'none' }}
      >
        <div className="px-5 pb-5 border-t" style={{ borderColor: BORDER }}>
          <p className="text-xs text-gray-500 pt-4">
            {combinedTotal == null ? 'Mixed currencies' : <>Combined total <span className="font-semibold" style={{ color: '#1A1A1A' }}>{fmt(combinedTotal)}</span></>}
          </p>
          <button
            type="button"
            onClick={onOpenGroup}
            className="mt-3 w-full py-2 rounded-lg text-xs font-medium"
            style={{ backgroundColor: GOLD, color: 'var(--pt-on-primary, #1A1A1A)' }}
          >
            Open group quote
          </button>
        </div>
      </div>
    </div>
  );
};

interface CalendarGroupBlockProps {
  code: string;
  events: PlannerEvent[];
  expanded: boolean;
  onToggle: () => void;
  onOpenGroup: () => void;
  onOpenEvent: (eventId: string) => void;
}

export const CalendarGroupBlock: React.FC<CalendarGroupBlockProps> = ({
  code,
  events,
  expanded,
  onToggle,
  onOpenGroup,
  onOpenEvent,
}) => (
  <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}`, backgroundColor: 'var(--pt-surface, #FFFCF7)' }}>
    <GroupRibbonBar compact />
    <button type="button" onClick={onToggle} className="w-full text-left px-3 py-2.5" aria-expanded={expanded}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-mono font-semibold truncate" style={{ color: '#1A1A1A' }}>{code}</p>
          <p className="text-[11px] mt-1" style={{ color: '#8A8175' }}>
            {events.length} quote{events.length === 1 ? '' : 's'} · {formatGroupDateSpan(events)}
          </p>
        </div>
        <ChevronDown
          className="w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
      </div>
    </button>
    <div
      className="overflow-hidden transition-[max-height,opacity] duration-200 ease-out"
      aria-hidden={!expanded}
      style={{ maxHeight: expanded ? 360 : 0, opacity: expanded ? 1 : 0, pointerEvents: expanded ? 'auto' : 'none' }}
    >
      <div className="px-2 pb-2 space-y-1.5">
        <button
          type="button"
          onClick={onOpenGroup}
          className="w-full py-1.5 rounded-lg text-[11px] font-medium"
          style={{ backgroundColor: GOLD, color: 'var(--pt-on-primary, #1A1A1A)' }}
        >
          Open group quote
        </button>
        {events.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => onOpenEvent(event.id)}
            className="w-full text-left px-2.5 py-2 rounded-lg text-[11px] leading-snug"
            style={{ backgroundColor: '#FBF8F3', border: '1px solid #D4CFC6', color: '#3F3A34' }}
          >
            {getEventDisplayName(event)}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default EventGroupCard;
