import React, { useMemo } from 'react';
import {
  ArrowLeft, Printer, Shield, Layers, MapPin, AlertTriangle, Palette, Users,
  Clock, Building2, ArrowRight,
} from 'lucide-react';
import {
  PlannerEvent,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  ItemCategory,
  EVENT_TYPE_LABELS,
  VENUE_TYPE_LABELS,
  MOMENT_TYPE_LABELS,
  MomentType,
  useEventContext,
  getEventDisplayName,
  LineItemSpec,
  CostLineItem,
  EventMoment,
} from '@/contexts/EventContext';
import { getCountryByCode } from '@/data/countries';
import { calculateStagedTotals, fmtStaged } from '@/data/stagedTotals';
import { getCurrencySymbol } from '@/data/countryConfig';
import { getClientAccountById, getClientDisplayName } from '@/data/clientAccountStore';

const GOLD = '#C9A24A';

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

interface ProposalViewProps {
  event: PlannerEvent;
  onBack: () => void;
}

const PlaceholderTile: React.FC<{ name: string; category: string }> = ({ name, category }) => (
  <div
    className="w-16 h-16 rounded-lg flex flex-col items-center justify-center flex-shrink-0 print:w-14 print:h-14"
    style={{ background: `linear-gradient(135deg, rgba(201,162,74,0.06) 0%, rgba(201,162,74,0.12) 100%)`, border: '1px solid rgba(201,162,74,0.15)' }}
  >
    <svg viewBox="0 0 40 40" className="w-5 h-5 mb-0.5">
      <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(201,162,74,0.25)" strokeWidth="1" />
      <circle cx="20" cy="20" r="8" fill="none" stroke="rgba(201,162,74,0.15)" strokeWidth="0.8" />
    </svg>
    <span className="text-[7px] font-medium uppercase tracking-wider text-center leading-tight px-1" style={{ color: 'rgba(201,162,74,0.5)' }}>{category}</span>
  </div>
);

