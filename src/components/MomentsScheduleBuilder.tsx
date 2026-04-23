import React, { useState, useMemo, useRef, useCallback } from 'react';

import {
  Plus, Trash2, Clock, ChevronDown, ChevronRight, ChevronLeft, CalendarDays, Shield,
  ArrowLeft, Layers, Pencil, Building2, Check, CornerDownRight, GripVertical,
  DollarSign, Image, Sparkles, TrendingUp, Inbox, Send, CheckCircle2,
  Package, Mail, AlertCircle,
} from 'lucide-react';


import {
  useEventContext,
  PlannerEvent,
  EventMoment,
  MOMENT_PRESETS,
  MomentType,
  MOMENT_TYPE_LABELS,
  CATEGORY_LABELS,
  RFQMessage,
} from '@/contexts/EventContext';
import { getRFQStatusForLineItem } from '@/data/rfqStore';


import { useConfigOptions } from '@/hooks/useConfigOptions';
import CostingTable from './CostingTable';
import MomentMoodBoard, { MoodBoardImage } from './MomentMoodBoard';
import MoodBoardTemplateLibrary from './MoodBoardTemplateLibrary';
import { getMoodBoardImages, setMoodBoardImages, getMoodBoardImageCount } from '@/data/moodBoardStore';

const GOLD = '#C9A24A';
const fmt = (n: number) => 'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

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

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
};

const formatShortDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch { return dateStr; }
};

const formatTime12 = (time: string): string => {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
};

const inferMomentType = (name: string): MomentType => {
  const n = name.toLowerCase();
  if (n.includes('welcome') || n.includes('drinks reception') || n.includes('arrival')) return 'welcome_drinks';
  if (n.includes('ceremony')) return 'ceremony';
  if (n.includes('cocktail') || n.includes('post ceremony')) return 'cocktail_hour';
  if (n.includes('reception')) return 'reception';
  if (n.includes('dinner') || n.includes('main event')) return 'dinner';
  if (n.includes('after')) return 'after_party';
  if (n.includes('breakfast')) return 'breakfast';
  return 'other';
};

interface MomentsScheduleBuilderProps {
  event: PlannerEvent;
  onHireSupplier: (lineItemId: string) => void;
  onViewFullCosting?: () => void;
}

