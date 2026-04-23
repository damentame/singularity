import React, { useState, useMemo } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Users, Plus, X,
  ChevronDown, ChevronRight, FileText, Clock, Shield, BarChart3, PieChart
} from 'lucide-react';
import {
  useEventContext, PlannerEvent, SupplierAssignment, SupplierQuote,
  ApprovalRequest, BudgetLine, ActivityLogEntry,
  ASSIGNMENT_STATUS_LABELS, ASSIGNMENT_STATUS_COLORS,
  CATEGORY_LABELS, ItemCategory,
  getConfirmedSpend, getBudgetVariance, getMarginOnConfirmed,
  SupplierAssignmentStatus,
} from '@/contexts/EventContext';
import { toast } from '@/components/ui/use-toast';

const GOLD = '#C9A24A';
const fmt = (n: number) => 'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Supplier Assignment Panel (per line item) ──────────────────────────────

interface AssignPanelProps {
  event: PlannerEvent;
  lineItemId: string;
  onClose: () => void;
}

const SupplierAssignPanel: React.FC<AssignPanelProps> = ({ event, lineItemId, onClose }) => {
  const { updateEvent } = useEventContext();
  const lineItem = event.lineItems.find(li => li.id === lineItemId);
  const assignment = (event.supplierAssignments || []).find(a => a.lineItemId === lineItemId);
  const quotes = (event.supplierQuotes || []).filter(q => assignment && q.assignmentId === assignment.id);

  const [name, setName] = useState(assignment?.supplierName || '');
  const [email, setEmail] = useState(assignment?.supplierEmail || '');
  const [quoteAmt, setQuoteAmt] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [adjDesc, setAdjDesc] = useState('');
  const [adjAmt, setAdjAmt] = useState('');

  if (!lineItem) return null;

  const now = () => new Date().toISOString();
  const uid = () => `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  const logAction = (action: string, details: string): ActivityLogEntry => ({
    id: `log-${uid()}`, eventId: event.id, action, details, actor: 'Coordinator', timestamp: now(),
  });

  const handleAssign = () => {
    if (!name.trim()) return;
    const id = `sa-${uid()}`;
    const sa: SupplierAssignment = {
      id, eventId: event.id, lineItemId, supplierName: name.trim(), supplierEmail: email.trim(),
      supplierCompanyId: '', status: 'PENDING', acceptedQuoteId: '', notes: '', createdAt: now(), updatedAt: now(),
    };
    updateEvent(event.id, {
      supplierAssignments: [...(event.supplierAssignments || []), sa],
      lineItems: event.lineItems.map(li => li.id === lineItemId ? { ...li, supplierAssignmentId: id } : li),
      activityLog: [...(event.activityLog || []), logAction('SUPPLIER_ASSIGNED', `${name.trim()} assigned to ${lineItem.name}`)],
    });
    toast({ title: 'Supplier Assigned', description: `${name.trim()} assigned to ${lineItem.name}` });
  };

  const handleAddQuote = () => {
    if (!assignment || !quoteAmt) return;
    const amt = parseFloat(quoteAmt);
    if (isNaN(amt) || amt <= 0) return;
    const existingQuotes = quotes.filter(q => q.assignmentId === assignment.id);
    const ver = existingQuotes.length + 1;
    const q: SupplierQuote = {
      id: `sq-${uid()}`, assignmentId: assignment.id, versionNumber: ver,
      amount: amt, currency: 'ZAR', fileUrl: '', fileName: '',
      notes: quoteNotes.trim(), isAccepted: false, status: 'SUBMITTED', submittedAt: now(),
    };
    const newStatus: SupplierAssignmentStatus = ver > 1 ? 'QUOTE_REVISED' : 'QUOTE_RECEIVED';
    updateEvent(event.id, {
      supplierQuotes: [...(event.supplierQuotes || []), q],
      supplierAssignments: (event.supplierAssignments || []).map(a =>
        a.id === assignment.id ? { ...a, status: newStatus, updatedAt: now() } : a
      ),
      activityLog: [...(event.activityLog || []), logAction(
        ver > 1 ? 'QUOTE_REVISED' : 'QUOTE_RECEIVED',
        `Quote v${ver} (${fmt(amt)}) from ${assignment.supplierName} for ${lineItem.name}`
      )],
    });
    setQuoteAmt(''); setQuoteNotes('');
    toast({ title: `Quote v${ver} Added`, description: fmt(amt) });
  };

  const handleAcceptQuote = (quoteId: string, isAdmin: boolean) => {
    if (!assignment) return;
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;

    if (!isAdmin) {
      const ar: ApprovalRequest = {
        id: `ar-${uid()}`, eventId: event.id, type: 'QUOTE_ACCEPTANCE',
        referenceId: quoteId, referenceLabel: `${assignment.supplierName} v${quote.versionNumber} — ${fmt(quote.amount)}`,
        amount: quote.amount, requestedBy: 'Coordinator', requestedAt: now(),
        approvedBy: '', approvedAt: '', status: 'PENDING', notes: '',
      };
      updateEvent(event.id, {
        approvalRequests: [...(event.approvalRequests || []), ar],
        activityLog: [...(event.activityLog || []), logAction('APPROVAL_REQUESTED', `Approval requested for ${assignment.supplierName} quote v${quote.versionNumber}`)],
      });
      toast({ title: 'Approval Requested', description: 'Admin approval required to accept this quote.' });
      return;
    }

    // Admin direct accept
    const updatedQuotes = (event.supplierQuotes || []).map(q => {
      if (q.assignmentId === assignment.id) return { ...q, isAccepted: q.id === quoteId, status: (q.id === quoteId ? 'ACCEPTED' : 'REJECTED') as SupplierQuote['status'] };
      return q;
    });
    const bl: BudgetLine = {
      id: `bl-${uid()}`, eventId: event.id, type: 'SUPPLIER_QUOTE',
      description: `${assignment.supplierName} — ${lineItem.name}`,
      amount: quote.amount, referenceId: quoteId, approvalRequestId: '', status: 'APPROVED', createdAt: now(),
    };
    updateEvent(event.id, {
      supplierQuotes: updatedQuotes,
      supplierAssignments: (event.supplierAssignments || []).map(a =>
        a.id === assignment.id ? { ...a, status: 'ACCEPTED' as SupplierAssignmentStatus, acceptedQuoteId: quoteId, updatedAt: now() } : a
      ),
      budgetLines: [...(event.budgetLines || []), bl],
      activityLog: [...(event.activityLog || []), logAction('QUOTE_ACCEPTED', `Accepted ${assignment.supplierName} v${quote.versionNumber} at ${fmt(quote.amount)}`)],
    });
    toast({ title: 'Quote Accepted', description: `${assignment.supplierName} confirmed at ${fmt(quote.amount)}` });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{lineItem.name}</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">{CATEGORY_LABELS[lineItem.category]}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {!assignment ? (
            <div className="space-y-3">
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>Assign Supplier</h4>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Supplier name" className="w-full px-3 py-2 text-xs border rounded-lg" style={{ borderColor: 'rgba(201,162,74,0.2)' }} />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" className="w-full px-3 py-2 text-xs border rounded-lg" style={{ borderColor: 'rgba(201,162,74,0.2)' }} />
              <button onClick={handleAssign} className="w-full py-2 text-xs font-medium text-white rounded-lg" style={{ backgroundColor: GOLD }}>Assign Supplier</button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">{assignment.supplierName}</p>
                  {assignment.supplierEmail && <p className="text-[10px] text-gray-400">{assignment.supplierEmail}</p>}
                </div>
                <span className="text-[9px] font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: ASSIGNMENT_STATUS_COLORS[assignment.status] }}>
                  {ASSIGNMENT_STATUS_LABELS[assignment.status]}
                </span>
              </div>

              {/* Quotes List */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>Quotes ({quotes.length})</h4>
                {quotes.sort((a, b) => b.versionNumber - a.versionNumber).map(q => (
                  <div key={q.id} className="flex items-center justify-between p-2.5 rounded-lg border" style={{ borderColor: q.isAccepted ? '#22C55E' : 'rgba(201,162,74,0.15)', backgroundColor: q.isAccepted ? '#F0FDF4' : '#FAFAFA' }}>
                    <div>
                      <span className="text-xs font-medium">v{q.versionNumber}</span>
                      <span className="text-xs ml-2 font-semibold">{fmt(q.amount)}</span>
                      {q.notes && <p className="text-[10px] text-gray-400 mt-0.5">{q.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {q.isAccepted ? (
                        <span className="text-[9px] font-medium text-green-600 flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> Accepted</span>
                      ) : assignment.status !== 'ACCEPTED' && (
                        <button onClick={() => handleAcceptQuote(q.id, true)} className="text-[9px] px-2 py-1 rounded font-medium text-white" style={{ backgroundColor: '#22C55E' }}>Accept (Admin)</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Quote */}
              {assignment.status !== 'ACCEPTED' && (
                <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
                  <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>Add Quote</h4>
                  <div className="flex gap-2">
                    <input value={quoteAmt} onChange={e => setQuoteAmt(e.target.value)} type="number" placeholder="Amount" className="flex-1 px-3 py-2 text-xs border rounded-lg" style={{ borderColor: 'rgba(201,162,74,0.2)' }} />
                    <button onClick={handleAddQuote} className="px-4 py-2 text-xs font-medium text-white rounded-lg" style={{ backgroundColor: GOLD }}>Add</button>
                  </div>
                  <input value={quoteNotes} onChange={e => setQuoteNotes(e.target.value)} placeholder="Notes (optional)" className="w-full px-3 py-2 text-xs border rounded-lg" style={{ borderColor: 'rgba(201,162,74,0.2)' }} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Control Tower Dashboard ─────────────────────────────────────────────────

interface ControlTowerDashboardProps {
  event: PlannerEvent;
}

const ControlTowerDashboard: React.FC<ControlTowerDashboardProps> = ({ event }) => {
  const { calculateLineItem, updateEvent } = useEventContext();
  const [assigningItem, setAssigningItem] = useState<string | null>(null);
  const [showAdjForm, setShowAdjForm] = useState(false);
  const [adjDesc, setAdjDesc] = useState('');
  const [adjAmt, setAdjAmt] = useState('');
  const [expandedLog, setExpandedLog] = useState(false);

  const proposalTotal = useMemo(() => event.lineItems.reduce((s, li) => s + calculateLineItem(li).clientPrice, 0), [event.lineItems, calculateLineItem]);
  const confirmedSpend = getConfirmedSpend(event);
  const variance = getBudgetVariance(proposalTotal, confirmedSpend);
  const margin = getMarginOnConfirmed(proposalTotal, confirmedSpend);

  const assignments = event.supplierAssignments || [];
  const approvals = (event.approvalRequests || []).filter(a => a.status === 'PENDING');
  const acceptedCount = assignments.filter(a => a.status === 'ACCEPTED').length;
  const activityLog = (event.activityLog || []).slice(-10).reverse();

  // Spend by category
  const spendByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    (event.supplierQuotes || []).filter(q => q.isAccepted).forEach(q => {
      const sa = assignments.find(a => a.id === q.assignmentId);
      if (sa) {
        const li = event.lineItems.find(l => l.id === sa.lineItemId);
        if (li) {
          const cat = CATEGORY_LABELS[li.category] || 'Other';
          map[cat] = (map[cat] || 0) + q.amount;
        }
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [event.supplierQuotes, assignments, event.lineItems]);

  const handleApprove = (arId: string) => {
    const ar = (event.approvalRequests || []).find(a => a.id === arId);
    if (!ar) return;
    const now = new Date().toISOString();
    const uid = () => `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    if (ar.type === 'QUOTE_ACCEPTANCE') {
      const quote = (event.supplierQuotes || []).find(q => q.id === ar.referenceId);
      if (!quote) return;
      const sa = assignments.find(a => a.id === quote.assignmentId);
      if (!sa) return;
      const updatedQuotes = (event.supplierQuotes || []).map(q => {
        if (q.assignmentId === sa.id) return { ...q, isAccepted: q.id === quote.id, status: (q.id === quote.id ? 'ACCEPTED' : 'REJECTED') as SupplierQuote['status'] };
        return q;
      });
      const bl: BudgetLine = { id: `bl-${uid()}`, eventId: event.id, type: 'SUPPLIER_QUOTE', description: `${sa.supplierName}`, amount: quote.amount, referenceId: quote.id, approvalRequestId: arId, status: 'APPROVED', createdAt: now };
      updateEvent(event.id, {
        approvalRequests: (event.approvalRequests || []).map(a => a.id === arId ? { ...a, status: 'APPROVED' as const, approvedBy: 'Admin', approvedAt: now } : a),
        supplierQuotes: updatedQuotes,
        supplierAssignments: assignments.map(a => a.id === sa.id ? { ...a, status: 'ACCEPTED' as const, acceptedQuoteId: quote.id, updatedAt: now } : a),
        budgetLines: [...(event.budgetLines || []), bl],
        activityLog: [...(event.activityLog || []), { id: `log-${uid()}`, eventId: event.id, action: 'APPROVAL_GRANTED', details: `Approved: ${ar.referenceLabel}`, actor: 'Admin', timestamp: now }],
      });
      toast({ title: 'Approved', description: ar.referenceLabel });
    } else if (ar.type === 'ADJUSTMENT') {
      const bl: BudgetLine = { id: `bl-${uid()}`, eventId: event.id, type: 'ADJUSTMENT', description: ar.referenceLabel, amount: ar.amount, referenceId: arId, approvalRequestId: arId, status: 'APPROVED', createdAt: now };
      updateEvent(event.id, {
        approvalRequests: (event.approvalRequests || []).map(a => a.id === arId ? { ...a, status: 'APPROVED' as const, approvedBy: 'Admin', approvedAt: now } : a),
        budgetLines: [...(event.budgetLines || []), bl],
        activityLog: [...(event.activityLog || []), { id: `log-${uid()}`, eventId: event.id, action: 'ADJUSTMENT_APPROVED', details: `Adjustment approved: ${ar.referenceLabel} (${fmt(ar.amount)})`, actor: 'Admin', timestamp: now }],
      });
      toast({ title: 'Adjustment Approved', description: `${ar.referenceLabel}: ${fmt(ar.amount)}` });
    }
  };

  const handleReject = (arId: string) => {
    const now = new Date().toISOString();
    updateEvent(event.id, {
      approvalRequests: (event.approvalRequests || []).map(a => a.id === arId ? { ...a, status: 'REJECTED' as const, approvedBy: 'Admin', approvedAt: now } : a),
    });
    toast({ title: 'Rejected' });
  };

  const handleCreateAdjustment = () => {
    if (!adjDesc.trim() || !adjAmt) return;
    const amt = parseFloat(adjAmt);
    if (isNaN(amt)) return;
    const now = new Date().toISOString();
    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const ar: ApprovalRequest = {
      id: `ar-${uid}`, eventId: event.id, type: 'ADJUSTMENT',
      referenceId: '', referenceLabel: adjDesc.trim(), amount: amt,
      requestedBy: 'Coordinator', requestedAt: now, approvedBy: '', approvedAt: '', status: 'PENDING', notes: '',
    };
    updateEvent(event.id, {
      approvalRequests: [...(event.approvalRequests || []), ar],
      activityLog: [...(event.activityLog || []), { id: `log-${uid}`, eventId: event.id, action: 'ADJUSTMENT_REQUESTED', details: `${adjDesc.trim()}: ${fmt(amt)}`, actor: 'Coordinator', timestamp: now }],
    });
    setAdjDesc(''); setAdjAmt(''); setShowAdjForm(false);
    toast({ title: 'Adjustment Requested', description: 'Pending admin approval.' });
  };

  const maxSpend = spendByCategory.length > 0 ? spendByCategory[0][1] : 1;

  return (
    <div className="space-y-5">
      {/* ─── Dashboard Tiles ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: 'Proposal Total', value: fmt(proposalTotal), icon: <FileText className="w-4 h-4" />, color: GOLD },
          { label: 'Confirmed Spend', value: fmt(confirmedSpend), icon: <DollarSign className="w-4 h-4" />, color: confirmedSpend > 0 ? '#3B82F6' : '#9CA3AF' },
          { label: 'Variance', value: `${variance.percent >= 0 ? '+' : ''}${variance.percent.toFixed(1)}%`, icon: variance.percent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />, color: variance.percent >= 0 ? '#22C55E' : '#EF4444' },
          { label: 'Margin', value: `${margin.toFixed(1)}%`, icon: <BarChart3 className="w-4 h-4" />, color: margin >= 25 ? '#22C55E' : '#F59E0B' },
          { label: 'Open Approvals', value: String(approvals.length), icon: <AlertCircle className="w-4 h-4" />, color: approvals.length > 0 ? '#F59E0B' : '#22C55E' },
          { label: 'Suppliers Confirmed', value: `${acceptedCount}/${assignments.length}`, icon: <CheckCircle2 className="w-4 h-4" />, color: '#8B5CF6' },
        ].map((tile, i) => (
          <div key={i} className="bg-white rounded-xl border p-4" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${tile.color}15`, color: tile.color }}>{tile.icon}</div>
              <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400">{tile.label}</span>
            </div>
            <p className="text-lg font-bold" style={{ color: '#1A1A1A' }}>{tile.value}</p>
          </div>
        ))}
      </div>

      {/* ─── Spend by Category Chart ──────────────────────────────────── */}
      {spendByCategory.length > 0 && (
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: GOLD }}>
            <PieChart className="w-3.5 h-3.5 inline mr-1.5" />Spend by Category
          </h3>
          <div className="space-y-2.5">
            {spendByCategory.map(([cat, amt]) => (
              <div key={cat}>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-gray-600">{cat}</span>
                  <span className="font-medium">{fmt(amt)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(amt / maxSpend) * 100}%`, backgroundColor: GOLD }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Proposal vs Confirmed Bar ────────────────────────────────── */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: GOLD }}>
          <BarChart3 className="w-3.5 h-3.5 inline mr-1.5" />Proposal vs Confirmed
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[10px] mb-1"><span className="text-gray-500">Proposal</span><span className="font-medium">{fmt(proposalTotal)}</span></div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: '100%', backgroundColor: GOLD }} /></div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1"><span className="text-gray-500">Confirmed</span><span className="font-medium">{fmt(confirmedSpend)}</span></div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: proposalTotal > 0 ? `${Math.min(100, (confirmedSpend / proposalTotal) * 100)}%` : '0%', backgroundColor: confirmedSpend > proposalTotal ? '#EF4444' : '#22C55E' }} /></div>
          </div>
        </div>
      </div>

      {/* ─── Open Approvals ───────────────────────────────────────────── */}
      {approvals.length > 0 && (
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: GOLD }}>
            <Shield className="w-3.5 h-3.5 inline mr-1.5" />Pending Approvals ({approvals.length})
          </h3>
          <div className="space-y-2">
            {approvals.map(ar => (
              <div key={ar.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div>
                  <p className="text-xs font-medium">{ar.referenceLabel}</p>
                  <p className="text-[10px] text-gray-400">{ar.type === 'QUOTE_ACCEPTANCE' ? 'Quote Acceptance' : 'Adjustment'} — {fmt(ar.amount)}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => handleApprove(ar.id)} className="px-2.5 py-1 text-[10px] font-medium text-white rounded" style={{ backgroundColor: '#22C55E' }}>Approve</button>
                  <button onClick={() => handleReject(ar.id)} className="px-2.5 py-1 text-[10px] font-medium text-white rounded bg-red-500">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Adjustment Request ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>Budget Adjustments</h3>
          <button onClick={() => setShowAdjForm(!showAdjForm)} className="text-[10px] font-medium flex items-center gap-1" style={{ color: GOLD }}>
            <Plus className="w-3 h-3" /> Request Adjustment
          </button>
        </div>
        {showAdjForm && (
          <div className="space-y-2 mb-3 p-3 rounded-lg bg-gray-50">
            <input value={adjDesc} onChange={e => setAdjDesc(e.target.value)} placeholder="Description" className="w-full px-3 py-2 text-xs border rounded-lg" style={{ borderColor: 'rgba(201,162,74,0.2)' }} />
            <div className="flex gap-2">
              <input value={adjAmt} onChange={e => setAdjAmt(e.target.value)} type="number" placeholder="Amount (R)" className="flex-1 px-3 py-2 text-xs border rounded-lg" style={{ borderColor: 'rgba(201,162,74,0.2)' }} />
              <button onClick={handleCreateAdjustment} className="px-4 py-2 text-xs font-medium text-white rounded-lg" style={{ backgroundColor: GOLD }}>Submit</button>
            </div>
          </div>
        )}
        {(event.budgetLines || []).filter(bl => bl.type === 'ADJUSTMENT').length > 0 && (
          <div className="space-y-1.5">
            {(event.budgetLines || []).filter(bl => bl.type === 'ADJUSTMENT').map(bl => (
              <div key={bl.id} className="flex items-center justify-between text-xs p-2 rounded" style={{ backgroundColor: bl.status === 'APPROVED' ? '#F0FDF4' : '#FEF3C7' }}>
                <span>{bl.description}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{fmt(bl.amount)}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: bl.status === 'APPROVED' ? '#22C55E' : '#F59E0B', color: 'white' }}>{bl.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Supplier Assignments Overview ─────────────────────────────── */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: GOLD }}>
          <Users className="w-3.5 h-3.5 inline mr-1.5" />Supplier Assignments ({assignments.length})
        </h3>
        <div className="space-y-2">
          {event.lineItems.map(li => {
            const sa = assignments.find(a => a.lineItemId === li.id);
            return (
              <div key={li.id} className="flex items-center justify-between p-2.5 rounded-lg border" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{li.name}</p>
                  {sa ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-500">{sa.supplierName}</span>
                      <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: ASSIGNMENT_STATUS_COLORS[sa.status] }}>{ASSIGNMENT_STATUS_LABELS[sa.status]}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-300">No supplier assigned</span>
                  )}
                </div>
                <button onClick={() => setAssigningItem(li.id)} className="text-[10px] font-medium px-2.5 py-1 rounded-lg border" style={{ borderColor: 'rgba(201,162,74,0.3)', color: GOLD }}>
                  {sa ? 'Manage' : 'Assign'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Activity Log ──────────────────────────────────────────────── */}
      {activityLog.length > 0 && (
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
          <button onClick={() => setExpandedLog(!expandedLog)} className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
            {expandedLog ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <Clock className="w-3.5 h-3.5" /> Activity Log ({activityLog.length})
          </button>
          {expandedLog && (
            <div className="mt-3 space-y-2">
              {activityLog.map(log => (
                <div key={log.id} className="flex items-start gap-2 text-[10px]">
                  <span className="text-gray-300 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('en-ZA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-gray-600">{log.details}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Assignment Modal ──────────────────────────────────────────── */}
      {assigningItem && <SupplierAssignPanel event={event} lineItemId={assigningItem} onClose={() => setAssigningItem(null)} />}
    </div>
  );
};

export default ControlTowerDashboard;
export { SupplierAssignPanel };