const SpecSummaryBlock: React.FC<{ specs: LineItemSpec[]; venueSpaces: PlannerEvent['venueSpaces'] }> = ({ specs, venueSpaces }) => {
  if (specs.length === 0) return null;
  const clientSpecs = specs.filter(s => s.clientVisibleNotes || s.placementLabel || s.visualBrief);
  if (clientSpecs.length === 0) return null;

  return (
    <div className="mt-1.5 space-y-1">
      {clientSpecs.map(spec => {
        const space = venueSpaces.find(s => s.id === spec.venueSpaceId);
        return (
          <div key={spec.id} className="pl-3 border-l-2 py-1" style={{ borderColor: 'rgba(139,92,246,0.2)' }}>
            {spec.placementLabel && (
              <div className="flex items-center gap-1 text-[10px]" style={{ color: '#8B5CF6' }}>
                <MapPin className="w-2.5 h-2.5" />
                <span className="font-medium">{spec.placementLabel}</span>
                {space && <span className="text-gray-400">— {space.name}</span>}
              </div>
            )}
            {spec.clientVisibleNotes && (
              <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{spec.clientVisibleNotes}</p>
            )}
            {spec.visualBrief && !spec.clientVisibleNotes && (
              <div className="flex items-start gap-1 text-[10px] text-gray-400 mt-0.5">
                <Palette className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" />
                <span>{spec.visualBrief}</span>
              </div>
            )}
            {spec.exclusions && (
              <div className="flex items-start gap-1 text-[10px] mt-0.5" style={{ color: '#EF4444' }}>
                <AlertTriangle className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" />
                <span>{spec.exclusions}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ─── Moment Cost Section ─────────────────────────────────────────────────── */

interface MomentCostSectionProps {
  moment: EventMoment | null; // null = unassigned/general items
  items: CostLineItem[];
  event: PlannerEvent;
  calculateLineItem: ReturnType<typeof useEventContext>['calculateLineItem'];
  getSpecsForItem: ReturnType<typeof useEventContext>['getSpecsForItem'];
  fmt: (n: number) => string;
  momentIndex: number;
  totalMoments: number;
}

const MomentCostSection: React.FC<MomentCostSectionProps> = ({
  moment, items, event, calculateLineItem, getSpecsForItem, fmt, momentIndex, totalMoments,
}) => {
  const venueSpaces = event.venueSpaces || [];
  const programs = event.programs || [];

  // Group items by category within this moment
  const grouped: Partial<Record<ItemCategory, CostLineItem[]>> = {};
  items.forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category]!.push(item);
  });

  // Calculate moment-level totals
  const momentClientTotal = items.reduce((sum, item) => sum + calculateLineItem(item).clientPrice, 0);


  // Moment-level VAT
  const vatEnabled = event.vatEnabled !== false && event.vatRate > 0;
  const vatRate = event.vatRate || 0;
  const vatName = event.vatName || 'VAT';
  const momentVat = vatEnabled ? momentClientTotal * vatRate : 0;
  const momentInclVat = momentClientTotal + momentVat;

  // Moment color
  const color = moment ? (MOMENT_COLORS[moment.momentType] || GOLD) : '#6B7280';
  const primarySpace = moment ? venueSpaces.find(s => s.id === moment.venueSpaceId) : null;
  const prog = moment ? programs.find(p => p.id === moment.programId) : null;

  const getItemImage = (item: CostLineItem) => item.imageUrl || null;

  return (
    <div className="mb-8">
      {/* Moment Header */}
      <div
        className="flex items-center gap-3 mb-4 pb-3 border-b-2"
        style={{ borderColor: `${color}30` }}
      >
        {/* Moment number badge */}
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {moment ? momentIndex + 1 : '-'}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="text-sm font-semibold"
              style={{ color: '#1A1A1A', fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              {moment ? moment.name : 'General Event Items'}
            </h3>
            {moment && (
              <span
                className="text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium"
                style={{ backgroundColor: `${color}10`, color }}
              >
                {MOMENT_TYPE_LABELS[moment.momentType] || moment.momentType}
              </span>
            )}
            {prog && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
                {prog.programName}
              </span>
            )}
          </div>

          {/* Moment meta: time, venue */}
          {moment && (
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {moment.startTime && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {moment.startTime}
                  {moment.endTime && ` – ${moment.endTime}`}
                </span>
              )}
              {primarySpace && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Building2 className="w-2.5 h-2.5" />
                  {primarySpace.name}
                </span>
              )}
            </div>
          )}

          {!moment && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              Items not assigned to a specific moment
            </p>
          )}
        </div>

        {/* Moment total */}
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{fmt(momentClientTotal)}</div>
          <div className="text-[10px] text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Categories within this moment */}
      {CATEGORY_ORDER.filter((cat) => grouped[cat] && grouped[cat]!.length > 0).map((cat) => {
        const catItems = grouped[cat]!;
        const catTotal = catItems.reduce((sum, item) => sum + calculateLineItem(item).clientPrice, 0);

        return (
          <div key={cat} className="mb-4 ml-3">
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#888' }}>
                {CATEGORY_LABELS[cat]}
              </span>
              <span className="text-[10px] font-medium" style={{ color: '#999' }}>{fmt(catTotal)}</span>
            </div>

            <div className="space-y-1.5">
              {catItems.map((item) => {
                const calc = calculateLineItem(item);
                const imgUrl = getItemImage(item);
                const itemSpecs = getSpecsForItem(event, item.id);

                return (
                  <div key={item.id} className="py-1.5 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0 print:w-10 print:h-10"
                          style={{ border: '1px solid rgba(201,162,74,0.15)' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <PlaceholderTile name={item.name} category={CATEGORY_LABELS[cat]} />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{item.name}</span>
                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-400">
                          <span>Qty: {item.quantity}</span>
                          <span>Unit: {fmt(item.unitCost)}</span>
                        </div>
                        {item.clientVisibleNotes && (
                          <p className="text-[10px] text-gray-500 mt-1 italic leading-relaxed">{item.clientVisibleNotes}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{fmt(calc.clientPrice)}</span>
                      </div>
                    </div>
                    <SpecSummaryBlock specs={itemSpecs} venueSpaces={venueSpaces} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Moment Subtotals */}
      <div className="mt-3 ml-3 p-3 rounded-lg" style={{ backgroundColor: `${color}06`, border: `1px solid ${color}15` }}>
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#666' }}>
            {moment ? moment.name : 'General'} — Subtotal
          </span>
          <span className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>{fmt(momentClientTotal)}</span>
        </div>

        {vatEnabled && (
          <>
            <div className="flex justify-between items-baseline mt-1.5">
              <span className="text-[10px] text-gray-400 pl-2">
                {vatName} @ {(vatRate * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-gray-500">{fmt(momentVat)}</span>
            </div>
            <div className="flex justify-between items-baseline mt-1.5 pt-1.5 border-t" style={{ borderColor: `${color}15` }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
                {moment ? moment.name : 'General'} Total (incl. {vatName})
              </span>
              <span className="text-sm font-bold" style={{ color: '#1A1A1A' }}>{fmt(momentInclVat)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


/* ─── Main ProposalView ───────────────────────────────────────────────────── */

const ProposalView: React.FC<ProposalViewProps> = ({ event, onBack }) => {
  const { calculateLineItem, getSpecsForItem } = useEventContext();

  const staged = useMemo(() => calculateStagedTotals(event.lineItems, event, calculateLineItem), [event, calculateLineItem]);
  const currSym = getCurrencySymbol(event.currency || 'ZAR');
  const fmt = (n: number) => fmtStaged(n, currSym);

  const moments = event.moments || [];
  const venueSpaces = event.venueSpaces || [];
  const programs = event.programs || [];
  const backupSpaces = event.backupVenueSpaces || [];
  const countryObj = getCountryByCode(event.country || '');
  const locationParts = [event.city, event.region, countryObj?.name].filter(Boolean);

  const displayName = getEventDisplayName(event);
  const isCorporate = event.eventType === 'corporate';
  const isMultiDay = programs.length > 0;

  const handlePrint = () => window.print();

  // ─── Organize items by moment ──────────────────────────────────────────────
  const sortedMoments = useMemo(() =>
    [...moments]
      .filter(m => !m.parentMomentId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [moments]
  );

  const momentItemsMap = useMemo(() => {
    const map: Record<string, CostLineItem[]> = {};
    // Initialize moment buckets
    sortedMoments.forEach(m => { map[m.id] = []; });
    map['__unassigned__'] = [];

    event.lineItems.forEach(item => {
      if (item.momentId && map[item.momentId]) {
        map[item.momentId].push(item);
      } else {
        map['__unassigned__'].push(item);
      }
    });
    return map;
  }, [event.lineItems, sortedMoments]);

  // Only show moments that have items
  const momentsWithItems = sortedMoments.filter(m => (momentItemsMap[m.id] || []).length > 0);
  const unassignedItems = momentItemsMap['__unassigned__'] || [];
  const totalMomentSections = momentsWithItems.length + (unassignedItems.length > 0 ? 1 : 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F4F0' }}>
      <div className="print:hidden sticky top-0 z-40 border-b" style={{ backgroundColor: '#FAFAF7', borderColor: 'rgba(201,162,74,0.15)' }}>
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: GOLD }}>
            <ArrowLeft className="w-4 h-4" /> Back to Event
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider" style={{ backgroundColor: GOLD, color: '#FFF' }}>
            <Printer className="w-3.5 h-3.5" /> Print / Export PDF
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 print:p-0 print:max-w-none">
        <div className="bg-white rounded-2xl shadow-sm border p-10 print:shadow-none print:rounded-none print:border-0" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
          {/* Header */}
          <div className="flex items-start justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <svg viewBox="0 0 100 100" className="w-10 h-10">
                  <circle cx="50" cy="50" r="44" fill="none" stroke={GOLD} strokeWidth="1.5" />
                  <circle cx="50" cy="50" r="28" fill="none" stroke={GOLD} strokeWidth="1" />
                </svg>
                <span className="text-xl font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>The One</span>
              </div>
              <h1 className="text-2xl font-light mb-1" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>Event Proposal</h1>
              <p className="text-xs text-gray-400">Job Code: {event.jobCode}</p>
            </div>
            <div className="text-right text-xs text-gray-500 space-y-1">
              <p>Generated: {new Date().toLocaleDateString()}</p>
              <p>Version {event.currentVersion}</p>
            </div>
          </div>

          {/* Proposal Header — Event Name, Dates, Location, Guest Count */}
          <div className="mb-8 p-6 rounded-xl" style={{ backgroundColor: '#FAFAF7', border: '1px solid rgba(201,162,74,0.12)' }}>
            <h2
              className="text-xl font-light mb-3"
              style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}
            >
              {displayName}
            </h2>

            {event.clientAccountId && (() => {
              const acct = getClientAccountById(event.clientAccountId);
              if (!acct) return null;
              return (
                <p className="text-xs text-gray-400 mb-3">
                  Client: <span className="font-medium text-gray-600">{getClientDisplayName(acct)}</span>
                  {acct.primaryContactEmail ? ` · ${acct.primaryContactEmail}` : ''}
                </p>
              );
            })()}

            <div className="text-sm text-gray-600 mb-1">
              {event.date
                ? new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Date TBC'}
              {event.endDate && event.endDate !== event.date && (
                <span className="text-gray-400">
                  {' — '}
                  {new Date(event.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
            </div>

            {(event.venue || locationParts.length > 0) && (
              <div className="text-sm text-gray-500 mb-2">
                {[event.venue, ...locationParts].filter(Boolean).join(', ')}
              </div>
            )}

            <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
              <Users className="w-4 h-4" style={{ color: GOLD }} />
              <span className="text-base font-semibold" style={{ color: '#1A1A1A' }}>
                {event.guestCount} Guests
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
              {[
                ['Type', EVENT_TYPE_LABELS[event.eventType] || 'Wedding'],
                ['Venue Type', event.venueType ? VENUE_TYPE_LABELS[event.venueType] || '' : ''],
                ['Job Code', event.jobCode || ''],
                ['Version', `v${event.currentVersion}`],
              ].filter(([, val]) => val).map(([label, val]) => (
                <div key={label}>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
                  <p className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{val}</p>
                </div>
              ))}
              {isCorporate && event.companyName && (
                <>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Company</p>
                    <p className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{event.companyName}</p>
                  </div>
                  {event.divisionName && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Division</p>
                      <p className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{event.divisionName}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>


          {/* Venue Spaces */}
          {venueSpaces.length > 0 && (
            <div className="mb-8 p-6 rounded-xl" style={{ backgroundColor: '#FAFAF7', border: '1px solid rgba(201,162,74,0.12)' }}>
              <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: GOLD }}>Venue Spaces</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {venueSpaces.map((space) => (
                  <div key={space.id} className="text-xs">
                    <p className="font-medium" style={{ color: '#1A1A1A' }}>{space.name}</p>
                    {space.capacity && <p className="text-gray-400">Capacity: {space.capacity}</p>}
                  </div>
                ))}
              </div>
              {(event.backupVenue || backupSpaces.length > 0) && (
                <div className="mt-4 pt-3 border-t" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-3 h-3" style={{ color: '#3B82F6' }} />
                    <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: '#3B82F6' }}>Backup Venue (Weather Contingency)</span>
                  </div>
                  {event.backupVenue && <p className="text-xs font-medium mb-1" style={{ color: '#1A1A1A' }}>{event.backupVenue}</p>}
                  {backupSpaces.map((space) => <span key={space.id} className="text-xs text-gray-400 mr-3">{space.name}</span>)}
                </div>
              )}
            </div>
          )}

          {/* Programs */}
          {isMultiDay && (
            <div className="mb-8 p-6 rounded-xl" style={{ backgroundColor: '#FAFAF7', border: '1px solid rgba(201,162,74,0.12)' }}>
              <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: GOLD }}><Layers className="w-3.5 h-3.5 inline mr-1.5" />Event Programs</h2>
              <div className="space-y-3">
                {programs.sort((a, b) => a.sortOrder - b.sortOrder).map((prog) => (
                  <div key={prog.id} className="flex items-center gap-4 py-2 border-b" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
                    <div className="flex-1">
                      <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{prog.programName}</span>
                      {prog.venuePropertyName && <span className="text-xs text-gray-400 ml-2">@ {prog.venuePropertyName}</span>}
                    </div>
                    {prog.programDate && <span className="text-xs text-gray-500">{new Date(prog.programDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event Schedule (Moments) */}
          {moments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: GOLD }}>Event Schedule</h2>
              {isMultiDay ? (
                <>
                  {programs.sort((a, b) => a.sortOrder - b.sortOrder).map((prog) => {
                    const progMoments = moments.filter(m => m.programId === prog.id && !m.parentMomentId).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                    if (progMoments.length === 0) return null;
                    return (
                      <div key={prog.id} className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Layers className="w-3 h-3" style={{ color: GOLD }} />
                          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: GOLD }}>{prog.programName}</span>
                          <div className="h-px flex-1" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />
                        </div>
                        {renderMomentsList(progMoments, moments, venueSpaces)}
                      </div>
                    );
                  })}
                  {(() => {
                    const unassigned = moments.filter(m => !m.programId && !m.parentMomentId).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                    if (unassigned.length === 0) return null;
                    return (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">General</span>
                          <div className="h-px flex-1" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />
                        </div>
                        {renderMomentsList(unassigned, moments, venueSpaces)}
                      </div>
                    );
                  })()}
                </>
              ) : (
                renderMomentsList(moments.filter(m => !m.parentMomentId).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)), moments, venueSpaces)
              )}
            </div>
          )}

          {/* ─── DATA FLOW INDICATOR ──────────────────────────────────────── */}
          <div className="mb-6 p-3 rounded-lg flex items-center justify-center gap-2" style={{ backgroundColor: 'rgba(201,162,74,0.04)', border: '1px solid rgba(201,162,74,0.08)' }}>
            <span className="text-[9px] uppercase tracking-wider font-medium" style={{ color: GOLD }}>Moment</span>
            <ArrowRight className="w-3 h-3" style={{ color: 'rgba(201,162,74,0.3)' }} />
            <span className="text-[9px] uppercase tracking-wider font-medium" style={{ color: GOLD }}>Line Items</span>
            <ArrowRight className="w-3 h-3" style={{ color: 'rgba(201,162,74,0.3)' }} />
            <span className="text-[9px] uppercase tracking-wider font-medium" style={{ color: GOLD }}>Totals</span>
            <ArrowRight className="w-3 h-3" style={{ color: 'rgba(201,162,74,0.3)' }} />
            <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(201,162,74,0.1)', color: GOLD }}>Proposal</span>
          </div>

          {/* ─── COST BREAKDOWN — ORGANIZED BY MOMENT ─────────────────────── */}
          <h2 className="text-xs uppercase tracking-widest mb-2" style={{ color: GOLD }}>Cost Breakdown by Moment</h2>
          <p className="text-[10px] text-gray-400 mb-6">
            All pricing is sourced directly from each moment's costing builder. Supplier pricing updates are reflected automatically.
          </p>

          {/* Moment sections */}
          {momentsWithItems.map((moment, idx) => (
            <MomentCostSection
              key={moment.id}
              moment={moment}
              items={momentItemsMap[moment.id] || []}
              event={event}
              calculateLineItem={calculateLineItem}
              getSpecsForItem={getSpecsForItem}
              fmt={fmt}
              momentIndex={idx}
              totalMoments={totalMomentSections}
            />
          ))}

          {/* Unassigned items */}
          {unassignedItems.length > 0 && (
            <MomentCostSection
              moment={null}
              items={unassignedItems}
              event={event}
              calculateLineItem={calculateLineItem}
              getSpecsForItem={getSpecsForItem}
              fmt={fmt}
              momentIndex={momentsWithItems.length}
              totalMoments={totalMomentSections}
            />
          )}

          {/* ─── MOMENT SUMMARY TABLE ─────────────────────────────────────── */}
          {momentsWithItems.length > 1 && (
            <div className="mb-8 p-5 rounded-xl" style={{ backgroundColor: '#FAFAF7', border: '1px solid rgba(201,162,74,0.12)' }}>
              <h3 className="text-[10px] uppercase tracking-widest mb-3 font-semibold" style={{ color: GOLD }}>
                Moment Summary
              </h3>
              <div className="space-y-2">
                {momentsWithItems.map((moment, idx) => {
                  const mItems = momentItemsMap[moment.id] || [];
                  const mTotal = mItems.reduce((sum, item) => sum + calculateLineItem(item).clientPrice, 0);
                  const color = MOMENT_COLORS[moment.momentType] || GOLD;
                  return (
                    <div key={moment.id} className="flex items-center gap-3 py-1.5 border-b" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                        style={{ backgroundColor: `${color}15`, color }}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs font-medium flex-1" style={{ color: '#1A1A1A' }}>{moment.name}</span>
                      <span className="text-[10px] text-gray-400">{mItems.length} items</span>
                      <span className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>{fmt(mTotal)}</span>
                    </div>
                  );
                })}
                {unassignedItems.length > 0 && (
                  <div className="flex items-center gap-3 py-1.5 border-b" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 bg-gray-100 text-gray-400">
                      -
                    </span>
                    <span className="text-xs font-medium flex-1 text-gray-500">General Items</span>
                    <span className="text-[10px] text-gray-400">{unassignedItems.length} items</span>
                    <span className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>
                      {fmt(unassignedItems.reduce((sum, item) => sum + calculateLineItem(item).clientPrice, 0))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* ─── Staged Totals — Client-facing ────────────────────────────── */}
          <div className="mt-8 p-6 rounded-xl" style={{ backgroundColor: '#FAFAF7', border: '1px solid rgba(201,162,74,0.12)' }}>
            <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: GOLD }}>Summary</h2>

            <div className="space-y-2.5">
              {/* Subtotal 1 */}
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-semibold" style={{ color: '#555' }}>Subtotal 1 (Items)</span>
                <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{fmt(staged.subtotal1)}</span>
              </div>

              {/* Delivery + Setup */}
              {staged.deliverySetupTotal > 0 && (
                <div className="flex justify-between items-baseline pl-3">
                  <span className="text-[11px] text-gray-400">Delivery + Set-up / Installation</span>
                  <span className="text-xs text-gray-500">{fmt(staged.deliverySetupTotal)}</span>
                </div>
              )}

              {/* Subtotal 2 */}
              <div className="flex justify-between items-baseline pt-1 border-t" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
                <span className="text-xs font-semibold" style={{ color: '#555' }}>Subtotal 2</span>
                <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{fmt(staged.subtotal2)}</span>
              </div>

              {/* Collection */}
              {staged.collectionTotal > 0 && (
                <div className="flex justify-between items-baseline pl-3">
                  <span className="text-[11px] text-gray-400">Collection / Strike / After-hours</span>
                  <span className="text-xs text-gray-500">{fmt(staged.collectionTotal)}</span>
                </div>
              )}

              {/* Subtotal 3 */}
              <div className="flex justify-between items-baseline pt-1 border-t" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
                <span className="text-xs font-semibold" style={{ color: '#555' }}>Subtotal 3 (Excl. {staged.vatName})</span>
                <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{fmt(staged.subtotal3)}</span>
              </div>

              {/* VAT */}
              {staged.vatRate > 0 && (
                <div className="flex justify-between items-baseline pl-3">
                  <span className="text-[11px] text-gray-400">{staged.vatName} @ {(staged.vatRate * 100).toFixed(1)}%</span>
                  <span className="text-xs text-gray-500">{fmt(staged.vatAmount)}</span>
                </div>
              )}

              {/* Subtotal 4 */}
              <div className="flex justify-between items-baseline pt-1 border-t" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
                <span className="text-xs font-semibold" style={{ color: '#555' }}>Subtotal 4 (Incl. {staged.vatName})</span>
                <span className="text-base font-semibold" style={{ color: '#1A1A1A' }}>{fmt(staged.subtotal4)}</span>
              </div>

              {/* Refundable Deposit */}
              {staged.refundableDeposit > 0 && (
                <div className="flex justify-between items-baseline pl-3">
                  <span className="text-[11px] text-gray-400">Refundable Deposit (10% of Dry-Hire items) — No {staged.vatName}</span>
                  <span className="text-xs text-gray-500">{fmt(staged.refundableDeposit)}</span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-baseline pt-2 mt-1 border-t-2" style={{ borderColor: 'rgba(201,162,74,0.2)' }}>
                <span className="text-sm font-bold uppercase tracking-wider" style={{ color: GOLD }}>Grand Total</span>
                <span className="text-xl font-bold" style={{ color: '#1A1A1A' }}>{fmt(staged.grandTotal)}</span>
              </div>

              {/* Per Guest */}
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-[11px] text-gray-400">Per Guest (incl. {staged.vatName})</span>
                <span className="text-xs text-gray-500">{fmt(staged.perGuestInclVat)}</span>
              </div>
            </div>
          </div>

          {/* ─── Auto-update notice ───────────────────────────────────────── */}
          <div className="mt-4 flex items-center justify-center gap-2 py-2">
            <svg viewBox="0 0 16 16" className="w-3 h-3" style={{ color: '#22C55E' }}>
              <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 8l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[9px] text-gray-400">
              Pricing auto-updates from supplier quotes and moment costing builders — no manual editing required
            </span>
          </div>


          {/* Terms */}
          <div className="mt-10 pt-6 border-t" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
            <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: GOLD }}>Terms & Conditions</h2>
            <ul className="text-xs text-gray-500 space-y-1.5 leading-relaxed">
              <li>1. This proposal is valid for 14 days from the date of issue.</li>
              <li>2. A 50% deposit is required to confirm the booking.</li>
              <li>3. Final payment is due 7 days before the event date.</li>
              <li>4. Prices are subject to change if guest count changes by more than 15%.</li>
              <li>5. Cancellation within 30 days of the event incurs a 50% cancellation fee.</li>
              <li>6. All prices are quoted excluding VAT unless stated otherwise.</li>
            </ul>
          </div>

          {/* Data flow footer */}
          <div className="mt-8 pt-4 border-t flex items-center justify-center gap-2" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
            <span className="text-[8px] uppercase tracking-widest text-gray-300">
              Moment
            </span>
            <ArrowRight className="w-2.5 h-2.5 text-gray-200" />
            <span className="text-[8px] uppercase tracking-widest text-gray-300">
              Line Items
            </span>
            <ArrowRight className="w-2.5 h-2.5 text-gray-200" />
            <span className="text-[8px] uppercase tracking-widest text-gray-300">
              Totals
            </span>
            <ArrowRight className="w-2.5 h-2.5 text-gray-200" />
            <span className="text-[8px] uppercase tracking-widest text-gray-300">
              Full Costing
            </span>
            <ArrowRight className="w-2.5 h-2.5 text-gray-200" />
            <span className="text-[8px] uppercase tracking-widest font-semibold text-gray-400">
              Proposal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

function renderMomentsList(topMoments: PlannerEvent['moments'], allMoments: PlannerEvent['moments'], venueSpaces: PlannerEvent['venueSpaces']) {
  return (
    <div className="space-y-2">
      {topMoments.map((moment, i) => {
        const space = venueSpaces.find(s => s.id === moment.venueSpaceId);
        const mType = (moment.momentType || 'other') as MomentType;
        const subMoments = allMoments.filter(m => m.parentMomentId === moment.id).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        return (
          <React.Fragment key={moment.id}>
            <div className="flex items-center gap-4 py-2 border-b" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0" style={{ backgroundColor: 'rgba(201,162,74,0.1)', color: GOLD }}>{i + 1}</span>
              <div className="flex-1">
                <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{moment.name}</span>
                {space && <span className="text-xs text-gray-400 ml-2">({space.name})</span>}
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ backgroundColor: 'rgba(201,162,74,0.06)', color: '#B8860B' }}>{MOMENT_TYPE_LABELS[mType] || mType}</span>
              <div className="text-xs text-gray-500">
                {moment.startTime && <span>{moment.startTime}</span>}
                {moment.startTime && moment.endTime && <span> – {moment.endTime}</span>}
              </div>
            </div>
            {subMoments.map((sub, si) => {
              const subSpace = venueSpaces.find(s => s.id === sub.venueSpaceId);
              const subType = (sub.momentType || 'other') as MomentType;
              return (
                <div key={sub.id} className="flex items-center gap-4 py-1.5 pl-10 border-b" style={{ borderColor: 'rgba(201,162,74,0.05)' }}>
                  <span className="text-[10px] text-gray-300">{i + 1}.{si + 1}</span>
                  <div className="flex-1">
                    <span className="text-xs" style={{ color: '#555' }}>{sub.name}</span>
                    {subSpace && <span className="text-[10px] text-gray-400 ml-2">({subSpace.name})</span>}
                  </div>
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider" style={{ backgroundColor: 'rgba(201,162,74,0.04)', color: '#B8860B' }}>{MOMENT_TYPE_LABELS[subType] || subType}</span>
                  <div className="text-[10px] text-gray-400">
                    {sub.startTime && <span>{sub.startTime}</span>}
                    {sub.startTime && sub.endTime && <span> – {sub.endTime}</span>}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default ProposalView;