const MomentsScheduleBuilder: React.FC<MomentsScheduleBuilderProps> = ({ event, onHireSupplier, onViewFullCosting }) => {

  const {
    addMoment, updateMoment, removeMoment,
    addVenueSpace, addBackupVenueSpace,
    calculateLineItem, calculateSummary,
  } = useEventContext();
  const { options: momentTypeOptions } = useConfigOptions('MOMENT_TYPE');

  const [activeMomentId, setActiveMomentId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'costing' | 'moodboard' | 'notes'>('costing');
  const [addingMoment, setAddingMoment] = useState(false);
  const [addingMomentInDetail, setAddingMomentInDetail] = useState(false);
  const [newMomentName, setNewMomentName] = useState('');
  const [newMomentType, setNewMomentType] = useState<MomentType>('other');
  const [customName, setCustomName] = useState('');

  const [creatingVenueFor, setCreatingVenueFor] = useState<string | null>(null);
  const [newVenueName, setNewVenueName] = useState('');
  const [creatingBackupFor, setCreatingBackupFor] = useState<string | null>(null);
  const [newBackupName, setNewBackupName] = useState('');

  // Mood board state
  const [moodBoardKey, setMoodBoardKey] = useState(0); // force re-render
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);

  const [draggedMomentId, setDraggedMomentId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const moments = event.moments || [];
  const venueSpaces = event.venueSpaces || [];
  const backupSpaces = event.backupVenueSpaces || [];
  const allSpaces = [...venueSpaces, ...backupSpaces];

  const topLevelMoments = useMemo(() =>
    moments
      .filter(m => !m.parentMomentId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [moments]
  );

  const momentCosts = useMemo(() => {
    const costs: Record<string, { supplierTotal: number; clientTotal: number; itemCount: number; margin: number }> = {};
    event.lineItems.forEach(item => {
      const calc = calculateLineItem(item);
      const key = item.momentId || '__overall__';
      if (!costs[key]) costs[key] = { supplierTotal: 0, clientTotal: 0, itemCount: 0, margin: 0 };
      costs[key].supplierTotal += calc.totalSupplierCost;
      costs[key].clientTotal += calc.clientPrice;
      costs[key].itemCount += 1;
    });
    // Calculate margin for each
    Object.values(costs).forEach(c => {
      c.margin = c.clientTotal > 0 ? ((c.clientTotal - c.supplierTotal) / c.clientTotal) * 100 : 0;
    });
    return costs;
  }, [event.lineItems, calculateLineItem]);

  const overallItems = event.lineItems.filter(li => !li.momentId);
  const overallCosts = momentCosts['__overall__'] || { supplierTotal: 0, clientTotal: 0, itemCount: 0, margin: 0 };
  const grandTotal = event.lineItems.reduce((s, li) => s + calculateLineItem(li).clientPrice, 0);

  const currentMomentIndex = useMemo(() => {
    if (!activeMomentId || activeMomentId === '__overall__') return -1;
    return topLevelMoments.findIndex(m => m.id === activeMomentId);
  }, [activeMomentId, topLevelMoments]);

  const prevMoment = currentMomentIndex > 0 ? topLevelMoments[currentMomentIndex - 1] : null;
  const nextMoment = currentMomentIndex >= 0 && currentMomentIndex < topLevelMoments.length - 1
    ? topLevelMoments[currentMomentIndex + 1] : null;
  const isLastMoment = currentMomentIndex === topLevelMoments.length - 1;

  const navigateToMoment = (momentId: string) => {
    setActiveMomentId(momentId);
    setActiveDetailTab('costing');
    setAddingMomentInDetail(false);
    setCreatingVenueFor(null);
    setCreatingBackupFor(null);
    setNewVenueName('');
    setNewBackupName('');
    setMoodBoardKey(k => k + 1);
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const resetAddForm = () => {
    setNewMomentName('');
    setNewMomentType('other');
    setCustomName('');
  };

  const handleAddMoment = (fromDetail = false) => {
    const name = newMomentName === 'Other' ? customName.trim() : newMomentName;
    if (!name) return;
    const maxSort = moments.reduce((max, m) => Math.max(max, m.sortOrder || 0), 0);
    addMoment(event.id, {
      name,
      momentType: newMomentType,
      date: event.date || '',
      startTime: '',
      endTime: '',
      venueSpaceId: '',
      backupVenueSpaceId: '',
      notes: '',
      programId: '',
      parentMomentId: '',
      sortOrder: maxSort + 10,
    });
    resetAddForm();
    if (fromDetail) {
      setAddingMomentInDetail(false);
    } else {
      setAddingMoment(false);
    }
  };

  const getFilteredEvent = (momentId: string): PlannerEvent => {
    const filtered = momentId === '__overall__'
      ? event.lineItems.filter(li => !li.momentId)
      : event.lineItems.filter(li => li.momentId === momentId);
    return { ...event, lineItems: filtered };
  };

  const activeMoment = activeMomentId && activeMomentId !== '__overall__'
    ? moments.find(m => m.id === activeMomentId) : null;

  const handleCreateVenue = (momentId: string) => {
    if (!newVenueName.trim()) return;
    addVenueSpace(event.id, { name: newVenueName.trim(), notes: '', capacity: null });
    setNewVenueName('');
    setCreatingVenueFor(null);
  };

  const handleCreateBackup = (momentId: string) => {
    if (!newBackupName.trim()) return;
    addBackupVenueSpace(event.id, { name: newBackupName.trim(), notes: '', capacity: null });
    setNewBackupName('');
    setCreatingBackupFor(null);
  };

  // Mood board handlers
  const handleMoodBoardChange = (momentId: string, images: MoodBoardImage[]) => {
    setMoodBoardImages(momentId, images);
    setMoodBoardKey(k => k + 1);
  };

  // Drag & Drop
  const handleDragStart = useCallback((e: React.DragEvent, momentId: string) => {
    setDraggedMomentId(momentId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', momentId);
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const insertIndex = e.clientY < midY ? targetIndex : targetIndex + 1;
    setDropTargetIndex(insertIndex);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedMomentId(null);
    setDropTargetIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedMomentId || dropTargetIndex === null) {
      setDraggedMomentId(null);
      setDropTargetIndex(null);
      return;
    }
    const draggedIndex = topLevelMoments.findIndex(m => m.id === draggedMomentId);
    if (draggedIndex === -1 || dropTargetIndex === draggedIndex || dropTargetIndex === draggedIndex + 1) {
      setDraggedMomentId(null);
      setDropTargetIndex(null);
      return;
    }
    const reordered = [...topLevelMoments];
    const [removed] = reordered.splice(draggedIndex, 1);
    const adjustedTarget = dropTargetIndex > draggedIndex ? dropTargetIndex - 1 : dropTargetIndex;
    reordered.splice(adjustedTarget, 0, removed);
    reordered.forEach((m, idx) => {
      const newSortOrder = (idx + 1) * 10;
      if (m.sortOrder !== newSortOrder) {
        updateMoment(event.id, m.id, { sortOrder: newSortOrder });
      }
    });
    setDraggedMomentId(null);
    setDropTargetIndex(null);
  }, [draggedMomentId, dropTargetIndex, topLevelMoments, updateMoment, event.id]);

  const InsertionIndicator = () => (
    <div className="flex items-center gap-2 py-0.5" style={{ height: '6px' }}>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: GOLD }} />
      <div className="flex-1 h-0.5 rounded-full" style={{ backgroundColor: GOLD }} />
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: GOLD }} />
    </div>
  );

  // Shared Add Form
  const renderAddMomentForm = (fromDetail: boolean, onCancel: () => void) => (
    <div className="p-4 rounded-xl border" style={{ borderColor: 'rgba(201,162,74,0.15)', backgroundColor: '#FAFAF7' }}>
      <div className="flex items-center gap-2 mb-3">
        <CornerDownRight className="w-3.5 h-3.5" style={{ color: GOLD }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: GOLD }}>Add Next Moment</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1.5">Moment Name</label>
          <div className="relative">
            <select value={newMomentName}
              onChange={(e) => {
                setNewMomentName(e.target.value);
                if (e.target.value && e.target.value !== 'Other') setNewMomentType(inferMomentType(e.target.value));
              }}
              className="w-full px-3 py-2 rounded-lg border text-xs outline-none appearance-none bg-white pr-8"
              style={{ borderColor: '#EFEFEF', color: newMomentName ? '#1A1A1A' : '#999' }}>
              <option value="">Select moment...</option>
              {MOMENT_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1.5">Type</label>
          <div className="relative">
            <select value={newMomentType}
              onChange={(e) => setNewMomentType(e.target.value as MomentType)}
              className="w-full px-3 py-2 rounded-lg border text-xs outline-none appearance-none bg-white pr-8"
              style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}>
              {(Object.keys(MOMENT_TYPE_LABELS) as MomentType[]).map(mt => (
                <option key={mt} value={mt}>{MOMENT_TYPE_LABELS[mt]}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
      {newMomentName === 'Other' && (
        <div className="mb-3">
          <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1.5">Custom Name</label>
          <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddMoment(fromDetail); }}
            placeholder="Enter moment name..."
            className="w-full px-3 py-2 rounded-lg border text-xs outline-none"
            style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }} autoFocus />
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => handleAddMoment(fromDetail)}
          disabled={!newMomentName || (newMomentName === 'Other' && !customName.trim())}
          className="px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
          style={{ backgroundColor: GOLD, color: '#FFF' }}>
          Add Moment
        </button>
        <button onClick={() => { onCancel(); resetAddForm(); }}
          className="px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-600">
          Cancel
        </button>
      </div>
    </div>
  );


  // ─── DETAIL VIEW ───────────────────────────────────────────────────────────
  if (activeMomentId) {
    const isOverall = activeMomentId === '__overall__';
    const filteredEvent = getFilteredEvent(activeMomentId);
    const momentItems = filteredEvent.lineItems;
    const momentSummary = calculateSummary(momentItems);
    const currentMoodImages = !isOverall ? getMoodBoardImages(activeMomentId) : [];

    // Category breakdown for this moment
    const catBreakdown: { cat: string; label: string; supplierTotal: number; clientTotal: number; itemCount: number }[] = [];
    const catMap: Record<string, { supplierTotal: number; clientTotal: number; itemCount: number }> = {};
    momentItems.forEach(li => {
      const calc = calculateLineItem(li);
      const cat = li.category;
      if (!catMap[cat]) catMap[cat] = { supplierTotal: 0, clientTotal: 0, itemCount: 0 };
      catMap[cat].supplierTotal += calc.totalSupplierCost;
      catMap[cat].clientTotal += calc.clientPrice;
      catMap[cat].itemCount += 1;
    });
    Object.entries(catMap).forEach(([cat, data]) => {
      const label = (CATEGORY_LABELS as any)[cat] || cat;
      catBreakdown.push({ cat, label, ...data });
    });

    return (
      <div className="space-y-5" ref={topRef}>
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveMomentId(null)}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-70"
            style={{ color: GOLD }}>
            <ArrowLeft className="w-3.5 h-3.5" /> All Moments
          </button>
          <div className="h-4 w-px" style={{ backgroundColor: 'rgba(201,162,74,0.2)' }} />
          <h2 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
            {isOverall ? 'Overall Event Items' : activeMoment?.name}
          </h2>
          {!isOverall && activeMoment && (
            <span className="text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ backgroundColor: `${MOMENT_COLORS[activeMoment.momentType] || GOLD}12`, color: MOMENT_COLORS[activeMoment.momentType] || GOLD }}>
              {MOMENT_TYPE_LABELS[activeMoment.momentType] || activeMoment.momentType}
            </span>
          )}
        </div>

        {/* Moment Navigation Strip */}
        {!isOverall && topLevelMoments.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {topLevelMoments.map((m, idx) => {
              const isActive = m.id === activeMomentId;
              return (
                <button key={m.id} onClick={() => navigateToMoment(m.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all border"
                  style={{
                    backgroundColor: isActive ? GOLD : 'transparent',
                    color: isActive ? '#FFF' : '#888',
                    borderColor: isActive ? GOLD : 'rgba(201,162,74,0.15)',
                  }}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                    style={{
                      backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(201,162,74,0.1)',
                      color: isActive ? '#FFF' : GOLD,
                    }}>{idx + 1}</span>
                  <span className="truncate max-w-[80px]">{m.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ─── MOMENT FINANCIAL SUMMARY ─── */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(201,162,74,0.15)' }}>
          <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg, rgba(201,162,74,0.06) 0%, rgba(201,162,74,0.02) 100%)' }}>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4" style={{ color: GOLD }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
                {isOverall ? 'Overall' : activeMoment?.name} — Financial Summary
              </span>
              <span className="text-[10px] text-gray-400 ml-auto">{momentItems.length} items</span>
            </div>

            {/* Primary metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-gray-400 block mb-0.5">Supplier Total</span>
                <span className="text-base font-semibold" style={{ color: '#1A1A1A' }}>{fmt(momentSummary.totalSupplierCost)}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-gray-400 block mb-0.5">Client (excl {event.vatName || 'VAT'})</span>
                <span className="text-base font-bold" style={{ color: '#1A1A1A' }}>{fmt(momentSummary.totalClientPrice)}</span>
              </div>
              {(event.vatEnabled !== false && event.vatRate > 0) && (
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 block mb-0.5">{event.vatName || 'VAT'} ({(event.vatRate * 100).toFixed(0)}%)</span>
                  <span className="text-sm font-medium text-gray-500">{fmt(momentSummary.totalClientPrice * event.vatRate)}</span>
                </div>
              )}
              <div>
                <span className="text-[9px] uppercase tracking-wider text-gray-400 block mb-0.5">Margin</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold" style={{ color: momentSummary.grossMarginPercent >= 25 ? '#22C55E' : '#EF4444' }}>
                    {momentSummary.grossMarginPercent.toFixed(0)}%
                  </span>
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: momentSummary.grossMarginPercent >= 25 ? '#22C55E' : '#EF4444' }} />
                </div>
              </div>
            </div>

            {/* VAT-inclusive total */}
            {(event.vatEnabled !== false && event.vatRate > 0) && (
              <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
                <span className="text-[9px] uppercase tracking-wider text-gray-400">Client Total (incl {event.vatName || 'VAT'})</span>
                <span className="text-sm font-bold" style={{ color: '#1A1A1A' }}>{fmt(momentSummary.totalClientPrice * (1 + event.vatRate))}</span>
              </div>
            )}

            {/* Category mini-breakdown */}
            {catBreakdown.length > 0 && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {catBreakdown.map(cb => (
                    <div key={cb.cat} className="flex items-center gap-1.5">
                      <span className="text-[9px] uppercase tracking-wider text-gray-400">{cb.label}</span>
                      <span className="text-[9px] text-gray-300">({cb.itemCount})</span>
                      <span className="text-[10px] font-medium" style={{ color: '#1A1A1A' }}>{fmt(cb.clientTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Moment Details (editable fields) */}
        {!isOverall && activeMoment && (
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Moment Name</label>
                <input type="text" value={activeMoment.name}
                  onChange={(e) => updateMoment(event.id, activeMoment.id, { name: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                  style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Type</label>
                <div className="relative">
                  <select value={activeMoment.momentType}
                    onChange={(e) => updateMoment(event.id, activeMoment.id, { momentType: e.target.value as MomentType })}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none appearance-none bg-white pr-7"
                    style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}>
                    {(Object.keys(MOMENT_TYPE_LABELS) as MomentType[]).map(mt => (
                      <option key={mt} value={mt}>{MOMENT_TYPE_LABELS[mt]}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Date</label>
                <input type="date" value={activeMoment.date || event.date}
                  onChange={(e) => updateMoment(event.id, activeMoment.id, { date: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                  style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }} />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Start</label>
                  <input type="time" value={activeMoment.startTime || ''}
                    onChange={(e) => updateMoment(event.id, activeMoment.id, { startTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                    style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }} />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">End</label>
                  <input type="time" value={activeMoment.endTime || ''}
                    onChange={(e) => updateMoment(event.id, activeMoment.id, { endTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                    style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }} />
                </div>
              </div>
            </div>

            {/* Venue Spaces */}
            <div className="h-px my-4" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1.5">
                  <Building2 className="w-3 h-3 inline mr-0.5" style={{ color: GOLD }} /> Venue Space
                </label>
                {creatingVenueFor === activeMoment.id ? (
                  <div className="flex items-center gap-1.5">
                    <input type="text" value={newVenueName}
                      onChange={(e) => setNewVenueName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateVenue(activeMoment.id);
                        if (e.key === 'Escape') { setCreatingVenueFor(null); setNewVenueName(''); }
                      }}
                      placeholder="e.g. Ballroom, Garden..."
                      className="flex-1 px-2.5 py-2 rounded-lg border text-xs outline-none"
                      style={{ borderColor: GOLD, color: '#1A1A1A' }} autoFocus />
                    <button onClick={() => handleCreateVenue(activeMoment.id)}
                      className="px-2.5 py-2 rounded-lg text-[10px] font-medium" style={{ backgroundColor: GOLD, color: '#FFF' }}>Add</button>
                    <button onClick={() => { setCreatingVenueFor(null); setNewVenueName(''); }}
                      className="px-2 py-2 rounded-lg text-[10px] text-gray-400">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <select value={activeMoment.venueSpaceId || ''}
                        onChange={(e) => updateMoment(event.id, activeMoment.id, { venueSpaceId: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border text-xs outline-none appearance-none bg-white pr-8"
                        style={{ borderColor: activeMoment.venueSpaceId ? 'rgba(201,162,74,0.3)' : '#EFEFEF', color: activeMoment.venueSpaceId ? '#1A1A1A' : '#999' }}>
                        <option value="">Select venue space...</option>
                        {venueSpaces.map(s => <option key={s.id} value={s.id}>{s.name}{s.capacity ? ` (cap: ${s.capacity})` : ''}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                    <button onClick={() => setCreatingVenueFor(activeMoment.id)}
                      className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-[10px] font-medium transition-colors hover:opacity-70 border flex-shrink-0"
                      style={{ borderColor: 'rgba(201,162,74,0.2)', color: GOLD }}>
                      <Plus className="w-3 h-3" /> New
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1.5">
                  <Shield className="w-3 h-3 inline mr-0.5" style={{ color: '#3B82F6' }} /> Backup Space
                </label>
                {creatingBackupFor === activeMoment.id ? (
                  <div className="flex items-center gap-1.5">
                    <input type="text" value={newBackupName}
                      onChange={(e) => setNewBackupName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateBackup(activeMoment.id);
                        if (e.key === 'Escape') { setCreatingBackupFor(null); setNewBackupName(''); }
                      }}
                      placeholder="e.g. Indoor Ballroom..."
                      className="flex-1 px-2.5 py-2 rounded-lg border text-xs outline-none"
                      style={{ borderColor: '#3B82F6', color: '#1A1A1A' }} autoFocus />
                    <button onClick={() => handleCreateBackup(activeMoment.id)}
                      className="px-2.5 py-2 rounded-lg text-[10px] font-medium" style={{ backgroundColor: '#3B82F6', color: '#FFF' }}>Add</button>
                    <button onClick={() => { setCreatingBackupFor(null); setNewBackupName(''); }}
                      className="px-2 py-2 rounded-lg text-[10px] text-gray-400">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <select value={activeMoment.backupVenueSpaceId || ''}
                        onChange={(e) => updateMoment(event.id, activeMoment.id, { backupVenueSpaceId: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border text-xs outline-none appearance-none bg-white pr-8"
                        style={{ borderColor: activeMoment.backupVenueSpaceId ? 'rgba(59,130,246,0.3)' : '#EFEFEF', color: activeMoment.backupVenueSpaceId ? '#1A1A1A' : '#999' }}>
                        <option value="">Select backup space...</option>
                        {venueSpaces.length > 0 && <optgroup label="Venue Spaces">{venueSpaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</optgroup>}
                        {backupSpaces.length > 0 && <optgroup label="Backup Spaces">{backupSpaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</optgroup>}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                    <button onClick={() => setCreatingBackupFor(activeMoment.id)}
                      className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-[10px] font-medium transition-colors hover:opacity-70 border flex-shrink-0"
                      style={{ borderColor: 'rgba(59,130,246,0.2)', color: '#3B82F6' }}>
                      <Plus className="w-3 h-3" /> New
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Notes inline */}
            <div className="mt-4">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Notes</label>
              <input type="text" value={activeMoment.notes || ''}
                onChange={(e) => updateMoment(event.id, activeMoment.id, { notes: e.target.value })}
                placeholder="Optional notes for this moment..."
                className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }} />
            </div>
          </div>
        )}

        {/* ─── COSTING BUILDER (ALWAYS VISIBLE - PRIMARY WORKSPACE) ─── */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-3.5 h-3.5" style={{ color: GOLD }} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
              Costing Builder
            </span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-medium" style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}>
              Primary Workspace
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />
          </div>
          <p className="text-[9px] text-gray-400 mb-3">
            Build your costing line-by-line here. All changes flow automatically into Full Costing and Proposals.
          </p>
          <CostingTable event={filteredEvent} onHireSupplier={onHireSupplier} />
        </div>

        {/* ─── EMAIL SUPPLIERS BUTTON (MOMENT LEVEL) ─── */}
        {(() => {
          // Gather all unique suppliers assigned to items in this moment
          const momentAssignments = (event.supplierAssignments || []).filter(a =>
            momentItems.some(li => li.id === a.lineItemId) && a.status === 'PENDING'
          );
          const uniqueSuppliers = new Map<string, { name: string; email: string; items: string[] }>();
          momentAssignments.forEach(a => {
            const key = `${a.supplierName}|||${a.supplierEmail}`.toLowerCase();
            if (!uniqueSuppliers.has(key)) {
              uniqueSuppliers.set(key, { name: a.supplierName, email: a.supplierEmail, items: [] });
            }
            const item = momentItems.find(li => li.id === a.lineItemId);
            if (item) uniqueSuppliers.get(key)!.items.push(item.name);
          });

          const supplierList = Array.from(uniqueSuppliers.values());
          const supplierEmails = supplierList.filter(s => s.email).map(s => s.email);

          if (supplierList.length === 0) return null;

          const handleEmailAllSuppliers = () => {
            const momentName = isOverall ? 'Overall Event' : activeMoment?.name || 'Event';
            const subject = encodeURIComponent(`Quote Request — ${momentName} — ${event.jobCode}`);
            const itemList = supplierList.flatMap(s => s.items.map(i => `  - ${i} (${s.name})`)).join('\n');
            const body = encodeURIComponent(
              `Dear Supplier,\n\nWe are requesting quotes for the following items for "${momentName}":\n\n${itemList}\n\nEvent Reference: ${event.jobCode}\n\nPlease provide your best pricing at your earliest convenience.\n\nKind regards`
            );
            const mailto = `mailto:${supplierEmails.join(',')}?subject=${subject}&body=${body}`;
            window.open(mailto, '_blank');
          };

          return (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(59,130,246,0.15)', backgroundColor: 'rgba(59,130,246,0.02)' }}>
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-600">
                      Email Suppliers
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 font-medium">
                      {supplierList.length} supplier{supplierList.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={handleEmailAllSuppliers}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all hover:shadow-md"
                    style={{ backgroundColor: '#3B82F6', color: '#FFF' }}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email All Suppliers
                  </button>
                </div>

                {/* Supplier chips */}
                <div className="flex flex-wrap gap-2">
                  {supplierList.map((supplier, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: 'rgba(59,130,246,0.15)', backgroundColor: '#FFF' }}>
                      <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-blue-500">{supplier.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-medium" style={{ color: '#1A1A1A' }}>{supplier.name}</span>
                        {supplier.email && (
                          <span className="text-[9px] text-gray-400 ml-1.5">{supplier.email}</span>
                        )}
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500">
                        {supplier.items.length} item{supplier.items.length !== 1 ? 's' : ''}
                      </span>
                      {supplier.email && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const subject = encodeURIComponent(`Quote Request — ${activeMoment?.name || 'Event'} — ${event.jobCode}`);
                            const items = supplier.items.map(i => `  - ${i}`).join('\n');
                            const body = encodeURIComponent(`Dear ${supplier.name},\n\nWe are requesting a quote for:\n\n${items}\n\nEvent Reference: ${event.jobCode}\n\nKind regards`);
                            window.open(`mailto:${supplier.email}?subject=${subject}&body=${body}`, '_blank');
                          }}
                          className="p-1 rounded hover:bg-blue-50 transition-colors"
                          title={`Email ${supplier.name}`}
                        >
                          <Send className="w-3 h-3 text-blue-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* View Full Event Costing Link */}
        {onViewFullCosting && (
          <button
            onClick={onViewFullCosting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all hover:shadow-sm group"
            style={{ backgroundColor: 'rgba(201,162,74,0.04)', border: '1px solid rgba(201,162,74,0.12)' }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: GOLD }} />
            <span className="text-xs font-medium" style={{ color: GOLD }}>View Full Event Costing</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" style={{ color: GOLD }} />
          </button>
        )}


        {/* ─── RFQ INBOX (PER MOMENT) ─── */}
        {(() => {
          // Get RFQ messages for items in this moment
          const momentRFQs = (event.rfqMessages || []).filter(msg =>
            momentItems.some(li => li.id === msg.lineItemId)
          );
          // Get supplier status per line item
          const supplierStatuses = momentItems.map(li => {
            const rfq = getRFQStatusForLineItem(li.id);
            return { item: li, ...rfq };
          }).filter(s => s.status);

          const rfqSentCount = momentRFQs.length;
          const pendingCount = momentRFQs.filter(r => r.status === 'sent').length;
          const repliedCount = momentRFQs.filter(r => r.status === 'replied').length;

          return (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: 'rgba(201,162,74,0.02)' }}>
                <div className="flex items-center gap-2">
                  <Inbox className="w-3.5 h-3.5" style={{ color: GOLD }} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
                    RFQ Inbox
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] flex items-center gap-1" style={{ color: rfqSentCount > 0 ? '#3B82F6' : '#CCC' }}>
                    <Send className="w-3 h-3" /> {rfqSentCount} sent
                  </span>
                  {pendingCount > 0 && (
                    <span className="text-[10px] flex items-center gap-1 text-amber-500">
                      <Clock className="w-3 h-3" /> {pendingCount} pending
                    </span>
                  )}
                  {repliedCount > 0 && (
                    <span className="text-[10px] flex items-center gap-1 text-green-500">
                      <CheckCircle2 className="w-3 h-3" /> {repliedCount} received
                    </span>
                  )}
                </div>
              </div>

              {rfqSentCount === 0 && supplierStatuses.length === 0 ? (
                <div className="px-4 py-4 text-center">
                  <Mail className="w-6 h-6 mx-auto mb-2" style={{ color: '#DDD' }} />
                  <p className="text-[10px] text-gray-400">No RFQs sent yet</p>
                  <p className="text-[9px] text-gray-300 mt-0.5">
                    Click "Hire" on any line item to send a Request for Quote to a supplier
                  </p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'rgba(0,0,0,0.03)' }}>
                  {momentRFQs.map(msg => {
                    const item = momentItems.find(li => li.id === msg.lineItemId);
                    return (
                      <div key={msg.id} className="px-4 py-2.5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium" style={{ color: '#1A1A1A' }}>{msg.supplierName}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-medium"
                              style={{
                                backgroundColor: msg.status === 'sent' ? 'rgba(59,130,246,0.08)' :
                                  msg.status === 'replied' ? 'rgba(34,197,94,0.08)' :
                                  msg.status === 'accepted' ? 'rgba(34,197,94,0.12)' : 'rgba(201,162,74,0.08)',
                                color: msg.status === 'sent' ? '#3B82F6' :
                                  msg.status === 'replied' ? '#22C55E' :
                                  msg.status === 'accepted' ? '#059669' : GOLD,
                              }}>
                              {msg.status === 'sent' ? 'Awaiting Response' :
                               msg.status === 'replied' ? 'Quote Received' :
                               msg.status === 'accepted' ? 'Confirmed' : msg.status}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-400 mt-0.5">
                            {item?.name} · {msg.jobCode} · {new Date(msg.sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <Mail className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      </div>
                    );
                  })}
                  {/* Show batch RFQ statuses */}
                  {supplierStatuses.filter(s => !momentRFQs.some(r => r.lineItemId === s.item.id)).map(s => (
                    <div key={s.item.id} className="px-4 py-2.5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-medium" style={{ color: '#1A1A1A' }}>{s.item.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-medium ml-2"
                          style={{
                            backgroundColor: s.status === 'SENT' ? 'rgba(59,130,246,0.08)' :
                              s.status === 'QUOTED' ? 'rgba(245,158,11,0.08)' :
                              s.status === 'ACCEPTED' ? 'rgba(34,197,94,0.08)' : 'rgba(156,163,175,0.08)',
                            color: s.status === 'SENT' ? '#3B82F6' :
                              s.status === 'QUOTED' ? '#F59E0B' :
                              s.status === 'ACCEPTED' ? '#22C55E' : '#9CA3AF',
                          }}>
                          {s.status === 'SENT' ? 'RFQ Sent' :
                           s.status === 'QUOTED' ? 'Quote Received' :
                           s.status === 'REVISED' ? 'Quote Revised' :
                           s.status === 'ACCEPTED' ? 'Confirmed' : s.status}
                        </span>
                      </div>
                      <Package className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}


        {/* ─── MOOD BOARD (ALWAYS VISIBLE BELOW COSTING) ─── */}
        {!isOverall && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Image className="w-3.5 h-3.5" style={{ color: GOLD }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
                Mood Board
              </span>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-medium" style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}>
                {currentMoodImages.length} image{currentMoodImages.length !== 1 ? 's' : ''}
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />
            </div>
            <p className="text-[9px] text-gray-400 mb-3">
              Capture the visual journey for this moment. Upload inspiration images or generate with AI.
            </p>
            <MomentMoodBoard
              key={`mb-${activeMomentId}-${moodBoardKey}`}
              momentId={activeMomentId!}
              momentName={activeMoment?.name || ''}
              images={currentMoodImages}
              onImagesChange={(imgs) => handleMoodBoardChange(activeMomentId!, imgs)}
              onBrowseTemplates={() => setShowTemplateLibrary(true)}
            />
          </div>
        )}

        {/* ─── MOOD BOARD TEMPLATE LIBRARY MODAL ─── */}
        {showTemplateLibrary && !isOverall && (
          <MoodBoardTemplateLibrary
            onClose={() => setShowTemplateLibrary(false)}
            momentName={activeMoment?.name || ''}
            onApplyTemplate={(templateImages, _templateName) => {
              // Merge template images with existing mood board images
              const existing = getMoodBoardImages(activeMomentId!);
              const merged = [...existing, ...templateImages.map((img, i) => ({
                ...img,
                sortOrder: existing.length + i,
              }))];
              setMoodBoardImages(activeMomentId!, merged);
              setMoodBoardKey(k => k + 1);
            }}
          />
        )}


        {/* ─── PLANNER NOTES ─── */}
        {!isOverall && activeMoment && (
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: GOLD }}>
              <Layers className="w-3 h-3 inline mr-1" /> Planner Notes
            </h4>
            <textarea
              value={activeMoment?.notes || ''}
              onChange={(e) => activeMoment && updateMoment(event.id, activeMoment.id, { notes: e.target.value })}
              placeholder="Add detailed notes for this moment..."
              className="w-full px-3 py-2.5 rounded-lg border text-xs outline-none resize-none"
              style={{ borderColor: '#EFEFEF', color: '#1A1A1A', minHeight: '80px' }}
            />
          </div>
        )}


        {/* Bottom Navigation */}
        {!isOverall && (
          <>
            <div className="h-px" style={{ backgroundColor: 'rgba(201,162,74,0.12)' }} />
            <div className="flex items-stretch gap-3">
              {prevMoment ? (
                <button onClick={() => navigateToMoment(prevMoment.id)}
                  className="flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all hover:shadow-sm group"
                  style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
                  <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="text-[9px] uppercase tracking-wider text-gray-300 mb-0.5">Previous</div>
                    <div className="text-xs font-medium truncate" style={{ color: '#1A1A1A' }}>{prevMoment.name}</div>
                  </div>
                </button>
              ) : <div className="flex-1" />}
              {nextMoment ? (
                <button onClick={() => navigateToMoment(nextMoment.id)}
                  className="flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all hover:shadow-sm group"
                  style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
                  <div className="text-right min-w-0 flex-1">
                    <div className="text-[9px] uppercase tracking-wider text-gray-300 mb-0.5">Next</div>
                    <div className="text-xs font-medium truncate" style={{ color: '#1A1A1A' }}>{nextMoment.name}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                </button>
              ) : <div className="flex-1" />}
            </div>

            <div className="h-px" style={{ backgroundColor: 'rgba(201,162,74,0.08)' }} />
            {addingMomentInDetail ? (
              renderAddMomentForm(true, () => setAddingMomentInDetail(false))
            ) : (
              <button onClick={() => { setAddingMomentInDetail(true); resetAddForm(); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed transition-all hover:shadow-sm"
                style={{ borderColor: 'rgba(201,162,74,0.2)', color: GOLD }}>
                <Plus className="w-4 h-4" />
                <span className="text-xs font-medium">Add Next Moment</span>
              </button>
            )}
          </>
        )}
      </div>
    );
  }


  // ─── SUMMARY VIEW ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
          <CalendarDays className="w-3.5 h-3.5 inline mr-1.5" />
          Moments / Schedule
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-300">
            {moments.length} moment{moments.length !== 1 ? 's' : ''} · Grand Total: <span className="font-semibold" style={{ color: '#1A1A1A' }}>{fmt(grandTotal)}</span>
          </span>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 italic -mt-2">
        Each moment has its own timeline, costing, mood board, and supplier assignments. Click to manage.
      </p>

      <div className="h-px" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />

      {topLevelMoments.length === 0 && !addingMoment && (
        <p className="text-xs text-gray-300 text-center py-6 italic">
          No moments added yet. Add moments like Arrival Drinks, Ceremony, Reception, After Party, etc.
        </p>
      )}

      {topLevelMoments.length > 1 && (
        <p className="text-[10px] text-gray-300 italic flex items-center gap-1">
          <GripVertical className="w-3 h-3 text-gray-300" /> Drag to reorder moments
        </p>
      )}

      <div className="space-y-2"
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={handleDrop}
        onDragLeave={() => setDropTargetIndex(null)}>
        {topLevelMoments.map((moment, index) => {
          const costs = momentCosts[moment.id] || { supplierTotal: 0, clientTotal: 0, itemCount: 0, margin: 0 };
          const primarySpace = venueSpaces.find(s => s.id === moment.venueSpaceId);
          const backupSpace = allSpaces.find(s => s.id === (moment.backupVenueSpaceId || ''));
          const isDragged = draggedMomentId === moment.id;
          const draggedIndex = draggedMomentId ? topLevelMoments.findIndex(m => m.id === draggedMomentId) : -1;
          const showIndicatorAbove = dropTargetIndex === index && draggedMomentId && !isDragged
            && dropTargetIndex !== draggedIndex && dropTargetIndex !== draggedIndex + 1;
          const showIndicatorBelow = index === topLevelMoments.length - 1
            && dropTargetIndex === topLevelMoments.length && draggedMomentId
            && dropTargetIndex !== draggedIndex + 1;
          const color = MOMENT_COLORS[moment.momentType] || GOLD;
          const moodCount = getMoodBoardImageCount(moment.id);
          const moodImages = moodCount > 0 ? getMoodBoardImages(moment.id).slice(0, 3) : [];

          return (
            <React.Fragment key={moment.id}>
              {showIndicatorAbove && <InsertionIndicator />}

              <div
                draggable
                onDragStart={(e) => handleDragStart(e, moment.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="rounded-2xl border transition-all cursor-pointer group select-none overflow-hidden"
                style={{
                  borderColor: isDragged ? GOLD : 'rgba(201,162,74,0.12)',
                  opacity: isDragged ? 0.4 : 1,
                  borderLeft: `3px solid ${color}`,
                }}
                onClick={() => { if (!draggedMomentId) navigateToMoment(moment.id); }}
              >
                <div className="p-4">
                  {/* Top Row: Name + Time + Budget */}
                  <div className="flex items-start gap-3">
                    {/* Drag Handle */}
                    <div className="flex-shrink-0 pt-1 opacity-30 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                      onMouseDown={(e) => e.stopPropagation()}>
                      <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{moment.name}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium"
                          style={{ backgroundColor: `${color}10`, color }}>
                          {MOMENT_TYPE_LABELS[moment.momentType]}
                        </span>
                      </div>

                      {/* Time + Venue Row */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {moment.startTime && (
                          <span className="text-[11px] font-medium flex items-center gap-1" style={{ color }}>
                            <Clock className="w-3 h-3" />
                            {formatTime12(moment.startTime)}
                            {moment.endTime && <span className="text-gray-400 mx-0.5">—</span>}
                            {moment.endTime && formatTime12(moment.endTime)}
                          </span>
                        )}
                        {(moment.date && moment.date !== event.date) && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-0.5"
                            style={{ backgroundColor: 'rgba(139,92,246,0.08)', color: '#8B5CF6' }}>
                            <CalendarDays className="w-2.5 h-2.5" /> {formatShortDate(moment.date)}
                          </span>
                        )}
                        {primarySpace && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <Building2 className="w-2.5 h-2.5" /> {primarySpace.name}
                          </span>
                        )}
                        {backupSpace && (
                          <span className="text-[10px] text-blue-400 flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5" /> {backupSpace.name}
                          </span>
                        )}
                      </div>

                      {/* Mood Board Preview */}
                      {moodImages.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2.5">
                          {moodImages.map(img => (
                            <div key={img.id} className="w-12 h-9 rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
                              <img src={img.url} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {moodCount > 3 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: GOLD }}>+{moodCount - 3}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Cost Panel */}
                    <div className="flex-shrink-0 text-right pl-3 border-l" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
                      <div className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{fmt(costs.clientTotal)}</div>
                      <div className="text-[10px] text-gray-400">{costs.itemCount} item{costs.itemCount !== 1 ? 's' : ''}</div>
                      {costs.itemCount > 0 && (
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <TrendingUp className="w-2.5 h-2.5" style={{ color: costs.margin >= 25 ? '#22C55E' : '#F59E0B' }} />
                          <span className="text-[10px] font-medium" style={{ color: costs.margin >= 25 ? '#22C55E' : '#F59E0B' }}>
                            {costs.margin.toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); removeMoment(event.id, moment.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Remove moment">
                        <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-red-400" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                </div>
              </div>

              {showIndicatorBelow && <InsertionIndicator />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Overall Event Items */}
      {overallItems.length > 0 && (
        <div className="rounded-2xl border transition-all hover:shadow-sm cursor-pointer group"
          style={{ borderColor: 'rgba(0,0,0,0.06)', backgroundColor: '#FAFAF7' }}
          onClick={() => navigateToMoment('__overall__')}>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
              <Layers className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-500">Overall Event Items</span>
              <p className="text-[10px] text-gray-300 mt-0.5">Items not yet assigned to a specific moment</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>{fmt(overallCosts.clientTotal)}</div>
              <div className="text-[10px] text-gray-400">{overallCosts.itemCount} items</div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
          </div>
        </div>
      )}

      {/* Add Moment */}
      {addingMoment ? (
        renderAddMomentForm(false, () => setAddingMoment(false))
      ) : (
        <button onClick={() => { setAddingMoment(true); resetAddForm(); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed transition-all hover:shadow-sm"
          style={{ borderColor: 'rgba(201,162,74,0.2)', color: GOLD }}>
          <Plus className="w-4 h-4" />
          <span className="text-xs font-medium">Add Moment</span>
        </button>
      )}

      {/* View Full Event Costing Link */}
      {onViewFullCosting && topLevelMoments.length > 0 && (
        <>
          <div className="h-px" style={{ backgroundColor: 'rgba(201,162,74,0.08)' }} />
          <button
            onClick={onViewFullCosting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all hover:shadow-sm group"
            style={{ backgroundColor: 'rgba(201,162,74,0.04)', border: '1px solid rgba(201,162,74,0.12)' }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: GOLD }} />
            <span className="text-xs font-medium" style={{ color: GOLD }}>View Full Event Costing</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" style={{ color: GOLD }} />
          </button>
          <p className="text-[9px] text-gray-400 text-center -mt-1">
            Full Costing is a read-only aggregated view generated from all your Moments
          </p>
        </>
      )}
    </div>
  );
};

export default MomentsScheduleBuilder;
