import React, { useEffect, useMemo, useState } from 'react';
import {
  User, Building2, Mail, Phone, MapPin, Calendar, DollarSign,
  ChevronDown, ChevronRight, Heart, PartyPopper, Palette, Users,
  Clock, Edit3, Check, X, FileText, Search, UserPlus, Repeat,
} from 'lucide-react';
import { useEventContext, PlannerEvent, getEventDisplayName, EVENT_TYPE_LABELS } from '@/contexts/EventContext';
import { DbClient, getClientById, getDbClientDisplayName, fetchClients, buildClientDetailsFromAccount } from '@/data/clientDbStore';
import { getCountryByCode } from '@/data/countries';
import AddClientModal from './AddClientModal';

const GOLD = '#C9A24A';
const fmt = (n: number) => 'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface ClientProfilePanelProps {
  event: PlannerEvent;
  onOpenEvent?: (eventId: string) => void;
}

const ClientProfilePanel: React.FC<ClientProfilePanelProps> = ({ event, onOpenEvent }) => {
  const { events, updateEvent, calculateSummary } = useEventContext();
  const [expanded, setExpanded] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const [clientAccount, setClientAccount] = useState<DbClient | null>(null);
  useEffect(() => {
    if (!event.clientAccountId) { setClientAccount(null); return; }
    let cancelled = false;
    getClientById(event.clientAccountId).then(c => { if (!cancelled) setClientAccount(c); });
    return () => { cancelled = true; };
  }, [event.clientAccountId]);

  // ─── Change / link client ───────────────────────────────────────────────
  const [showPicker, setShowPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerAccounts, setPickerAccounts] = useState<DbClient[]>([]);
  const [loadingPicker, setLoadingPicker] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);

  useEffect(() => {
    if (!showPicker) return;
    setLoadingPicker(true);
    fetchClients().then(setPickerAccounts).finally(() => setLoadingPicker(false));
  }, [showPicker]);

  const filteredPickerAccounts = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    const pool = pickerAccounts.filter(a => a.id !== event.clientAccountId);
    if (!q) return pool;
    return pool.filter(a =>
      a.primary_contact_name.toLowerCase().includes(q) ||
      a.primary_contact_email.toLowerCase().includes(q) ||
      a.company_name.toLowerCase().includes(q)
    );
  }, [pickerAccounts, pickerQuery, event.clientAccountId]);

  const linkClient = (account: DbClient) => {
    updateEvent(event.id, {
      clientAccountId: account.id,
      clientDetails: buildClientDetailsFromAccount(account, event.eventType),
    });
    setShowPicker(false);
    setPickerQuery('');
  };

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

  const clientPicker = showPicker && (
    <div className="mt-4 mb-4" onClick={(e) => e.stopPropagation()}>
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={pickerQuery}
          onChange={(e) => setPickerQuery(e.target.value)}
          placeholder="Search clients by name, email, or company..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none"
          style={{ borderColor: 'rgba(201,162,74,0.2)', color: '#1A1A1A' }}
          autoFocus
        />
      </div>
      <div className="max-h-52 overflow-y-auto rounded-xl border" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
        {loadingPicker ? (
          <div className="px-4 py-5 text-center text-xs text-gray-400">Loading clients...</div>
        ) : filteredPickerAccounts.length === 0 ? (
          <div className="px-4 py-5 text-center text-xs text-gray-400">No other clients found</div>
        ) : (
          filteredPickerAccounts.map((acct) => (
            <button
              key={acct.id}
              onClick={() => linkClient(acct)}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b last:border-b-0 flex items-center gap-3"
              style={{ borderColor: 'rgba(0,0,0,0.04)' }}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}>
                {acct.client_type === 'corporate'
                  ? <Building2 className="w-3.5 h-3.5" style={{ color: GOLD }} />
                  : <User className="w-3.5 h-3.5" style={{ color: GOLD }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-800 truncate">{getDbClientDisplayName(acct)}</div>
                <div className="text-[10px] text-gray-400 truncate">{acct.primary_contact_email}</div>
              </div>
            </button>
          ))
        )}
      </div>
      <div className="flex items-center justify-between mt-2">
        <button onClick={() => setShowAddClient(true)} className="flex items-center gap-1 text-[11px] font-medium hover:opacity-70" style={{ color: GOLD }}>
          <UserPlus className="w-3 h-3" /> Create New Client
        </button>
        <button onClick={() => { setShowPicker(false); setPickerQuery(''); }} className="text-[11px] text-gray-400 hover:text-gray-600">
          Cancel
        </button>
      </div>
      {showAddClient && (
        <AddClientModal
          open={showAddClient}
          onClose={() => setShowAddClient(false)}
          onCreated={(newClient) => { linkClient(newClient); setShowAddClient(false); }}
        />
      )}
    </div>
  );

  if (!clientAccount) {
    return (
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.08)' }}>
              <User className="w-5 h-5" style={{ color: GOLD }} />
            </div>
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>Client</h3>
              <p className="text-xs text-gray-400">No client account linked</p>
            </div>
          </div>
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:shadow-sm flex-shrink-0"
            style={{ backgroundColor: GOLD, color: '#FFF' }}
          >
            <UserPlus className="w-3.5 h-3.5" /> Link Client
          </button>
        </div>
        {clientPicker}
      </div>
    );
  }

  const countryObj = getCountryByCode(clientAccount.country);
  const isReturning = previousEvents.length > 0;

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded(!expanded); }}
        className="w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-gray-50/50 cursor-pointer"
      >
        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(201,162,74,0.08)' }}>
          {clientAccount.client_type === 'corporate'
            ? <Building2 className="w-5 h-5" style={{ color: GOLD }} />
            : clientAccount.client_type === 'wedding'
              ? <Heart className="w-5 h-5" style={{ color: GOLD }} />
              : <PartyPopper className="w-5 h-5" style={{ color: GOLD }} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
              {getDbClientDisplayName(clientAccount)}
            </h3>
            {isReturning && (
              <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(139,92,246,0.08)', color: '#8B5CF6' }}>
                Returning Client
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {clientAccount.primary_contact_email && (
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Mail className="w-2.5 h-2.5" /> {clientAccount.primary_contact_email}
              </span>
            )}
            {clientAccount.primary_contact_phone && (
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Phone className="w-2.5 h-2.5" /> {clientAccount.primary_contact_phone_code} {clientAccount.primary_contact_phone}
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
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(true); setShowPicker(true); }}
            onKeyDown={(e) => e.stopPropagation()}
            title="Change which client this quote is for"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all hover:shadow-sm"
            style={{ borderColor: 'rgba(201,162,74,0.3)', color: GOLD }}
          >
            <Repeat className="w-3 h-3" /> Change
          </button>
          {expanded ? <ChevronDown className="w-4 h-4 text-gray-300" /> : <ChevronRight className="w-4 h-4 text-gray-300" />}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t px-5 pb-5" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
          {clientPicker}
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
