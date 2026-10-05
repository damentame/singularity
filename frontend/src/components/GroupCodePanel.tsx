import React, { useMemo, useState } from 'react';
import { Layers, Search, Check, AlertTriangle, Sparkles } from 'lucide-react';
import { useEventContext, PlannerEvent, getEventDisplayName } from '@/contexts/EventContext';
import { getCurrencySymbol } from '@/data/countryConfig';

const GOLD = '#C9A24A';

interface GroupCodePanelProps {
  event: PlannerEvent;
}

interface Candidate {
  event: PlannerEvent;
  sameClient: boolean;
  daysApart: number;
}

const formatShortDate = (date: string) =>
  date ? new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBC';

const GroupCodePanel: React.FC<GroupCodePanelProps> = ({ event }) => {
  const { events, linkEventsToGroup, unlinkEventFromGroup, getGroupTotal, calculateSummary } = useEventContext();
  const [showPicker, setShowPicker] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const groupTotal = event.groupCode ? getGroupTotal(event.groupCode) : null;
  const groupMembers = useMemo(
    () => (event.groupCode ? events.filter(e => e.groupCode === event.groupCode && e.id !== event.id) : []),
    [events, event.groupCode, event.id],
  );

  const candidates = useMemo((): Candidate[] => {
    if (!showPicker) return [];
    const currentTime = event.date ? new Date(event.date + 'T00:00:00').getTime() : NaN;
    const q = query.trim().toLowerCase();
    return events
      .filter(e => e.id !== event.id && (!event.groupCode || e.groupCode !== event.groupCode))
      .filter(e => !q || getEventDisplayName(e).toLowerCase().includes(q))
      .map(e => ({
        event: e,
        sameClient: !!event.clientAccountId && e.clientAccountId === event.clientAccountId,
        daysApart: e.date && !Number.isNaN(currentTime) ? Math.abs(new Date(e.date + 'T00:00:00').getTime() - currentTime) / 86400000 : 999,
      }))
      .sort((a, b) => (a.sameClient !== b.sameClient ? (a.sameClient ? -1 : 1) : a.daysApart - b.daysApart));
  }, [showPicker, query, events, event.id, event.groupCode, event.clientAccountId, event.date]);

  const conflictingCodes = useMemo(() => {
    const codes = new Set<string>();
    if (event.groupCode) codes.add(event.groupCode);
    candidates.forEach(c => { if (selected.has(c.event.id) && c.event.groupCode) codes.add(c.event.groupCode); });
    return Array.from(codes);
  }, [candidates, selected, event.groupCode]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const closePicker = () => { setShowPicker(false); setQuery(''); setSelected(new Set()); };

  const confirmLink = () => {
    if (selected.size === 0) return;
    const targetCode = conflictingCodes[0]; // existing code wins over minting a new one; '' falls through to undefined below
    const ids = [event.id, ...Array.from(selected)];
    linkEventsToGroup(ids, targetCode || undefined);
    closePicker();
  };

  const currSym = getCurrencySymbol(event.billingCurrency || event.currency || 'ZAR');
  const fmt = (n: number) => `${currSym} ${n.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`;

  const picker = showPicker && (
    <div className="mt-3 rounded-xl border p-3.5" style={{ borderColor: 'rgba(201,162,74,0.25)', backgroundColor: 'rgba(201,162,74,0.03)' }}>
      <div className="relative mb-2.5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your other quotes..."
          className="w-full pl-9 pr-4 py-2 rounded-lg border text-xs outline-none"
          style={{ borderColor: 'rgba(201,162,74,0.2)', color: '#1A1A1A' }}
        />
      </div>

      <div className="max-h-56 overflow-y-auto rounded-lg border divide-y" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
        {candidates.length === 0 ? (
          <div className="px-4 py-5 text-center text-xs text-gray-400">No other quotes to link.</div>
        ) : (
          candidates.map(({ event: candidate, sameClient }) => {
            const isSelected = selected.has(candidate.id);
            return (
              <button
                type="button"
                key={candidate.id}
                onClick={() => toggleSelect(candidate.id)}
                className="w-full text-left px-3.5 py-2.5 flex items-center gap-3 transition-colors hover:bg-white"
                style={{ backgroundColor: isSelected ? 'rgba(201,162,74,0.08)' : 'transparent' }}
              >
                <div
                  className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors"
                  style={{ borderColor: isSelected ? GOLD : '#D4D4D4', backgroundColor: isSelected ? GOLD : 'transparent' }}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-medium text-gray-800 truncate">{getEventDisplayName(candidate)}</span>
                    {sameClient && (
                      <span className="text-[8px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(201,162,74,0.15)', color: GOLD }}>
                        Same client
                      </span>
                    )}
                    {candidate.groupCode && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
                        In {candidate.groupCode}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400">{formatShortDate(candidate.date)}</div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {conflictingCodes.length > 1 && (
        <p className="text-[9px] text-amber-600 mt-2 flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5" /> These quotes belong to different groups — they'll all move into one.
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        <button type="button" onClick={closePicker} className="text-[11px] text-gray-400 hover:text-gray-600">Cancel</button>
        <button
          type="button"
          onClick={confirmLink}
          disabled={selected.size === 0}
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 transition-colors"
          style={{ backgroundColor: GOLD, color: '#FFF' }}
        >
          {event.groupCode
            ? `Add ${selected.size} Quote${selected.size === 1 ? '' : 's'}`
            : `Create Group · ${selected.size + 1} Quote${selected.size === 0 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Layers className="w-3.5 h-3.5" style={{ color: GOLD }} />
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>Quote Group</h3>
      </div>

      {event.groupCode && groupTotal ? (
        <div className="rounded-xl border p-3.5" style={{ borderColor: 'rgba(201,162,74,0.25)', backgroundColor: 'rgba(201,162,74,0.04)' }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-sm font-mono font-bold" style={{ color: '#1A1A1A' }}>{event.groupCode}</span>
              <p className="text-[10px] text-gray-400 mt-0.5">{groupTotal.eventCount} linked quote{groupTotal.eventCount !== 1 ? 's' : ''}</p>
            </div>
            <button type="button" onClick={() => unlinkEventFromGroup(event.id)} className="text-[10px] text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
              Unlink this quote
            </button>
          </div>

          {groupTotal.currencies.length > 1 ? (
            <div className="mt-2.5 flex items-start gap-1.5 text-[10px] text-amber-600">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Mixed currencies ({groupTotal.currencies.join(', ')}) — showing each quote's own total below rather than one combined figure.</span>
            </div>
          ) : (
            <p className="text-xs mt-2.5">
              Combined total: <span className="font-semibold" style={{ color: '#1A1A1A' }}>{fmt(groupTotal.totalClientPrice)}</span>
            </p>
          )}

          {groupMembers.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t pt-2.5" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
              {groupMembers.map(m => (
                <div key={m.id} className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-600 truncate">{getEventDisplayName(m)} <span className="text-gray-300">· {formatShortDate(m.date)}</span></span>
                  <span className="font-medium flex-shrink-0 ml-2" style={{ color: '#1A1A1A' }}>
                    {getCurrencySymbol(m.billingCurrency || m.currency || 'ZAR')} {calculateSummary(m.lineItems).totalClientPrice.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!showPicker && (
            <button type="button" onClick={() => setShowPicker(true)} className="flex items-center gap-1 text-[10px] font-medium mt-3" style={{ color: GOLD }}>
              <Sparkles className="w-3 h-3" /> Add Another Quote
            </button>
          )}
          {picker}
        </div>
      ) : (
        <div>
          <p className="text-[10px] text-gray-300 italic mb-2">Not part of a group. Link it with other quotes (e.g. each day of a multi-day event) to see one combined total.</p>
          {!showPicker && (
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all hover:shadow-sm"
              style={{ borderColor: 'rgba(201,162,74,0.3)', color: GOLD }}
            >
              <Sparkles className="w-3.5 h-3.5" /> Link to Another Quote
            </button>
          )}
          {picker}
        </div>
      )}
    </div>
  );
};

export default GroupCodePanel;
