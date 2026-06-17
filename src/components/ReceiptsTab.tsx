import React, { useState, useEffect, useRef } from 'react';
import {
  Receipt, Plus, Trash2, Download, Upload, Loader2, AlertCircle,
  Calendar, DollarSign, Tag, FileText, CreditCard, ChevronDown,
} from 'lucide-react';
import {
  EventReceipt, PaymentMethod, PAYMENT_METHOD_LABELS,
  getReceipts, uploadReceipt, deleteReceipt, getReceiptUrl,
} from '@/lib/receiptUploads';
import { useAppContext } from '@/contexts/AppContext';
import { CATEGORY_LABELS, ItemCategory } from '@/contexts/EventContext';
import { getCurrencySymbol, formatCurrency } from '@/data/countryConfig';
import { toast } from '@/components/ui/use-toast';

const GOLD = '#C9A24A';

interface ReceiptsTabProps {
  eventId: string;
  currency?: string;
}

const emptyForm = {
  vendor: '',
  amount: '',
  receiptDate: '',
  category: '' as ItemCategory | '',
  description: '',
  paymentMethod: '' as PaymentMethod | '',
};

const ReceiptsTab: React.FC<ReceiptsTabProps> = ({ eventId, currency = 'ZAR' }) => {
  const { user } = useAppContext();
  const [receipts, setReceipts] = useState<EventReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const currSym = getCurrencySymbol(currency);
  const fmt = (n: number) => formatCurrency(n, currSym);

  useEffect(() => {
    setLoading(true);
    getReceipts(eventId).then(data => {
      setReceipts(data);
      setLoading(false);
    });
  }, [eventId]);

  const totalAmount = receipts.reduce((s, r) => s + r.amount, 0);

  const handleUpload = async () => {
    if (!user?.id || !form.vendor.trim() || !form.amount) return;
    setUploading(true);
    const amount = parseFloat(form.amount) || 0;
    let result: EventReceipt | null = null;

    if (file) {
      result = await uploadReceipt(file, eventId, user.id, {
        vendor: form.vendor.trim(),
        amount,
        currency,
        receiptDate: form.receiptDate,
        category: form.category,
        description: form.description,
        paymentMethod: (form.paymentMethod as PaymentMethod) || null,
      });
    } else {
      // No file — insert record only via direct DB insert without storage
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('event_receipts')
        .insert({
          event_id: eventId,
          user_id: user.id,
          vendor: form.vendor.trim(),
          amount,
          currency,
          receipt_date: form.receiptDate || null,
          category: form.category || null,
          description: form.description,
          payment_method: form.paymentMethod || null,
        })
        .select()
        .single();
      if (!error && data) {
        result = {
          id: data.id, eventId: data.event_id, userId: data.user_id,
          vendor: data.vendor, amount: Number(data.amount), currency: data.currency,
          receiptDate: data.receipt_date || null, category: data.category || '',
          description: data.description || '', paymentMethod: data.payment_method || null,
          filePath: null, fileName: null, fileSize: null, fileType: null,
          lineItemId: null, uploadedAt: data.uploaded_at,
        };
      }
    }

    setUploading(false);
    if (result) {
      setReceipts(prev => [result!, ...prev]);
      setForm(emptyForm);
      setFile(null);
      setShowForm(false);
      toast({ title: 'Receipt Added', description: `${form.vendor} — ${fmt(amount)}` });
    } else {
      toast({ title: 'Upload Failed', description: 'Could not save receipt. Check your connection.', variant: 'destructive' });
    }
  };

  const handleDelete = async (receipt: EventReceipt) => {
    if (!confirm(`Remove receipt from "${receipt.vendor}"? This cannot be undone.`)) return;
    setDeletingId(receipt.id);
    await deleteReceipt(receipt.id, receipt.filePath);
    setReceipts(prev => prev.filter(r => r.id !== receipt.id));
    setDeletingId(null);
    toast({ title: 'Receipt Removed' });
  };

  const handleDownload = async (receipt: EventReceipt) => {
    if (!receipt.filePath) return;
    const url = await getReceiptUrl(receipt.filePath);
    if (url) window.open(url, '_blank');
  };

  const categoryOptions = Object.entries(CATEGORY_LABELS) as [ItemCategory, string][];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4" style={{ color: GOLD }} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
              Receipts & Expenses
            </span>
          </div>
          {receipts.length > 0 && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}>
              {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} · {fmt(totalAmount)} total
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={showForm
            ? { backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }
            : { backgroundColor: GOLD, color: '#FFF' }}
        >
          <Plus className="w-3.5 h-3.5" />
          {showForm ? 'Cancel' : 'Add Receipt'}
        </button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'rgba(201,162,74,0.15)', backgroundColor: '#FAFAF7' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#555' }}>New Receipt</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Vendor / Supplier *</label>
              <input
                type="text"
                value={form.vendor}
                onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                placeholder="e.g. Pick n Pay Sandton"
                className="w-full px-3 py-2 rounded-lg border text-xs outline-none"
                style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Amount *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg border text-xs outline-none"
                style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Receipt Date</label>
              <input
                type="date"
                value={form.receiptDate}
                onChange={e => setForm(f => ({ ...f, receiptDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border text-xs outline-none"
                style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Payment Method</label>
              <div className="relative">
                <select
                  value={form.paymentMethod}
                  onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value as PaymentMethod | '' }))}
                  className="w-full px-3 py-2 rounded-lg border text-xs outline-none appearance-none bg-white pr-7"
                  style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
                >
                  <option value="">— Select —</option>
                  {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Category</label>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as ItemCategory | '' }))}
                  className="w-full px-3 py-2 rounded-lg border text-xs outline-none appearance-none bg-white pr-7"
                  style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
                >
                  <option value="">— Select —</option>
                  {categoryOptions.map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional note"
                className="w-full px-3 py-2 rounded-lg border text-xs outline-none"
                style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Attach Receipt File (optional)</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-amber-300"
              style={{ borderColor: file ? 'rgba(201,162,74,0.5)' : 'rgba(0,0,0,0.1)', backgroundColor: file ? 'rgba(201,162,74,0.03)' : 'transparent' }}
            >
              {file ? (
                <>
                  <FileText className="w-5 h-5 mb-1" style={{ color: GOLD }} />
                  <p className="text-[11px] font-medium" style={{ color: '#1A1A1A' }}>{file.name}</p>
                  <p className="text-[9px] text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="mt-1.5 text-[9px] text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mb-1.5 text-gray-300" />
                  <p className="text-[11px] text-gray-400">Click to attach PDF or image</p>
                  <p className="text-[9px] text-gray-300 mt-0.5">Max 20 MB</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleUpload}
              disabled={uploading || !form.vendor.trim() || !form.amount}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-40 transition-all"
              style={{ backgroundColor: GOLD, color: '#FFF' }}
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {uploading ? 'Saving…' : 'Add Receipt'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(emptyForm); setFile(null); }} className="px-3 py-2 text-xs text-gray-400 hover:text-gray-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" style={{ color: GOLD }} />
          <span className="text-sm">Loading receipts…</span>
        </div>
      ) : receipts.length === 0 ? (
        <div className="text-center py-16">
          <Receipt className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(201,162,74,0.25)' }} />
          <p className="text-sm font-light mb-1" style={{ color: '#1A1A1A' }}>No receipts yet</p>
          <p className="text-xs text-gray-400">Upload physical receipts and invoices for this event</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {receipts.map(receipt => (
            <div
              key={receipt.id}
              className="bg-white rounded-xl border p-4 flex items-start gap-4"
              style={{ borderColor: 'rgba(201,162,74,0.12)' }}
            >
              {/* Icon */}
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(201,162,74,0.08)' }}>
                <Receipt className="w-4 h-4" style={{ color: GOLD }} />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: '#1A1A1A' }}>{receipt.vendor}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {receipt.receiptDate && (
                        <span className="flex items-center gap-0.5 text-[9px] text-gray-400">
                          <Calendar className="w-2.5 h-2.5" />{receipt.receiptDate}
                        </span>
                      )}
                      {receipt.category && (
                        <span className="flex items-center gap-0.5 text-[9px] text-gray-400">
                          <Tag className="w-2.5 h-2.5" />{CATEGORY_LABELS[receipt.category as ItemCategory] || receipt.category}
                        </span>
                      )}
                      {receipt.paymentMethod && (
                        <span className="flex items-center gap-0.5 text-[9px] text-gray-400">
                          <CreditCard className="w-2.5 h-2.5" />{PAYMENT_METHOD_LABELS[receipt.paymentMethod]}
                        </span>
                      )}
                      {receipt.fileName && (
                        <span className="flex items-center gap-0.5 text-[9px] text-gray-400">
                          <FileText className="w-2.5 h-2.5" />{receipt.fileName}
                        </span>
                      )}
                    </div>
                    {receipt.description && (
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">{receipt.description}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>{fmt(receipt.amount)}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {receipt.filePath && (
                  <button
                    onClick={() => handleDownload(receipt)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
                    title="View receipt"
                  >
                    <Download className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(receipt)}
                  disabled={deletingId === receipt.id}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50 disabled:opacity-40"
                  title="Remove"
                >
                  {deletingId === receipt.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                    : <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  }
                </button>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: 'rgba(201,162,74,0.04)', border: '1px solid rgba(201,162,74,0.1)' }}>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Receipts</span>
            <span className="text-sm font-bold" style={{ color: '#1A1A1A' }}>{fmt(totalAmount)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptsTab;
