import React, { useState, useMemo } from 'react';

import {
  Save, FileText, Send, Inbox, History, CheckCircle2, ShoppingCart, Receipt,
  Layers, Shield, Package, BookTemplate, Clock, User, Image, BarChart3,
  Eye, EyeOff, Globe, ChevronDown, Loader2, Mail, AlertCircle, Hash,
  Users, Plus, GitCompare,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { seedDemoAlerts } from '@/data/priceAlertStore';


import {
  useEventContext,
  getEventDisplayName,
  SupplierAssignment,
  EVENT_TYPE_LABELS,
} from '@/contexts/EventContext';
import { getCountryByCode } from '@/data/countries';
import { getCurrencySymbol, CURRENCY_OPTIONS, COUNTRY_FINANCE_CONFIGS } from '@/data/countryConfig';
import { getBatchesForEvent, getLatestSubmitted } from '@/data/rfqStore';


import CoordinatorHeader from './CoordinatorHeader';
import EventDetailsCard from './EventDetailsCard';
import MomentsScheduleBuilder from './MomentsScheduleBuilder';

import CostingSummary from './CostingSummary';
import VersionHistory from './VersionHistory';
import TaskManager from './TaskManager';
import ShoppingListManager from './ShoppingListManager';
import SalesOrderView from './SalesOrderView';
import ControlTowerDashboard from './ControlTowerDashboard';
import RFQSourcingPanel from './RFQSourcingPanel';
import SaveAsTemplateModal from './SaveAsTemplateModal';
import ClientProfilePanel from './ClientProfilePanel';
import EventTimeline from './EventTimeline';
import FullCostingView from './FullCostingView';
import SupplierQuoteReview from './SupplierQuoteReview';
import SupplierQuoteComparison from './SupplierQuoteComparison';
import { toast } from '@/components/ui/use-toast';
import { useAppContext } from '@/contexts/AppContext';


const GOLD = '#C9A24A';

type OperationsTab = 'sub-events' | 'timeline' | 'costing' | 'tasks' | 'shopping' | 'orders' | 'control-tower' | 'sourcing' | 'compare';


interface EventDetailProps {
  eventId: string;
  onBack: () => void;
  onGenerateProposal: () => void;
}

const EventDetail: React.FC<EventDetailProps> = ({ eventId, onBack, onGenerateProposal }) => {
  const {
    events,
    calculateSummary,
    saveVersion,
    restoreVersion,
    addRFQMessage,
    selectEvent,
    updateEvent,
  } = useEventContext();
  const { setCurrentView } = useAppContext();


  const event = events.find((e) => e.id === eventId);
  const [activeTab, setActiveTab] = useState<OperationsTab>('sub-events');
  const [showVersions, setShowVersions] = useState(false);
  const [showRFQ, setShowRFQ] = useState(false);
  const [rfqTarget, setRfqTarget] = useState<string | null>(null);
  const [rfqEmail, setRfqEmail] = useState('');
  const [rfqName, setRfqName] = useState('');
  const [versionDesc, setVersionDesc] = useState('');
  const [showSaveVersion, setShowSaveVersion] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showQuoteReview, setShowQuoteReview] = useState(false);

  if (!event) return null;

  const summary = calculateSummary(event.lineItems);
  const countryObj = getCountryByCode(event.country || '');

  const taskCount = (event.tasks || []).length;
  const todoCount = (event.tasks || []).filter(t => t.status !== 'DONE').length;
  const shoppingCount = (event.shoppingLists || []).length;
  const orderCount = (event.salesOrders || []).length;
  const subEventCount = (event.moments || []).length;

  // Count batches with submitted quotes for Compare tab badge
  const quotedBatchCount = useMemo(() => {
    const batches = getBatchesForEvent(event.id);
    return batches.filter(b => ['QUOTED', 'REVISED', 'ACCEPTED'].includes(b.status)).length;
  }, [event.id, event.lineItems]);

  // Count pending supplier assignments (not yet sent as bundled RFQ)
  const pendingAssignments = (event.supplierAssignments || []).filter(a => a.status === 'PENDING');
  const pendingSupplierCount = new Set(pendingAssignments.map(a => `${a.supplierName}|||${a.supplierEmail}`.toLowerCase())).size;


  const handleSaveVersion = () => {
    if (!versionDesc.trim()) return;
    saveVersion(eventId, versionDesc.trim());
    setVersionDesc('');
    setShowSaveVersion(false);
    toast({ title: 'Version Saved', description: `Version ${event.currentVersion + 1} saved.` });
  };

  // "Hire My Supplier" — now assigns supplier to line item instead of sending immediately
  const handleHireSupplier = (lineItemId: string) => {
    setRfqTarget(lineItemId);
    setRfqName('');
    setRfqEmail('');
    setShowRFQ(true);
  };

  // Assign supplier to line item (creates PENDING SupplierAssignment)
  const handleAssignSupplier = () => {
    if (!rfqTarget || !rfqName.trim()) return;

    const now = new Date().toISOString();
    const newAssignment: SupplierAssignment = {
      id: `sa-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      eventId: event.id,
      lineItemId: rfqTarget,
      supplierName: rfqName.trim(),
      supplierEmail: rfqEmail.trim(),
      supplierCompanyId: '',
      status: 'PENDING',
      acceptedQuoteId: '',
      notes: '',
      createdAt: now,
      updatedAt: now,
    };

    // Check if this line item already has a pending assignment
    const existingAssignments = (event.supplierAssignments || []).filter(
      a => a.lineItemId === rfqTarget && a.status === 'PENDING'
    );

    let updatedAssignments: SupplierAssignment[];
    if (existingAssignments.length > 0) {
      // Replace existing pending assignment
      updatedAssignments = (event.supplierAssignments || []).map(a =>
        a.lineItemId === rfqTarget && a.status === 'PENDING'
          ? { ...a, supplierName: rfqName.trim(), supplierEmail: rfqEmail.trim(), updatedAt: now }
          : a
      );
    } else {
      updatedAssignments = [...(event.supplierAssignments || []), newAssignment];
    }

    // Also update the line item's supplierAssignmentId
    const updatedLineItems = event.lineItems.map(li =>
      li.id === rfqTarget ? { ...li, supplierAssignmentId: newAssignment.id } : li
    );

    updateEvent(event.id, {
      supplierAssignments: updatedAssignments,
      lineItems: updatedLineItems,
    });

    const item = event.lineItems.find(i => i.id === rfqTarget);
    toast({
      title: 'Supplier Assigned',
      description: `${rfqName.trim()} assigned to "${item?.name || 'item'}". Review & send from the Quote Requests panel.`,
    });

    setRfqTarget(null);
    setRfqName('');
    setRfqEmail('');
    setShowRFQ(false);
  };


  const handleOpenEvent = (evtId: string) => {
    selectEvent(evtId);
    setCurrentView('coordinator-event');
  };

  const handleTimelineMomentClick = (momentId: string) => {
    setActiveTab('sub-events');
  };

  const tabs: { key: OperationsTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'sub-events', label: 'Moments', icon: <Layers className="w-3.5 h-3.5" />, badge: subEventCount },
    { key: 'timeline', label: 'Timeline', icon: <Clock className="w-3.5 h-3.5" /> },
    { key: 'costing', label: 'Full Costing', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { key: 'sourcing', label: 'Sourcing', icon: <Package className="w-3.5 h-3.5" /> },
    { key: 'compare', label: 'Compare', icon: <GitCompare className="w-3.5 h-3.5" />, badge: quotedBatchCount },
    { key: 'control-tower', label: 'Control Tower', icon: <Shield className="w-3.5 h-3.5" /> },
    { key: 'tasks', label: 'Tasks', icon: <CheckCircle2 className="w-3.5 h-3.5" />, badge: todoCount },
    { key: 'shopping', label: 'Shopping', icon: <ShoppingCart className="w-3.5 h-3.5" />, badge: shoppingCount },
    { key: 'orders', label: 'Orders', icon: <Receipt className="w-3.5 h-3.5" />, badge: orderCount },
  ];


  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F4F0' }}>
      <CoordinatorHeader
        title={getEventDisplayName(event)}
        onBack={onBack}
        backLabel="Events"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Client Profile */}
            <ClientProfilePanel event={event} onOpenEvent={handleOpenEvent} />

            {/* Event Details */}
            <EventDetailsCard event={event} />

            {/* Pending Quote Requests Banner */}
            {pendingAssignments.length > 0 && (
              <div
                className="bg-white rounded-2xl border p-4 flex items-center justify-between cursor-pointer transition-all hover:shadow-md"
                style={{ borderColor: 'rgba(201,162,74,0.3)', backgroundColor: 'rgba(201,162,74,0.02)' }}
                onClick={() => setShowQuoteReview(true)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}>
                    <FileText className="w-5 h-5" style={{ color: GOLD }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
                      {pendingAssignments.length} item{pendingAssignments.length !== 1 ? 's' : ''} ready for quoting
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {pendingSupplierCount} supplier{pendingSupplierCount !== 1 ? 's' : ''} assigned — review and send bundled quote requests
                    </p>
                  </div>
                </div>
                <button
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all hover:shadow-md"
                  style={{ backgroundColor: GOLD, color: '#FFF' }}
                >
                  <Send className="w-3.5 h-3.5" /> Review & Send
                </button>
              </div>
            )}

            {/* Operations Tabs */}
            <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
              {/* Tab Bar */}
              <div className="flex items-center border-b px-1 overflow-x-auto" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex items-center gap-1.5 px-3 py-3.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors relative whitespace-nowrap flex-shrink-0"
                    style={{
                      color: activeTab === tab.key ? GOLD : '#999',
                    }}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        className="ml-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold"
                        style={{
                          backgroundColor: activeTab === tab.key ? 'rgba(201,162,74,0.12)' : 'rgba(0,0,0,0.06)',
                          color: activeTab === tab.key ? GOLD : '#999',
                        }}
                      >
                        {tab.badge}
                      </span>
                    )}
                    {activeTab === tab.key && (
                      <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ backgroundColor: GOLD }} />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'sub-events' && (
                  <MomentsScheduleBuilder
                    event={event}
                    onHireSupplier={handleHireSupplier}
                    onViewFullCosting={() => setActiveTab('costing')}
                  />
                )}
                {activeTab === 'timeline' && (
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
                        <Clock className="w-3.5 h-3.5 inline mr-1.5" /> Event Timeline
                      </h2>
                      <span className="text-[10px] text-gray-400">
                        {subEventCount} moments
                      </span>
                    </div>
                    <EventTimeline event={event} onMomentClick={handleTimelineMomentClick} />
                  </div>
                )}
                {activeTab === 'costing' && (
                  <FullCostingView
                    event={event}
                    onNavigateToMoment={(momentId) => {
                      setActiveTab('sub-events');
                      // The MomentsScheduleBuilder will handle navigation internally
                    }}
                    onGenerateProposal={onGenerateProposal}
                  />
                )}

                {activeTab === 'tasks' && <TaskManager event={event} />}
                {activeTab === 'shopping' && <ShoppingListManager event={event} />}
                {activeTab === 'orders' && <SalesOrderView event={event} />}
                {activeTab === 'sourcing' && <RFQSourcingPanel event={event} />}
                {activeTab === 'compare' && <SupplierQuoteComparison event={event} />}
                {activeTab === 'control-tower' && <ControlTowerDashboard event={event} />}

              </div>
            </div>


            {/* RFQ Inbox */}
            <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
                  <Inbox className="w-3.5 h-3.5 inline mr-1.5" />RFQ Inbox
                </h2>
                <span className="text-[10px] text-gray-400">{(event.rfqMessages || []).length} sent</span>
              </div>
              <div className="h-px mb-4" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />

              {(!event.rfqMessages || event.rfqMessages.length === 0) ? (
                <p className="text-xs text-gray-400 text-center py-6">No RFQs sent yet. Click "Hire" on any line item to assign a supplier, then review and send bundled requests.</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                  {event.rfqMessages.map((msg) => {
                    const item = event.lineItems.find((i) => i.id === msg.lineItemId);
                    return (
                      <div key={msg.id} className="p-3 rounded-xl border" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{msg.supplierName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                            style={{
                              backgroundColor: msg.status === 'sent' ? 'rgba(201,162,74,0.1)' : msg.status === 'replied' ? 'rgba(59,130,246,0.1)' : 'rgba(34,197,94,0.1)',
                              color: msg.status === 'sent' ? GOLD : msg.status === 'replied' ? '#3B82F6' : '#22C55E',
                            }}>
                            {msg.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400">{item?.name} · {msg.jobCode} · {new Date(msg.sentAt).toLocaleDateString()}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 space-y-5 lg:sticky lg:top-24 lg:self-start">
            <CostingSummary summary={summary} itemCount={event.lineItems.length} guestCount={event.guestCount} event={event} />

            <div className="bg-white rounded-2xl border p-5 space-y-3" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
              <button onClick={onGenerateProposal} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all hover:shadow-md" style={{ backgroundColor: GOLD, color: '#FFF' }}>
                <FileText className="w-3.5 h-3.5" /> Generate Proposal
              </button>

              {/* Review & Send Quotes Button */}
              <button
                onClick={() => setShowQuoteReview(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all border hover:shadow-sm relative"
                style={{
                  borderColor: pendingAssignments.length > 0 ? 'rgba(59,130,246,0.3)' : 'rgba(201,162,74,0.2)',
                  color: pendingAssignments.length > 0 ? '#3B82F6' : GOLD,
                  backgroundColor: pendingAssignments.length > 0 ? 'rgba(59,130,246,0.04)' : 'transparent',
                }}
              >
                <Send className="w-3.5 h-3.5" /> Review Quote Requests
                {pendingAssignments.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {pendingAssignments.length}
                  </span>
                )}
              </button>

              <button onClick={() => setShowSaveVersion(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all border" style={{ borderColor: 'rgba(201,162,74,0.2)', color: GOLD }}>
                <Save className="w-3.5 h-3.5" /> Save Version
              </button>
              <button onClick={() => setShowVersions(!showVersions)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs tracking-wider transition-colors hover:bg-black/5" style={{ color: '#999' }}>
                <History className="w-3.5 h-3.5" /> {showVersions ? 'Hide' : 'Show'} History
              </button>
              <div className="h-px" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />
              <button
                onClick={() => setShowTemplateModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all border hover:shadow-sm"
                style={{ borderColor: 'rgba(139,92,246,0.2)', color: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.03)' }}
              >
                <BookTemplate className="w-3.5 h-3.5" /> Save as Template
              </button>
            </div>

            {showSaveVersion && (
              <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1.5">Version Description</label>
                <input type="text" value={versionDesc} onChange={(e) => setVersionDesc(e.target.value)} placeholder="What changed?"
                  className="w-full px-3 py-2 rounded-lg border text-xs outline-none mb-3" style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveVersion(); }} autoFocus />
                <div className="flex gap-2">
                  <button onClick={handleSaveVersion} className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: GOLD, color: '#FFF' }}>Save v{event.currentVersion + 1}</button>
                  <button onClick={() => setShowSaveVersion(false)} className="px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                </div>
              </div>
            )}

            {showVersions && (
              <VersionHistory versions={event.versions} currentVersion={event.currentVersion}
                onRestore={(vId) => { restoreVersion(eventId, vId); toast({ title: 'Version Restored', description: 'Event restored to selected version.' }); }} />
            )}

            {/* Billing & Finance */}
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: GOLD }}>
                <Globe className="w-3 h-3 inline mr-1" /> Billing & Finance
              </h3>
              <div className="space-y-3">
                {/* Event Reference */}
                <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(201,162,74,0.04)', border: '1px solid rgba(201,162,74,0.1)' }}>
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3 h-3" style={{ color: GOLD }} />
                    <span className="text-[10px] uppercase tracking-wider text-gray-400">Event Ref</span>
                  </div>
                  <span className="text-xs font-mono font-bold" style={{ color: '#1A1A1A' }}>{event.jobCode}</span>
                </div>

                {/* Billing Currency */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Billing Currency</label>
                  <div className="relative">
                    <select
                      value={event.billingCurrency || event.currency || 'ZAR'}
                      onChange={(e) => updateEvent(eventId, { billingCurrency: e.target.value, currency: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none appearance-none bg-white pr-7"
                      style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
                    >
                      {CURRENCY_OPTIONS.map(c => (
                        <option key={c.iso} value={c.iso}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Billing Country */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Billing Country</label>
                  <div className="relative">
                    <select
                      value={event.billingCountry || event.country || 'ZA'}
                      onChange={(e) => {
                        const cfg = COUNTRY_FINANCE_CONFIGS.find(c => c.countryIso === e.target.value);
                        updateEvent(eventId, {
                          billingCountry: e.target.value,
                          ...(cfg ? {
                            billingCurrency: cfg.currencyIso,
                            currency: cfg.currencyIso,
                            vatRate: cfg.vatRate,
                            vatName: cfg.vatName,
                            vatEnabled: cfg.vatRate > 0,
                          } : {}),
                        });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none appearance-none bg-white pr-7"
                      style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
                    >
                      {COUNTRY_FINANCE_CONFIGS.map(c => (
                        <option key={c.countryIso} value={c.countryIso}>{c.countryName}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* VAT Toggle */}
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
                  <div>
                    <span className="text-xs text-gray-600">{event.vatName || 'VAT'}</span>
                    {event.vatRate > 0 && (
                      <span className="text-[10px] text-gray-400 ml-1">({(event.vatRate * 100).toFixed(1)}%)</span>
                    )}
                  </div>
                  <button
                    onClick={() => updateEvent(eventId, { vatEnabled: !(event.vatEnabled !== false) })}
                    className="relative w-9 h-5 rounded-full transition-colors"
                    style={{ backgroundColor: (event.vatEnabled !== false && event.vatRate > 0) ? '#22C55E' : '#E5E7EB' }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                      style={{ left: (event.vatEnabled !== false && event.vatRate > 0) ? '18px' : '2px' }}
                    />
                  </button>
                </div>

                {/* Pricing Visibility */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Show Pricing</span>
                  <button
                    onClick={() => updateEvent(eventId, { showPricing: !(event.showPricing !== false) })}
                    className="relative w-9 h-5 rounded-full transition-colors"
                    style={{ backgroundColor: (event.showPricing !== false) ? GOLD : '#E5E7EB' }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                      style={{ left: (event.showPricing !== false) ? '18px' : '2px' }}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: GOLD }}>Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1"><Layers className="w-3 h-3" /> Moments</span>
                  <span style={{ color: '#1A1A1A' }}>{subEventCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1"><Package className="w-3 h-3" /> Pending Quotes</span>
                  <span style={{ color: pendingAssignments.length > 0 ? '#3B82F6' : '#1A1A1A' }}>
                    {pendingAssignments.length} item{pendingAssignments.length !== 1 ? 's' : ''} / {pendingSupplierCount} supplier{pendingSupplierCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Tasks</span>
                  <span style={{ color: '#1A1A1A' }}>{todoCount} pending / {taskCount} total</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> Shopping Lists</span>
                  <span style={{ color: '#1A1A1A' }}>{shoppingCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1"><Receipt className="w-3 h-3" /> Sales Orders</span>
                  <span style={{ color: '#1A1A1A' }}>{orderCount}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Hire My Supplier Modal — Now assigns supplier to line item */}
      {showRFQ && rfqTarget && (() => {
        const targetItem = event.lineItems.find(i => i.id === rfqTarget);
        const targetMoment = targetItem?.momentId ? (event.moments || []).find(m => m.id === targetItem.momentId) : null;
        // Check if already assigned
        const existingAssignment = (event.supplierAssignments || []).find(
          a => a.lineItemId === rfqTarget && a.status === 'PENDING'
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowRFQ(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-slideUp" onClick={(e) => e.stopPropagation()} style={{ border: '1px solid rgba(201,162,74,0.15)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.08)' }}>
                  <Users className="w-5 h-5" style={{ color: GOLD }} />
                </div>
                <div>
                  <h3 className="text-lg font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>Hire My Supplier</h3>
                  <p className="text-[10px] text-gray-400">
                    Assign a supplier to this item — requests are bundled and sent together
                  </p>
                </div>
              </div>

              {/* Item Context */}
              {targetItem && (
                <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: 'rgba(201,162,74,0.04)', border: '1px solid rgba(201,162,74,0.1)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{targetItem.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}>
                      Qty: {targetItem.quantity}
                    </span>
                    {targetMoment && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(139,92,246,0.08)', color: '#8B5CF6' }}>
                        {targetMoment.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Hash className="w-3 h-3" style={{ color: GOLD }} />
                    <span className="text-[10px] text-gray-400">
                      Event Ref: <span className="font-mono font-bold" style={{ color: '#1A1A1A' }}>{event.jobCode}</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5" /> Client protected
                    </span>
                  </div>
                </div>
              )}

              {/* Existing assignment notice */}
              {existingAssignment && (
                <div className="rounded-lg p-3 mb-4 flex items-center gap-2" style={{ backgroundColor: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <div>
                    <span className="text-[11px] text-blue-600">
                      Currently assigned to <strong>{existingAssignment.supplierName}</strong>
                    </span>
                    <p className="text-[9px] text-blue-400 mt-0.5">Assigning a new supplier will replace the current one.</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Supplier Name *</label>
                    <input type="text" value={rfqName} onChange={(e) => setRfqName(e.target.value)} placeholder="e.g. ABC Rentals"
                      className="w-full px-3 py-2 rounded-lg border text-xs outline-none" style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAssignSupplier(); }}
                      autoFocus />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Supplier Email</label>
                    <input type="email" value={rfqEmail} onChange={(e) => setRfqEmail(e.target.value)} placeholder="supplier@example.com"
                      className="w-full px-3 py-2 rounded-lg border text-xs outline-none" style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAssignSupplier(); }} />
                  </div>
                </div>
              </div>

              {/* How it works */}
              <div className="mt-4 mb-4 p-3 rounded-lg" style={{ backgroundColor: '#FAFAF7', border: '1px solid rgba(0,0,0,0.04)' }}>
                <p className="text-[10px] font-semibold text-gray-500 mb-2">How bundled quoting works:</p>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 font-bold" style={{ backgroundColor: 'rgba(201,162,74,0.1)', color: GOLD }}>1</span>
                    <span className="text-[10px] text-gray-500">Assign suppliers to line items across all moments</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 font-bold" style={{ backgroundColor: 'rgba(201,162,74,0.1)', color: GOLD }}>2</span>
                    <span className="text-[10px] text-gray-500">Items are automatically grouped by supplier</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 font-bold" style={{ backgroundColor: 'rgba(201,162,74,0.1)', color: GOLD }}>3</span>
                    <span className="text-[10px] text-gray-500">Review all bundles, then send ONE consolidated request per supplier</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={handleAssignSupplier} disabled={!rfqName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all disabled:opacity-40"
                  style={{ backgroundColor: GOLD, color: '#FFF' }}>
                  <Plus className="w-3.5 h-3.5" />
                  {existingAssignment ? 'Update Supplier' : 'Assign Supplier'}
                </button>
                <button onClick={() => setShowRFQ(false)}
                  className="px-4 py-2.5 rounded-lg text-xs text-gray-400 hover:text-gray-600">Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Supplier Quote Review Modal */}
      {showQuoteReview && (
        <SupplierQuoteReview event={event} onClose={() => setShowQuoteReview(false)} />
      )}

      {/* Save as Template Modal */}
      <SaveAsTemplateModal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        event={event}
        calculateSummary={calculateSummary}
      />
    </div>
  );
};

export default EventDetail;
