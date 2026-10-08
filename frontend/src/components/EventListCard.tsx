import React, { useState } from 'react';
import {
  Calendar, Users, MapPin, Trash2, Copy, Cloud, ChevronDown, User, Layers,
} from 'lucide-react';
import {
  EVENT_TYPE_LABELS,
  getEventDisplayName,
  PlannerEvent,
} from '@/contexts/EventContext';
import { getCountryByCode } from '@/data/countries';
import { DbClient, getDbClientDisplayName } from '@/data/clientDbStore';

const GOLD = 'var(--pt-accent, #C9A24A)';
/** Visible faint grey border against cream/white backgrounds */
const BORDER = 'var(--pt-border, #C4BFB6)';
const BORDER_HOVER = 'rgba(201,162,74,0.28)';

const cardShellBase: React.CSSProperties = {
  border: `1px solid ${BORDER}`,
  backgroundColor: 'var(--pt-surface, rgba(255,255,255,0.92))',
  transition:
    'background-color 280ms ease, border-color 280ms ease, box-shadow 280ms ease, transform 280ms ease, backdrop-filter 280ms ease',
};

const cardShellHover: React.CSSProperties = {
  backgroundColor: 'rgba(255,249,230,0.55)',
  borderColor: BORDER_HOVER,
  backdropFilter: 'blur(14px) saturate(140%)',
  WebkitBackdropFilter: 'blur(14px) saturate(140%)',
  boxShadow: '0 10px 28px rgba(201,162,74,0.10), inset 0 1px 0 rgba(255,255,255,0.65)',
  transform: 'translateY(-2px)',
};

const fmt = (n: number) =>
  'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export interface EventListCardProps {
  event: PlannerEvent;
  summary: { totalClientPrice: number; grossMarginPercent: number; marginWarning: boolean };
  clientsById?: Record<string, DbClient>;
  /** card = tile for grid/rail; compact = narrow column chip for calendar board */
  variant?: 'card' | 'compact';
  featured?: boolean;
  defaultExpanded?: boolean;
  onOpen: (eventId: string) => void;
  onSave?: (event: PlannerEvent) => void;
  onDuplicate?: (eventId: string, name: string) => void;
  onDelete?: (eventId: string, name: string) => void;
  isSaving?: boolean;
}

