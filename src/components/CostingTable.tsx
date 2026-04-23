import React, { useState, useRef } from 'react';
import {
  ChevronDown, ChevronRight, Trash2, Plus, Settings2, Send, AlertCircle,
  Clock, ImageIcon, Link2, Upload, X, FileText, MapPin, Package,
  Copy, Users, Truck, CheckCircle2, Loader2, MoreHorizontal,
} from 'lucide-react';
import {
  useEventContext,
  PlannerEvent,
  ItemCategory,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CostLineItem,
  TIME_LABELS,
  TimeType,
} from '@/contexts/EventContext';
import { supabase } from '@/lib/supabase';
import { getRFQStatusForLineItem } from '@/data/rfqStore';
import LineItemSpecEditor from './LineItemSpecEditor';


const GOLD = '#C9A24A';
const fmt = (n: number) => 'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const RFQ_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'RFQ Draft', color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' },
  SENT: { label: 'RFQ Sent', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
  QUOTED: { label: 'Quote Received', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  REVISED: { label: 'Quote Revised', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
  ACCEPTED: { label: 'Confirmed', color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
  LOCKED: { label: 'Locked', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
};

interface CostingTableProps {
  event: PlannerEvent;
  onHireSupplier: (lineItemId: string) => void;
}

const CostingTable: React.FC<CostingTableProps> = ({ event, onHireSupplier }) => {
  const { updateLineItem, removeLineItem, addLineItem, calculateLineItem, getSpecsForItem } = useEventContext();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showAdvanced, setShowAdvanced] = useState<Record<string, boolean>>({});
  const [addingTo, setAddingTo] = useState<ItemCategory | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [specEditorItem, setSpecEditorItem] = useState<CostLineItem | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showItemMenu, setShowItemMenu] = useState<string | null>(null);

  const moments = event.moments || [];

  const grouped: Partial<Record<ItemCategory, CostLineItem[]>> = {};
  event.lineItems.forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category]!.push(item);
  });

  // Get categories that have items or are being added to
  const activeCategories = CATEGORY_ORDER.filter(cat => grouped[cat] || addingTo === cat);

  const toggleCollapse = (cat: string) => setCollapsed(p => ({ ...p, [cat]: !p[cat] }));
  const toggleAdvanced = (id: string) => {
    setShowAdvanced(p => ({ ...p, [id]: !p[id] }));
    setShowItemMenu(null);
  };

  const handleAddItem = (category: ItemCategory) => {
    if (!newItemName.trim()) return;
    addLineItem(event.id, {
      name: newItemName.trim(), category, quantity: 1, isGuestDependent: false, guestRatio: 0,
      unitCost: 0, setupCost: 0, breakdownCost: 0, deliveryCost: 0, deliveryType: 'flat',
      markupPercent: 30, flagged: false, notes: '', rfqSent: false, rfqJobCode: '',
      momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '',
      internalNotes: '', clientVisibleNotes: '', specIds: [],
      supplierAssignmentId: '',
      supplierPriceIncludesVat: event.defaultPricesIncludeVat ?? true,
      vatRateUsed: event.vatRate ?? 0.15,
      isDryHire: false,
    });
    setNewItemName('');
    setAddingTo(null);
  };

  const handleDuplicateItem = (item: CostLineItem) => {
    const { id, ...rest } = item;
    addLineItem(event.id, {
      ...rest,
      name: `${item.name} (copy)`,
      rfqSent: false,
      rfqJobCode: '',
      supplierAssignmentId: '',
    });
    setShowItemMenu(null);
  };

  const handleAddCustomCategory = () => {
    if (!newCategoryName.trim()) return;
    // Use 'other' category but with the custom name as the item
    setAddingTo('other');
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const handleFileUpload = async (itemId: string, file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(p => ({ ...p, [itemId]: true }));
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `item-images/${event.id}/${itemId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('supplier-media').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('supplier-media').getPublicUrl(path);
      if (urlData?.publicUrl) updateLineItem(event.id, itemId, { imageUrl: urlData.publicUrl });
    } catch (err) {
      console.warn('Upload failed:', err);
    } finally {
      setUploading(p => ({ ...p, [itemId]: false }));
    }
  };

  const handleSetImageUrl = (itemId: string) => {
    const url = (imageUrlInput[itemId] || '').trim();
    if (url) {
      updateLineItem(event.id, itemId, { imageUrl: url });
      setImageUrlInput(p => ({ ...p, [itemId]: '' }));
    }
  };

  // Inline edit component
  const InlineEdit: React.FC<{
    value: number; onChange: (v: number) => void; prefix?: string; suffix?: string; width?: string;
  }> = ({ value, onChange, prefix, suffix, width = 'w-20' }) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(String(value));
    const commit = () => {
      const parsed = parseFloat(draft);
      if (!isNaN(parsed) && parsed >= 0) onChange(parsed);
      else setDraft(String(value));
      setEditing(false);
    };
    return (
      <div className="flex items-center gap-0.5">
        {prefix && <span className="text-[10px] text-gray-400">{prefix}</span>}
        <input
          type="text" inputMode="decimal"
          value={editing ? draft : value.toFixed(value % 1 === 0 ? 0 : 2)}
          onFocus={() => { setEditing(true); setDraft(String(value)); }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
          className={`${width} h-7 text-right text-xs rounded-lg border px-1.5 outline-none transition-all`}
          style={{
            borderColor: editing ? GOLD : 'rgba(201,162,74,0.15)',
            color: '#1A1A1A',
            backgroundColor: editing ? '#FFF' : 'rgba(201,162,74,0.02)',
          }}
        />
        {suffix && <span className="text-[10px] text-gray-400">{suffix}</span>}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-2">
        {activeCategories.map((cat) => {
          const items = grouped[cat] || [];
          const isCollapsed = collapsed[cat];
          const catSupplierTotal = items.reduce((s, i) => s + calculateLineItem(i).totalSupplierCost, 0);
          const catClientTotal = items.reduce((s, i) => s + calculateLineItem(i).clientPrice, 0);
          const catMargin = catClientTotal > 0 ? ((catClientTotal - catSupplierTotal) / catClientTotal) * 100 : 0;

          return (
            <div key={cat} className="rounded-xl overflow-hidden bg-white" style={{ border: '1px solid rgba(201,162,74,0.1)' }}>
              {/* Category Header */}
              <button
                onClick={() => toggleCollapse(cat)}
                className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-black/[0.01]"
                style={{ backgroundColor: 'rgba(201,162,74,0.02)' }}
              >
                <div className="flex items-center gap-2.5">
                  {isCollapsed
                    ? <ChevronRight className="w-3.5 h-3.5" style={{ color: GOLD }} />
                    : <ChevronDown className="w-3.5 h-3.5" style={{ color: GOLD }} />
                  }
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#555' }}>
                    {CATEGORY_LABELS[cat]}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}>
                    {items.length}
                  </span>
                </div>
                <div className="flex items-center gap-5 text-xs">
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-gray-300 block">Supplier</span>
                    <span className="text-gray-500">{fmt(catSupplierTotal)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-gray-300 block">Client</span>
                    <span className="font-medium" style={{ color: '#1A1A1A' }}>{fmt(catClientTotal)}</span>
                  </div>
                  <div className="text-right min-w-[40px]">
                    <span className="text-[9px] uppercase tracking-wider text-gray-300 block">Margin</span>
                    <span className="font-medium" style={{ color: catMargin >= 25 ? '#22C55E' : '#F59E0B' }}>
                      {catMargin.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </button>

              {!isCollapsed && (
                <div>
                  {/* Column Headers */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[9px] uppercase tracking-wider text-gray-400 border-y" style={{ borderColor: 'rgba(201,162,74,0.06)' }}>
                    <div className="col-span-3">Item</div>
                    <div className="col-span-1 text-center">Qty</div>
                    <div className="col-span-1 text-right">Unit Cost</div>
                    <div className="col-span-1 text-right">Markup</div>
                    <div className="col-span-2 text-right">Supplier Total</div>
                    <div className="col-span-2 text-right">Client Price</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>

                  {items.map((item) => {
                    const calc = calculateLineItem(item);
                    const isAdv = showAdvanced[item.id];
                    const assignedMoment = moments.find(m => m.id === item.momentId);
                    const itemTimeType = item.timeType || 'normal';
                    const hasImage = !!item.imageUrl;
                    const specCount = getSpecsForItem(event, item.id).length;
                    const rfqInfo = getRFQStatusForLineItem(item.id);
                    const rfqConfig = rfqInfo.status ? RFQ_STATUS_CONFIG[rfqInfo.status] : null;
                    const isMenuOpen = showItemMenu === item.id;

                    // Check for pending supplier assignment
                    const pendingAssignment = (event.supplierAssignments || []).find(
                      a => a.lineItemId === item.id && a.status === 'PENDING'
                    );
                    const hasAssignment = !!pendingAssignment;
                    const isHired = item.rfqSent || !!rfqInfo.status;

                    return (
                      <div key={item.id}>
                        {/* Main Row */}
                        <div
                          className="grid grid-cols-12 gap-2 px-4 py-3 items-center border-b transition-all hover:bg-amber-50/20"
                          style={{ borderColor: 'rgba(0,0,0,0.03)' }}
                        >
                          {/* Item Name + Badges */}
                          <div className="col-span-3 flex items-center gap-2 min-w-0">
                            {hasImage ? (
                              <img src={item.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                                style={{ border: '1px solid rgba(201,162,74,0.15)' }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: 'rgba(201,162,74,0.04)', border: '1px solid rgba(201,162,74,0.1)' }}>
                                <ImageIcon className="w-3.5 h-3.5" style={{ color: 'rgba(201,162,74,0.25)' }} />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-medium truncate block" style={{ color: '#1A1A1A' }}>{item.name}</span>
                              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                {item.flagged && (
                                  <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                )}
                                {item.isGuestDependent && (
                                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(59,130,246,0.08)', color: '#3B82F6' }}>
                                    <Users className="w-2.5 h-2.5 inline mr-0.5" />auto
                                  </span>
                                )}
                                {/* Supplier Assignment Badge */}
                                {hasAssignment && !isHired && (
                                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(59,130,246,0.08)', color: '#3B82F6' }}>
                                    <Users className="w-2.5 h-2.5 inline mr-0.5" />{pendingAssignment.supplierName}
                                  </span>
                                )}
                                {rfqConfig && (
                                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: rfqConfig.bg, color: rfqConfig.color }}>
                                    {rfqConfig.label}
                                  </span>
                                )}
                                {specCount > 0 && (
                                  <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(139,92,246,0.08)', color: '#8B5CF6' }}>
                                    {specCount} spec{specCount !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quantity */}
                          <div className="col-span-1 flex justify-center">
                            <div className="flex items-center gap-0.5">
                              <button onClick={() => updateLineItem(event.id, item.id, { quantity: Math.max(0, item.quantity - 1) })}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] transition-colors"
                                style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: '#888' }}>-</button>
                              <input
                                type="text" inputMode="numeric"
                                value={item.quantity}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value);
                                  if (!isNaN(v) && v >= 0) updateLineItem(event.id, item.id, { quantity: v });
                                }}
                                className="w-10 h-6 text-center text-[11px] font-medium rounded-md border outline-none"
                                style={{ borderColor: 'rgba(201,162,74,0.15)', color: '#1A1A1A' }}
                              />
                              <button onClick={() => updateLineItem(event.id, item.id, { quantity: item.quantity + 1 })}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] transition-colors"
                                style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}>+</button>
                            </div>
                          </div>

                          {/* Unit Cost */}
                          <div className="col-span-1 flex justify-end">
                            <InlineEdit value={item.unitCost} onChange={(v) => updateLineItem(event.id, item.id, { unitCost: v })} width="w-16" />
                          </div>

                          {/* Markup */}
                          <div className="col-span-1 flex justify-end">
                            <InlineEdit value={item.markupPercent} onChange={(v) => updateLineItem(event.id, item.id, { markupPercent: v })} suffix="%" width="w-12" />
                          </div>

                          {/* Supplier Total */}
                          <div className="col-span-2 text-right">
                            <span className="text-xs text-gray-500">{fmt(calc.totalSupplierCost)}</span>
                          </div>

                          {/* Client Price */}
                          <div className="col-span-2 text-right">
                            <span className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>{fmt(calc.clientPrice)}</span>
                            <span className="block text-[9px] font-medium" style={{ color: calc.marginPercent < 25 ? '#EF4444' : '#22C55E' }}>
                              {calc.marginPercent.toFixed(0)}% margin
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="col-span-2 flex items-center justify-end gap-1">
                            {/* Hire My Supplier - Primary Action */}
                            <button
                              onClick={() => onHireSupplier(item.id)}
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider transition-all hover:shadow-sm"
                              style={{
                                backgroundColor: isHired ? 'rgba(34,197,94,0.08)' : hasAssignment ? 'rgba(59,130,246,0.08)' : 'rgba(201,162,74,0.08)',
                                color: isHired ? '#22C55E' : hasAssignment ? '#3B82F6' : GOLD,
                                border: `1px solid ${isHired ? 'rgba(34,197,94,0.2)' : hasAssignment ? 'rgba(59,130,246,0.2)' : 'rgba(201,162,74,0.2)'}`,
                              }}
                              title={hasAssignment ? `Assigned to ${pendingAssignment.supplierName} — click to change` : 'Hire My Supplier — Assign supplier'}
                            >
                              {isHired ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : hasAssignment ? (
                                <Users className="w-3 h-3" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              <span className="hidden xl:inline">
                                {isHired ? 'Sent' : hasAssignment ? 'Assigned' : 'Hire'}
                              </span>
                            </button>

                            {/* More Menu */}
                            <div className="relative">
                              <button
                                onClick={(e) => { e.stopPropagation(); setShowItemMenu(isMenuOpen ? null : item.id); }}
                                className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
                              </button>

                              {isMenuOpen && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setShowItemMenu(null)} />
                                  <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-xl border py-1.5 min-w-[160px]"
                                    style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
                                    <button onClick={() => { setSpecEditorItem(item); setShowItemMenu(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-left hover:bg-gray-50 transition-colors">
                                      <MapPin className="w-3 h-3" style={{ color: '#8B5CF6' }} />
                                      <span>Specifications</span>
                                      {specCount > 0 && <span className="ml-auto text-[9px] text-purple-400">{specCount}</span>}
                                    </button>
                                    <button onClick={() => toggleAdvanced(item.id)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-left hover:bg-gray-50 transition-colors">
                                      <Settings2 className="w-3 h-3" style={{ color: GOLD }} />
                                      <span>Logistics & Image</span>
                                    </button>
                                    <button onClick={() => handleDuplicateItem(item)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-left hover:bg-gray-50 transition-colors">
                                      <Copy className="w-3 h-3 text-blue-500" />
                                      <span>Duplicate Item</span>
                                    </button>
                                    <div className="h-px mx-2 my-1" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
                                    <button onClick={() => { removeLineItem(event.id, item.id); setShowItemMenu(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-left hover:bg-red-50 transition-colors text-red-400">
                                      <Trash2 className="w-3 h-3" />
                                      <span>Remove Item</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>


                        {/* Advanced / Logistics Panel */}
                        {isAdv && (
                          <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.03)', backgroundColor: 'rgba(201,162,74,0.015)' }}>
                            {/* Logistics */}
                            <div className="flex items-center gap-2 mb-3">
                              <Truck className="w-3 h-3" style={{ color: GOLD }} />
                              <span className="text-[9px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>Logistics & Delivery</span>
                              <div className="h-px flex-1" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />
                            </div>

                            <div className="flex flex-wrap gap-4 items-end">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Delivery</label>
                                <InlineEdit value={item.deliveryCost} onChange={(v) => updateLineItem(event.id, item.id, { deliveryCost: v })} prefix="R" width="w-20" />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Setup</label>
                                <InlineEdit value={item.setupCost} onChange={(v) => updateLineItem(event.id, item.id, { setupCost: v })} prefix="R" width="w-20" />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Strike</label>
                                <InlineEdit value={item.breakdownCost} onChange={(v) => updateLineItem(event.id, item.id, { breakdownCost: v })} prefix="R" width="w-20" />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">
                                  <Clock className="w-2.5 h-2.5 inline mr-0.5" />Time Type
                                </label>
                                <div className="flex gap-0.5">
                                  {(Object.keys(TIME_LABELS) as TimeType[]).map((tt) => (
                                    <button key={tt} onClick={() => updateLineItem(event.id, item.id, { timeType: tt })}
                                      className="px-2 py-1.5 rounded-lg text-[9px] font-medium transition-all border"
                                      style={{
                                        backgroundColor: itemTimeType === tt ? GOLD : '#FFF',
                                        color: itemTimeType === tt ? '#FFF' : '#999',
                                        borderColor: itemTimeType === tt ? GOLD : 'rgba(201,162,74,0.15)',
                                      }}>
                                      {TIME_LABELS[tt]}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="min-w-[140px]">
                                <label className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Assign to Moment</label>
                                <div className="relative">
                                  <select value={item.momentId || ''} onChange={(e) => updateLineItem(event.id, item.id, { momentId: e.target.value })}
                                    className="w-full h-7 text-xs rounded-lg border px-2 outline-none appearance-none bg-white pr-6"
                                    style={{ borderColor: 'rgba(201,162,74,0.15)', color: item.momentId ? '#1A1A1A' : '#999' }}>
                                    <option value="">Overall Event</option>
                                    {moments.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                  </select>
                                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-[150px]">
                                <label className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Notes</label>
                                <input type="text" value={item.notes} onChange={(e) => updateLineItem(event.id, item.id, { notes: e.target.value })}
                                  placeholder="Add notes..." className="w-full h-7 text-xs rounded-lg border px-2 outline-none"
                                  style={{ borderColor: 'rgba(201,162,74,0.15)', color: '#1A1A1A' }} />
                              </div>
                            </div>

                            {/* Auto Quantity Toggle */}
                            <div className="flex items-center gap-2 mt-4 mb-3">
                              <Users className="w-3 h-3" style={{ color: '#3B82F6' }} />
                              <span className="text-[9px] font-semibold uppercase tracking-[0.15em]" style={{ color: '#3B82F6' }}>Auto Quantity</span>
                              <div className="h-px flex-1" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }} />
                            </div>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <button
                                  onClick={() => updateLineItem(event.id, item.id, {
                                    isGuestDependent: !item.isGuestDependent,
                                    guestRatio: !item.isGuestDependent ? (item.quantity / Math.max(1, event.guestCount)) : 0,
                                  })}
                                  className="w-8 h-4.5 rounded-full transition-colors relative"
                                  style={{ backgroundColor: item.isGuestDependent ? '#3B82F6' : '#E5E7EB', height: '18px' }}
                                >
                                  <div className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform"
                                    style={{ left: item.isGuestDependent ? '16px' : '2px' }} />
                                </button>
                                <span className="text-[10px] text-gray-500">Scale with guest count</span>
                              </label>
                              {item.isGuestDependent && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-gray-400">Ratio:</span>
                                  <InlineEdit value={item.guestRatio} onChange={(v) => updateLineItem(event.id, item.id, { guestRatio: v })} width="w-14" />
                                  <span className="text-[10px] text-gray-400">per guest</span>
                                  <span className="text-[10px] text-blue-400 ml-2">
                                    = {Math.max(1, Math.ceil(event.guestCount * item.guestRatio))} for {event.guestCount} guests
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Product Image */}
                            <div className="flex items-center gap-2 mt-4 mb-3">
                              <ImageIcon className="w-3 h-3" style={{ color: GOLD }} />
                              <span className="text-[9px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>Product Image</span>
                              <div className="h-px flex-1" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />
                            </div>
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                {item.imageUrl ? (
                                  <div className="relative group">
                                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover"
                                      style={{ border: '1px solid rgba(201,162,74,0.2)' }}
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    <button onClick={() => updateLineItem(event.id, item.id, { imageUrl: '' })}
                                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 rounded-lg flex flex-col items-center justify-center"
                                    style={{ backgroundColor: 'rgba(201,162,74,0.03)', border: '1.5px dashed rgba(201,162,74,0.15)' }}>
                                    <ImageIcon className="w-4 h-4" style={{ color: 'rgba(201,162,74,0.2)' }} />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <input ref={(el) => { fileInputRefs.current[item.id] = el; }} type="file" accept="image/*" className="hidden"
                                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(item.id, file); e.target.value = ''; }} />
                                  <button onClick={() => fileInputRefs.current[item.id]?.click()} disabled={uploading[item.id]}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all hover:shadow-sm disabled:opacity-50"
                                    style={{ borderColor: 'rgba(201,162,74,0.2)', color: GOLD }}>
                                    {uploading[item.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                    {uploading[item.id] ? 'Uploading...' : 'Upload'}
                                  </button>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Link2 className="w-3 h-3 text-gray-300 flex-shrink-0" />
                                  <input type="text" value={imageUrlInput[item.id] || ''} onChange={(e) => setImageUrlInput(p => ({ ...p, [item.id]: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSetImageUrl(item.id); }}
                                    placeholder="Paste image URL..." className="flex-1 h-6 text-[10px] rounded-lg border px-2 outline-none"
                                    style={{ borderColor: 'rgba(201,162,74,0.15)', color: '#1A1A1A' }} />
                                  <button onClick={() => handleSetImageUrl(item.id)} className="px-2 h-6 rounded-lg text-[10px] font-medium"
                                    style={{ backgroundColor: GOLD, color: '#FFF' }}>Set</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Item */}
                  <div className="px-4 py-2.5">
                    {addingTo === cat ? (
                      <div className="flex items-center gap-2">
                        <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(cat); if (e.key === 'Escape') setAddingTo(null); }}
                          placeholder="Item name..." className="flex-1 h-7 text-xs rounded-lg border px-2.5 outline-none"
                          style={{ borderColor: GOLD, color: '#1A1A1A' }} autoFocus />
                        <button onClick={() => handleAddItem(cat)} className="px-3 h-7 rounded-lg text-xs font-medium"
                          style={{ backgroundColor: GOLD, color: '#FFF' }}>Add</button>
                        <button onClick={() => { setAddingTo(null); setNewItemName(''); }}
                          className="px-2 h-7 rounded-lg text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setAddingTo(cat)}
                        className="flex items-center gap-1.5 text-[11px] font-medium transition-colors hover:opacity-70" style={{ color: GOLD }}>
                        <Plus className="w-3.5 h-3.5" /> Add item to {CATEGORY_LABELS[cat]}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add New Category */}
        <div className="rounded-xl border border-dashed p-3" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
          {showAddCategory ? (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    if (e.target.value) {
                      setAddingTo(e.target.value as ItemCategory);
                      setShowAddCategory(false);
                      setNewCategoryName('');
                    }
                  }}
                  className="w-full h-8 text-xs rounded-lg border px-2.5 outline-none appearance-none bg-white pr-7"
                  style={{ borderColor: GOLD, color: '#1A1A1A' }}
                  autoFocus
                >
                  <option value="">Select a category...</option>
                  {CATEGORY_ORDER.filter(cat => !grouped[cat]).map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
              <button onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }}
                className="px-2 h-8 rounded-lg text-xs text-gray-400 hover:text-gray-600">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowAddCategory(true)}
              className="w-full flex items-center justify-center gap-2 py-1 text-[11px] font-medium transition-colors hover:opacity-70" style={{ color: GOLD }}>
              <Plus className="w-3.5 h-3.5" /> Add Category
            </button>
          )}
        </div>
      </div>

      {/* Spec Editor Modal */}
      {specEditorItem && (
        <LineItemSpecEditor
          event={event}
          lineItem={specEditorItem}
          onClose={() => setSpecEditorItem(null)}
        />
      )}
    </>
  );
};

export default CostingTable;
