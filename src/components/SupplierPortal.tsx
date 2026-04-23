import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Search, Save, Send, CheckCircle2, Clock, AlertCircle, Package, FileText,
  Upload, X, Paperclip, Shield, ArrowRight, Info, Loader2
} from 'lucide-react';
import {
  PlannerEvent, RFQBatch, RFQBatchItem, SupplierQuoteVersionItem,
  RFQ_BATCH_STATUS_LABELS, RFQ_BATCH_STATUS_COLORS, EventMoment, VenueSpace,
} from '@/contexts/EventContext';
import {
  findEventForToken, getItemsForBatch,
  saveQuoteVersion, getLatestDraft, getLatestSubmitted,
  applySupplierPricingToEvent,
  getDocumentsForBatch, addDocumentToBatch, removeDocumentFromBatch,
  SupplierDocument,
} from '@/data/rfqStore';
import { getCurrencySymbol, formatCurrency, calculateVatBreakdown } from '@/data/countryConfig';
import { supabase } from '@/lib/supabase';
import SupplierPortalMomentSection, { ItemPriceEntry } from './SupplierPortalMomentSection';

const GOLD = '#C9A24A';

const SupplierPortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [event, setEvent] = useState<PlannerEvent | null>(null);
  const [batch, setBatch] = useState<RFQBatch | null>(null);
  const [batchItems, setBatchItems] = useState<RFQBatchItem[]>([]);
  const [prices, setPrices] = useState<Record<string, ItemPriceEntry>>({});
  const [supplierNotes, setSupplierNotes] = useState('');
  const [search, setSearch] = useState('');
  const [filterMoment, setFilterMoment] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMissing, setFilterMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<SupplierDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const dirtyRef = useRef(false);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data
  useEffect(() => {
    if (!token) return;
    const result = findEventForToken(token);
    if (result.event && result.batch) {
      setEvent(result.event);
      setBatch(result.batch);
      const items = getItemsForBatch(result.batch.id);
      setBatchItems(items);
      setDocuments(getDocumentsForBatch(result.batch.id));

      // Load latest draft or submitted prices
      const latestDraft = getLatestDraft(result.batch.id);
      const latestSubmitted = getLatestSubmitted(result.batch.id);
      const source = latestDraft || latestSubmitted;

      const initPrices: Record<string, ItemPriceEntry> = {};
      items.forEach(bi => {
        const existing = source?.items.find(qi => qi.rfqBatchItemId === bi.id);
        initPrices[bi.id] = {
          rfqBatchItemId: bi.id,
          unitPrice: existing?.supplierUnitPriceInput || 0,
          includesVat: existing?.supplierPriceIncludesVat ?? (result.event?.defaultPricesIncludeVat ?? true),
          availabilityNotes: existing?.availabilityNotes || '',
          leadTimeDays: existing?.leadTimeDays || 0,
        };
      });
      setPrices(initPrices);
      if (source?.supplierNotes) setSupplierNotes(source.supplierNotes);
    }
  }, [token]);

  // Auto-save every 30 seconds
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      if (dirtyRef.current && batch && event) {
        handleSaveDraft(true);
      }
    }, 30000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [batch, event, prices, supplierNotes]);

  const buildQuoteItems = useCallback((): SupplierQuoteVersionItem[] => {
    if (!event) return [];
    return batchItems.map(bi => {
      const p = prices[bi.id];
      return {
        rfqBatchItemId: bi.id,
        supplierUnitPriceInput: p?.unitPrice || 0,
        supplierPriceIncludesVat: p?.includesVat ?? event.defaultPricesIncludeVat,
        vatRateUsed: event.vatRate,
        currency: event.currency,
        leadTimeDays: p?.leadTimeDays || 0,
        availabilityNotes: p?.availabilityNotes || '',
      };
    });
  }, [batchItems, prices, event]);

  const handleSaveDraft = useCallback((isAuto = false) => {
    if (!batch || !event) return;
    setSaving(true);
    const items = buildQuoteItems();
    saveQuoteVersion(batch.id, 'DRAFT_SAVE', items, supplierNotes, event.vatRate, event.defaultPricesIncludeVat);
    dirtyRef.current = false;
    setLastSaved(new Date().toLocaleTimeString());
    setTimeout(() => setSaving(false), 300);
  }, [batch, event, buildQuoteItems, supplierNotes]);

  const handleSubmit = useCallback(() => {
    if (!batch || !event) return;
    setSubmitting(true);
    const items = buildQuoteItems();
    const qv = saveQuoteVersion(batch.id, 'SUBMITTED', items, supplierNotes, event.vatRate, event.defaultPricesIncludeVat);

    // Auto-map supplier pricing back to event line items
    if (qv) {
      applySupplierPricingToEvent(batch.id, qv.id);
    }

    dirtyRef.current = false;
    setSubmitted(true);
    setShowConfirmSubmit(false);

    // Reload batch to get updated status
    const result = findEventForToken(token || '');
    if (result.batch) setBatch(result.batch);

    setTimeout(() => setSubmitting(false), 500);
  }, [batch, event, buildQuoteItems, supplierNotes, token]);

  const updatePrice = (biId: string, unitPrice: number) => {
    setPrices(p => ({ ...p, [biId]: { ...p[biId], unitPrice } }));
    dirtyRef.current = true;
  };

  const toggleVat = (biId: string) => {
    setPrices(p => ({ ...p, [biId]: { ...p[biId], includesVat: !p[biId].includesVat } }));
    dirtyRef.current = true;
  };

  const updateAvailability = (biId: string, notes: string) => {
    setPrices(p => ({ ...p, [biId]: { ...p[biId], availabilityNotes: notes } }));
    dirtyRef.current = true;
  };

  const updateLeadTime = (biId: string, days: number) => {
    setPrices(p => ({ ...p, [biId]: { ...p[biId], leadTimeDays: days } }));
    dirtyRef.current = true;
  };

  const toggleItemExpand = (biId: string) => {
    setExpandedItemId(prev => prev === biId ? null : biId);
  };

  // Document upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !batch) return;
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `rfq-${batch.id}/${Date.now()}-${Math.random().toString(36).substr(2, 6)}.${fileExt}`;

      try {
        const { data, error } = await supabase.storage
          .from('supplier-media')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('supplier-media')
          .getPublicUrl(fileName);

        const doc: SupplierDocument = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          rfqBatchId: batch.id,
          fileName: file.name,
          fileUrl: urlData.publicUrl,
          fileSize: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
        };

        addDocumentToBatch(doc);
        setDocuments(prev => [...prev, doc]);
      } catch (err) {
        console.error('Upload failed:', err);
        // Fallback: store as local reference
        const doc: SupplierDocument = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          rfqBatchId: batch.id,
          fileName: file.name,
          fileUrl: URL.createObjectURL(file),
          fileSize: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
        };
        addDocumentToBatch(doc);
        setDocuments(prev => [...prev, doc]);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveDocument = (docId: string) => {
    removeDocumentFromBatch(docId);
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  // Grouping + filtering
  const moments = useMemo(() => event?.moments || [], [event]);
  const spaces = useMemo(() => event?.venueSpaces || [], [event]);
  const categories = useMemo(() => {
    const cats = new Set(batchItems.map(bi => bi.categorySnapshot));
    return Array.from(cats).sort();
  }, [batchItems]);

  const filteredItems = useMemo(() => {
    return batchItems.filter(bi => {
      if (search && !bi.itemNameSnapshot.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory && bi.categorySnapshot !== filterCategory) return false;
      if (filterMoment) {
        const momentName = moments.find(m => m.id === bi.momentIdSnapshot)?.name || 'General Items';
        if (momentName !== filterMoment && !(filterMoment === 'General Items' && !bi.momentIdSnapshot)) return false;
      }
      if (filterMissing && (prices[bi.id]?.unitPrice || 0) > 0) return false;
      return true;
    });
  }, [batchItems, search, filterCategory, filterMoment, filterMissing, prices, moments]);

  // Group by Moment > Category
  const grouped = useMemo(() => {
    const groups: Record<string, { moment?: EventMoment; space?: VenueSpace; categoryGroups: Record<string, RFQBatchItem[]> }> = {};
    filteredItems.forEach(bi => {
      const moment = moments.find(m => m.id === bi.momentIdSnapshot);
      const momentKey = moment?.name || 'General Items';
      const space = spaces.find(s => s.id === bi.spaceIdSnapshot);
      if (!groups[momentKey]) groups[momentKey] = { moment, space, categoryGroups: {} };
      const catKey = bi.categorySnapshot || 'Other';
      if (!groups[momentKey].categoryGroups[catKey]) groups[momentKey].categoryGroups[catKey] = [];
      groups[momentKey].categoryGroups[catKey].push(bi);
    });
    return groups;
  }, [filteredItems, moments, spaces]);

  const currSym = getCurrencySymbol(event?.currency || 'ZAR');
  const fmt = (n: number) => formatCurrency(n, currSym);

  // Totals
  const totals = useMemo(() => {
    let net = 0, vat = 0, gross = 0;
    batchItems.forEach(bi => {
      const p = prices[bi.id];
      if (!p || p.unitPrice <= 0) return;
      const total = bi.qtySnapshot * p.unitPrice;
      const breakdown = calculateVatBreakdown(total, p.includesVat, event?.vatRate || 0);
      net += breakdown.supplierNet;
      vat += breakdown.vatValue;
      gross += breakdown.supplierGross;
    });
    return { net, vat, gross };
  }, [batchItems, prices, event]);

  const pricedCount = batchItems.filter(bi => (prices[bi.id]?.unitPrice || 0) > 0).length;
  const progressPercent = batchItems.length > 0 ? Math.round((pricedCount / batchItems.length) * 100) : 0;
  const isLocked = batch && ['ACCEPTED', 'LOCKED', 'CANCELLED'].includes(batch.status);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // ─── Invalid Token State ─────────────────────────────────────────────────────
  if (!event || !batch) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F4F0' }}>
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}>
            <Shield className="w-7 h-7" style={{ color: GOLD }} />
          </div>
          <h1 className="text-xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>Supplier Quote Portal</h1>
          <p className="text-sm text-gray-500 mb-6">This link is invalid, expired, or the RFQ has been removed.</p>
          <div className="p-4 rounded-xl bg-white border" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
            <p className="text-xs text-gray-400">If you believe this is an error, please contact the event coordinator who sent you the RFQ email.</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Portal ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F4F0' }}>
      {/* ─── Sticky Header ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}>
                <Package className="w-4 h-4" style={{ color: GOLD }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold" style={{ color: '#1A1A1A' }}>
                    Quote Request — {event.jobCode || 'RFQ'}
                  </h1>
                  <span
                    className="text-[9px] font-semibold px-2.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: RFQ_BATCH_STATUS_COLORS[batch.status] }}
                  >
                    {RFQ_BATCH_STATUS_LABELS[batch.status]}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-400">
                  {event.city && <span>{event.city}{event.country ? `, ${event.country}` : ''}</span>}
                  <span className="flex items-center gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    {event.currency}
                  </span>
                  {event.vatRate > 0 && (
                    <span className="flex items-center gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      {event.vatName} {(event.vatRate * 100).toFixed(1)}%
                    </span>
                  )}
                  <span className="flex items-center gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    Prices: {event.defaultPricesIncludeVat ? `incl. ${event.vatName}` : `excl. ${event.vatName}`}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1 mr-1">
                  <Clock className="w-3 h-3" /> Saved {lastSaved}
                </span>
              )}
              {!isLocked && (
                <>
                  <button
                    onClick={() => handleSaveDraft()}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold rounded-lg border transition-all hover:shadow-sm"
                    style={{ borderColor: 'rgba(201,162,74,0.3)', color: GOLD }}
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {saving ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    onClick={() => setShowConfirmSubmit(true)}
                    disabled={submitting || pricedCount === 0}
                    className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold text-white rounded-lg disabled:opacity-40 transition-all hover:shadow-md"
                    style={{ backgroundColor: '#22C55E' }}
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Submit Quote
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400">Pricing Progress</span>
              <span className="text-[10px] font-semibold" style={{ color: progressPercent === 100 ? '#22C55E' : GOLD }}>
                {pricedCount} of {batchItems.length} items priced ({progressPercent}%)
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: progressPercent === 100 ? '#22C55E' : GOLD,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* ─── Status Banners ──────────────────────────────────────────────── */}
        {isLocked && (
          <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <span className="text-sm text-green-700 font-semibold block">Quote {batch.status.toLowerCase()}</span>
              <span className="text-xs text-green-600">Your pricing has been locked. No further changes can be made.</span>
            </div>
          </div>
        )}

        {submitted && !isLocked && (
          <div className="mb-4 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <span className="text-sm text-blue-700 font-semibold block">
                Quote submitted successfully (v{batch.currentSubmittedVersion})
              </span>
              <span className="text-xs text-blue-600">
                Your pricing has been automatically applied to the event costing. You can still update and resubmit.
              </span>
            </div>
          </div>
        )}

        {batch.messageToSupplier && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Message from Coordinator</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">{batch.messageToSupplier}</p>
          </div>
        )}

        {/* ─── Summary Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
            <span className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Items Priced</span>
            <span className="text-xl font-bold" style={{ color: '#1A1A1A' }}>{pricedCount}<span className="text-sm text-gray-400 font-normal">/{batchItems.length}</span></span>
          </div>
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
            <span className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Net Total</span>
            <span className="text-xl font-bold" style={{ color: '#1A1A1A' }}>{fmt(totals.net)}</span>
          </div>
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
            <span className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">{event.vatName}</span>
            <span className="text-xl font-bold" style={{ color: '#1A1A1A' }}>{fmt(totals.vat)}</span>
          </div>
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
            <span className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Gross Total</span>
            <span className="text-xl font-bold" style={{ color: GOLD }}>{fmt(totals.gross)}</span>
          </div>
        </div>

        {/* ─── Filters ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-9 pr-3 py-2.5 text-xs border rounded-lg bg-white focus:outline-none focus:ring-1"
              style={{ borderColor: 'rgba(201,162,74,0.2)' }}
              onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 1px ${GOLD}40`; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(201,162,74,0.2)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <select
            value={filterMoment}
            onChange={e => setFilterMoment(e.target.value)}
            className="px-3 py-2.5 text-xs border rounded-lg bg-white cursor-pointer"
            style={{ borderColor: 'rgba(201,162,74,0.2)' }}
          >
            <option value="">All Moments</option>
            <option value="General Items">General Items</option>
            {moments.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2.5 text-xs border rounded-lg bg-white cursor-pointer"
            style={{ borderColor: 'rgba(201,162,74,0.2)' }}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-[10px] text-gray-500 cursor-pointer px-3 py-2.5 rounded-lg border bg-white" style={{ borderColor: filterMissing ? GOLD : 'rgba(201,162,74,0.2)' }}>
            <input type="checkbox" checked={filterMissing} onChange={e => setFilterMissing(e.target.checked)} className="rounded" style={{ accentColor: GOLD }} />
            Missing prices only
          </label>
        </div>

        {/* ─── Moment Sections ────────────────────────────────────────────── */}
        <div className="space-y-4">
          {Object.entries(grouped).map(([momentKey, { moment, space, categoryGroups }]) => (
            <SupplierPortalMomentSection
              key={momentKey}
              momentKey={momentKey}
              moment={moment}
              space={space}
              categoryGroups={categoryGroups}
              prices={prices}
              onUpdatePrice={updatePrice}
              onToggleVat={toggleVat}
              onUpdateAvailability={updateAvailability}
              onUpdateLeadTime={updateLeadTime}
              currencySymbol={currSym}
              vatName={event.vatName}
              vatRate={event.vatRate}
              defaultIncVat={event.defaultPricesIncludeVat}
              isLocked={!!isLocked}
              expandedItemId={expandedItemId}
              onToggleItemExpand={toggleItemExpand}
            />
          ))}

          {Object.keys(grouped).length === 0 && (
            <div className="bg-white rounded-xl border p-8 text-center" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
              <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">No items match your filters.</p>
              <button onClick={() => { setSearch(''); setFilterMoment(''); setFilterCategory(''); setFilterMissing(false); }} className="text-xs mt-2" style={{ color: GOLD }}>
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* ─── Supplier Notes ─────────────────────────────────────────────── */}
        <div className="mt-6 bg-white rounded-xl border p-5" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
          <label className="text-[10px] font-bold uppercase tracking-[0.12em] block mb-2" style={{ color: GOLD }}>
            Supplier Notes & Conditions
          </label>
          <textarea
            value={supplierNotes}
            onChange={e => { setSupplierNotes(e.target.value); dirtyRef.current = true; }}
            disabled={!!isLocked}
            rows={4}
            placeholder="Add any notes, lead times, payment terms, special conditions, or alternative suggestions..."
            className="w-full px-4 py-3 text-xs border rounded-lg resize-none disabled:bg-gray-100 focus:outline-none focus:ring-1 leading-relaxed"
            style={{ borderColor: 'rgba(201,162,74,0.2)' }}
            onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 1px ${GOLD}40`; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(201,162,74,0.2)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* ─── Document Upload ─────────────────────────────────────────────── */}
        <div className="mt-4 bg-white rounded-xl border p-5" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
              Supporting Documents
            </label>
            <span className="text-[9px] text-gray-400">{documents.length} file{documents.length !== 1 ? 's' : ''} attached</span>
          </div>

          {/* Upload area */}
          {!isLocked && (
            <div
              className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors hover:border-amber-300 hover:bg-amber-50/30 mb-3"
              style={{ borderColor: 'rgba(201,162,74,0.25)' }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.backgroundColor = 'rgba(201,162,74,0.05)'; }}
              onDragLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,162,74,0.25)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(201,162,74,0.25)'; e.currentTarget.style.backgroundColor = 'transparent'; handleFileUpload(e.dataTransfer.files); }}
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: GOLD }} />
                  <span className="text-xs text-gray-500">Uploading...</span>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 mx-auto mb-2" style={{ color: 'rgba(201,162,74,0.5)' }} />
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold" style={{ color: GOLD }}>Click to upload</span> or drag and drop
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">PDF, images, spreadsheets — up to 10MB per file</p>
                </>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif"
            className="hidden"
            onChange={e => handleFileUpload(e.target.files)}
          />

          {/* Document list */}
          {documents.length > 0 && (
            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border" style={{ borderColor: 'rgba(201,162,74,0.1)', backgroundColor: '#FAFAF7' }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}>
                      {doc.mimeType.includes('pdf') ? (
                        <FileText className="w-4 h-4" style={{ color: GOLD }} />
                      ) : doc.mimeType.includes('image') ? (
                        <Paperclip className="w-4 h-4" style={{ color: GOLD }} />
                      ) : (
                        <FileText className="w-4 h-4" style={{ color: GOLD }} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium truncate block hover:underline" style={{ color: '#1A1A1A' }}>
                        {doc.fileName}
                      </a>
                      <span className="text-[9px] text-gray-400">{formatFileSize(doc.fileSize)}</span>
                    </div>
                  </div>
                  {!isLocked && (
                    <button onClick={() => handleRemoveDocument(doc.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Auto-mapping Notice ────────────────────────────────────────── */}
        <div className="mt-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100">
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-blue-700 block">Automatic Price Mapping</span>
            <p className="text-[10px] text-blue-600 mt-0.5 leading-relaxed">
              When you submit your quote, your pricing is automatically mapped back to each line item in the event costing using secure reference IDs. 
              The coordinator's event budget updates in real-time — no manual re-entry required.
            </p>
          </div>
        </div>

        {/* ─── Bottom Action Bar ──────────────────────────────────────────── */}
        {!isLocked && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-[10px] text-gray-400">
              {pricedCount}/{batchItems.length} items priced · Auto-saves every 30s
              {dirtyRef.current && <span className="ml-2 text-amber-500">· Unsaved changes</span>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSaveDraft()}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-lg border transition-all hover:shadow-sm"
                style={{ borderColor: 'rgba(201,162,74,0.3)', color: GOLD }}
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Draft
              </button>
              <button
                onClick={() => setShowConfirmSubmit(true)}
                disabled={submitting || pricedCount === 0}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white rounded-lg disabled:opacity-40 transition-all hover:shadow-md"
                style={{ backgroundColor: '#22C55E' }}
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Submit Quote {batch.currentSubmittedVersion > 0 ? `(v${batch.currentSubmittedVersion + 1})` : ''}
              </button>
            </div>
          </div>
        )}

        {/* ─── Footer ─────────────────────────────────────────────────────── */}
        <div className="mt-8 pb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}>
              <Shield className="w-3 h-3" style={{ color: GOLD }} />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: GOLD }}>Secure Supplier Portal</span>
          </div>
          <p className="text-[10px] text-gray-400">
            This is a private, token-secured portal. Your pricing data is confidential and only visible to the event coordinator.
          </p>
        </div>
      </div>

      {/* ─── Submit Confirmation Modal ────────────────────────────────────── */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirmSubmit(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
              <Send className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-center mb-1" style={{ color: '#1A1A1A' }}>Submit Your Quote?</h3>
            <p className="text-xs text-gray-500 text-center mb-5">
              {batch.currentSubmittedVersion > 0
                ? `This will submit version ${batch.currentSubmittedVersion + 1} of your quote, replacing the previous submission.`
                : 'Your pricing will be sent to the event coordinator and automatically applied to the event costing.'
              }
            </p>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 block">Items</span>
                  <span className="text-sm font-bold" style={{ color: '#1A1A1A' }}>{pricedCount}/{batchItems.length}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 block">Net</span>
                  <span className="text-sm font-bold" style={{ color: '#1A1A1A' }}>{fmt(totals.net)}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 block">Gross</span>
                  <span className="text-sm font-bold" style={{ color: GOLD }}>{fmt(totals.gross)}</span>
                </div>
              </div>
              {pricedCount < batchItems.length && (
                <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-amber-50 border border-amber-100">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span className="text-[10px] text-amber-700">
                    {batchItems.length - pricedCount} item{batchItems.length - pricedCount !== 1 ? 's' : ''} still missing pricing. You can submit now and update later.
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 px-4 py-2.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white rounded-lg transition-all hover:shadow-md"
                style={{ backgroundColor: '#22C55E' }}
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {submitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierPortal;
