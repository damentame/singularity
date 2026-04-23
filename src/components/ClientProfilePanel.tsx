import React, { useMemo, useState } from 'react';
import {
  User, Building2, Mail, Phone, MapPin, Calendar, DollarSign,
  ChevronDown, ChevronRight, Heart, PartyPopper, Palette, Users,
  Clock, Edit3, Check, X, FileText,
} from 'lucide-react';
import { useEventContext, PlannerEvent, getEventDisplayName, EVENT_TYPE_LABELS } from '@/contexts/EventContext';
import { getClientAccountById, getClientDisplayName, updateClientAccount, getAllClientAccounts } from '@/data/clientAccountStore';
import { getCountryByCode } from '@/data/countries';

const GOLD = '#C9A24A';
const fmt = (n: number) => 'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface ClientProfilePanelProps {
  event: PlannerEvent;
  onOpenEvent?: (eventId: string) => void;
}

const ClientProfilePanel: React.FC<ClientProfilePanelProps> = ({ event, onOpenEvent }) => {
  const { events, calculateSummary } = useEventContext();
  const [expanded, setExpanded] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const clientAccount = useMemo(() => {
    if (!event.clientAccountId) return null;
    return getClientAccountById(event.clientAccountId);
  }, [event.clientAccountId]);

  // Find all events for this client
  const clientEvents = useMemo(() => {
    if (!event.clientAccountId) return [];
    return events
      .filter(e => e.clientAccountId === event.clientAccountId)
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [events, event.clientAccountId]);

  const previousEvents = clientEvents.filter(e => e.id !== event.id);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalSpend = 0;
    let totalEvents = previousEvents.length;
    const suppliersUsed = new Set<string>();
    const eventTypes = new Set<string>();

    previousEvents.forEach(e => {
      const summary = calculateSummary(e.lineItems);
      totalSpend += summary.totalClientPrice;
      eventTypes.add(e.eventType);
      (e.supplierAssignments || []).forEach(sa => {
        if (sa.supplierName) suppliersUsed.add(sa.supplierName);
      });
    });

    return { totalSpend, totalEvents, suppliersUsed: Array.from(suppliersUsed), eventTypes: Array.from(eventTypes) };
  }, [previousEvents, calculateSummary]);

  if (!clientAccount) {
    return (
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.08)' }}>
            <User className="w-5 h-5" style={{ color: GOLD }} />
          </div>
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>Client</h3>
            <p className="text-xs text-gray-400">No client account linked</p>
          </div>
        </div>
      </div>
    );
  }

  const countryObj = getCountryByCode(clientAccount.country);
  const isReturning = previousEvents.length > 0;

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-gray-50/50"
      >
        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(201,162,74,0.08)' }}>
          {clientAccount.clientType === 'corporate'
            ? <Building2 className="w-5 h-5" style={{ color: GOLD }} />
            : clientAccount.clientType === 'wedding'
              ? <Heart className="w-5 h-5" style={{ color: GOLD }} />
              : <PartyPopper className="w-5 h-5" style={{ color: GOLD }} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
              {getClientDisplayName(clientAccount)}
            </h3>
            {isReturning && (
              <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(139,92,246,0.08)', color: '#8B5CF6' }}>
                Returning Client
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {clientAccount.primaryContactEmail && (
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Mail className="w-2.5 h-2.5" /> {clientAccount.primaryContactEmail}
              </span>
            )}
            {clientAccount.primaryContactPhone && (
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Phone className="w-2.5 h-2.5" /> {clientAccount.primaryContactPhoneCode} {clientAccount.primaryContactPhone}
              </span>
            )}
            {countryObj && (
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" /> {countryObj.flag} {countryObj.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isReturning && (
            <div className="text-right mr-2">
              <div className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>{stats.totalEvents} events</div>
              <div className="text-[10px] text-gray-400">{fmt(stats.totalSpend)} total</div>
            </div>
          )}
          {expanded ? <ChevronDown className="w-4 h-4 text-gray-300" /> : <ChevronRight className="w-4 h-4 text-gray-300" />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t px-5 pb-5" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
          {/* Client Stats Row */}
          {isReturning && (
            <div className="grid grid-cols-3 gap-3 pt-4 pb-3">
              <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(201,162,74,0.04)' }}>
                <div className="text-lg font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
                  {stats.totalEvents}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-gray-400 mt-0.5">Previous Events</div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(201,162,74,0.04)' }}>
                <div className="text-lg font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
                  {fmt(stats.totalSpend)}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-gray-400 mt-0.5">Total Spend</div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(201,162,74,0.04)' }}>
                <div className="text-lg font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
                  {stats.suppliersUsed.length}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-gray-400 mt-0.5">Suppliers Used</div>
              </div>
            </div>
          )}

          {/* Previous Events */}
          {previousEvents.length > 0 && (
            <div className="mt-3">
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-2.5" style={{ color: GOLD }}>
                <Clock className="w-3 h-3 inline mr-1" /> Event History
              </h4>
              <div className="space-y-2">
                {previousEvents.slice(0, 5).map(pe => {
                  const peSummary = calculateSummary(pe.lineItems);
                  return (
                    <div
                      key={pe.id}
                      className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm cursor-pointer"
                      style={{ borderColor: 'rgba(201,162,74,0.1)' }}
                      onClick={() => onOpenEvent?.(pe.id)}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(201,162,74,0.06)' }}>
                        <FileText className="w-3.5 h-3.5" style={{ color: GOLD }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: '#1A1A1A' }}>{getEventDisplayName(pe)}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(201,162,74,0.06)', color: GOLD }}>
                            {EVENT_TYPE_LABELS[pe.eventType]}
                          </span>
                          {pe.date && (
                            <span className="text-[10px] text-gray-400">
                              {new Date(pe.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{fmt(peSummary.totalClientPrice)}</div>
                        <div className="text-[10px] text-gray-400">{pe.lineItems.length} items</div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Suppliers Previously Used */}
          {stats.suppliersUsed.length > 0 && (
            <div className="mt-4">
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: GOLD }}>
                <Users className="w-3 h-3 inline mr-1" /> Previous Suppliers
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {stats.suppliersUsed.map(s => (
                  <span key={s} className="text-[10px] px-2.5 py-1 rounded-full border" style={{ borderColor: 'rgba(201,162,74,0.15)', color: '#666' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Style Preferences (placeholder for future) */}
          {isReturning && (
            <div className="mt-4">
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: GOLD }}>
                <Palette className="w-3 h-3 inline mr-1" /> Style Preferences
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {stats.eventTypes.map(et => (
                  <span key={et} className="text-[10px] px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(201,162,74,0.06)', color: GOLD }}>
                    {EVENT_TYPE_LABELS[et as keyof typeof EVENT_TYPE_LABELS] || et}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientProfilePanel;