const EventListCard: React.FC<EventListCardProps> = ({
  event,
  summary,
  clientsById = {},
  variant = 'card',
  featured = false,
  defaultExpanded = false,
  onOpen,
  onSave,
  onDuplicate,
  onDelete,
  isSaving,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [hovered, setHovered] = useState(false);
  const displayName = getEventDisplayName(event);
  const countryObj = getCountryByCode(event.country || '');
  const locationParts = [event.venue, event.city, countryObj?.name].filter(Boolean);
  const isMultiDay = event.endDate && event.endDate !== event.date;
  const programCount = (event.programs || []).length;
  const client = event.clientAccountId ? clientsById[event.clientAccountId] : undefined;

  const statusColor =
    event.status === 'active'
      ? { bg: 'rgba(34,197,94,0.1)', fg: '#22C55E' }
      : event.status === 'draft'
        ? { bg: 'rgba(0,0,0,0.04)', fg: '#999' }
        : { bg: 'rgba(201,162,74,0.1)', fg: GOLD };

  const dateLabel = event.date
    ? new Date(event.date + 'T12:00:00').toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const shellStyle: React.CSSProperties = {
    ...cardShellBase,
    ...(hovered ? cardShellHover : null),
  };

  // ─── Compact (Teams-style column card) ────────────────────────────────────
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => onOpen(event.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="w-full text-left rounded-xl px-4 py-3.5 group cursor-pointer"
        style={shellStyle}
      >
        <span
          className="inline-block text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full font-medium mb-2.5"
          style={
            event.status === 'draft'
              ? { backgroundColor: 'rgba(0,0,0,0.04)', color: '#7A756C' }
              : { backgroundColor: statusColor.bg, color: statusColor.fg }
          }
        >
          {event.status}
        </span>
        <h4
          className="text-sm font-light leading-snug line-clamp-2"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}
        >
          {displayName}
        </h4>
        {dateLabel && (
          <p className="mt-2.5 text-[11px] truncate" style={{ color: '#8A8175' }}>{dateLabel}</p>
        )}
      </button>
    );
  }

  // ─── Card tile (default / featured rail) ──────────────────────────────────
  return (
    <div
      className={`rounded-2xl overflow-hidden flex flex-col cursor-pointer self-end ${
        featured ? 'w-[280px] sm:w-[300px] shrink-0' : 'w-full'
      }`}
      style={shellStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className="w-full text-left px-5 py-5 flex-1 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <span
            className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: statusColor.bg, color: statusColor.fg }}
          >
            {event.status}
          </span>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ease-out"
            style={{
              backgroundColor: 'rgba(0,0,0,0.03)',
              transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            }}
          >
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>

        <h3
          className={`font-light leading-snug ${featured ? 'text-lg' : 'text-base'} line-clamp-2`}
          style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}
        >
          {displayName}
        </h3>

        {/* Collapsed date — fades out while details expand */}
        {dateLabel && (
          <p
            className="text-xs text-gray-400 transition-opacity duration-200 ease-out"
            style={{
              marginTop: 16,
              opacity: expanded ? 0 : 1,
              height: expanded ? 0 : 'auto',
              marginBottom: expanded ? 0 : undefined,
              overflow: 'hidden',
            }}
          >
            {dateLabel}
          </p>
        )}
      </button>

      {/* Smooth expand / collapse — max-height keeps layout stable across browsers */}
      <div
        className="overflow-hidden transition-[max-height,opacity] duration-200 ease-out"
        style={{
          maxHeight: expanded ? 480 : 0,
          opacity: expanded ? 1 : 0,
        }}
        aria-hidden={!expanded}
      >
        <div className="px-5 pb-5 border-t" style={{ borderColor: BORDER }}>
          <div className="pt-4 space-y-2.5 mb-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              {event.eventType && (
                <span
                  className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: '#888' }}
                >
                  {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                </span>
              )}
              {programCount > 0 && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5"
                  style={{ backgroundColor: 'rgba(59,130,246,0.08)', color: '#3B82F6' }}
                >
                  <Layers className="w-2.5 h-2.5" /> {programCount}
                </span>
              )}
            </div>

            {dateLabel && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                <span>
                  {dateLabel}
                  {isMultiDay && event.endDate && (
                    <span className="text-gray-400">
                      {' '}
                      –{' '}
                      {new Date(event.endDate + 'T12:00:00').toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </span>
              </div>
            )}
            {client && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <User className="w-3.5 h-3.5 text-gray-400" />
                {getDbClientDisplayName(client)}
              </div>
            )}
            {locationParts.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {locationParts.join(', ')}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              {event.guestCount} guests
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-gray-400">Client Price</span>
              <span className="font-semibold" style={{ color: '#1A1A1A' }}>
                {fmt(summary.totalClientPrice)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Margin</span>
              <span
                className="font-medium"
                style={{ color: summary.marginWarning ? '#EF4444' : '#22C55E' }}
              >
                {summary.grossMarginPercent.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Last updated</span>
              <span className="text-gray-500">
                {event.updatedAt
                  ? new Date(event.updatedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
          </div>

          <div
            className="flex rounded-lg overflow-hidden border"
            style={{ borderColor: BORDER }}
          >
            <button
              type="button"
              onClick={() => onOpen(event.id)}
              className="flex-1 py-2 text-xs font-medium transition-colors"
              style={{ color: GOLD, backgroundColor: 'rgba(201,162,74,0.06)' }}
            >
              Open
            </button>
            {onSave && (
              <>
                <div className="w-px bg-gray-200" />
                <button
                  type="button"
                  onClick={() => onSave(event)}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-gray-400 hover:text-green-600 transition-colors disabled:opacity-40"
                >
                  <Cloud className="w-3 h-3" /> Save
                </button>
              </>
            )}
            {onDuplicate && (
              <>
                <div className="w-px bg-gray-200" />
                <button
                  type="button"
                  onClick={() => onDuplicate(event.id, displayName)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Copy className="w-3 h-3" /> Duplicate
                </button>
              </>
            )}
            {onDelete && (
              <>
                <div className="w-px bg-gray-200" />
                <button
                  type="button"
                  onClick={() => onDelete(event.id, displayName)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventListCard;
