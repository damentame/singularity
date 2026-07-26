import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, Upload, FileText, Trash2, Download, AlertTriangle,
  Clock, CheckCircle2, XCircle, Plus, X, ChevronDown, Loader2,
} from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import {
  ComplianceDocument, ComplianceDocumentType,
  COMPLIANCE_DOCUMENT_TYPES, COMPLIANCE_STATUS_LABELS, COMPLIANCE_STATUS_COLORS,
  getComplianceStatus,
  getComplianceDocuments, uploadComplianceDocument,
  deleteComplianceDocument, getComplianceDocumentUrl,
} from '@/lib/complianceDocuments';
import { toast } from '@/components/ui/use-toast';

const GOLD = '#C9A24A';
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,application/pdf';
const MAX_SIZE_MB = 20;

interface ComplianceDocumentsTabProps {
  eventId: string;
}

const EMPTY_FORM = {
  documentType: 'other' as ComplianceDocumentType,
  title: '',
  issuedBy: '',
  issueDate: '',
  expiryDate: '',
  notes: '',
};

const ComplianceDocumentsTab: React.FC<ComplianceDocumentsTabProps> = ({ eventId }) => {
  const { user } = useAppContext();
  const [docs, setDocs] = useState<ComplianceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getComplianceDocuments(eventId).then(d => {
      setDocs(d);
      setLoading(false);
    });
  }, [eventId, user?.id]);

  const expired = docs.filter(d => getComplianceStatus(d) === 'expired').length;
  const expiringSoon = docs.filter(d => getComplianceStatus(d) === 'expiring_soon').length;

  const applyFile = (f: File) => {
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({ title: 'File too large', description: `Maximum ${MAX_SIZE_MB}MB`, variant: 'destructive' });
      return;
    }
    setFile(f);
    if (!form.title) setForm(prev => ({ ...prev, title: f.name.replace(/\.[^/.]+$/, '') }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) applyFile(f);
  };

  const handleSubmit = async () => {
    if (!file || !form.title.trim() || !user?.id) return;
    setUploading(true);
    const result = await uploadComplianceDocument(file, eventId, user.id, {
      documentType: form.documentType,
      title: form.title.trim(),
      issuedBy: form.issuedBy.trim(),
      issueDate: form.issueDate || null,
      expiryDate: form.expiryDate || null,
      notes: form.notes.trim(),
      uploadedByName: user.name,
    });
    setUploading(false);

    if (result.success && result.doc) {
      setDocs(prev => [result.doc!, ...prev]);
      setForm(EMPTY_FORM);
      setFile(null);
      setShowForm(false);
      toast({ title: 'Document uploaded', description: result.doc.title });
    } else {
      toast({ title: 'Upload failed', description: result.error, variant: 'destructive' });
    }
  };

  const handleDelete = async (doc: ComplianceDocument) => {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setDeleting(doc.id);
    const ok = await deleteComplianceDocument(doc.id, doc.filePath);
    setDeleting(null);
    if (ok) {
      setDocs(prev => prev.filter(d => d.id !== doc.id));
      toast({ title: 'Document deleted' });
    } else {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const handleDownload = async (doc: ComplianceDocument) => {
    const url = await getComplianceDocumentUrl(doc.filePath);
    if (url) {
      window.open(url, '_blank');
    } else {
      toast({ title: 'Could not get download link', variant: 'destructive' });
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const formatBytes = (b: number) =>
    b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="bg-white rounded-2xl border p-4 flex items-center justify-between" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}>
            <ShieldCheck className="w-4.5 h-4.5" style={{ color: GOLD }} />
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: GOLD }}>Compliance Documents</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {docs.length} document{docs.length !== 1 ? 's' : ''}
              {expiringSoon > 0 && <span className="ml-2 text-amber-600">· {expiringSoon} expiring soon</span>}
              {expired > 0 && <span className="ml-2 text-red-500">· {expired} expired</span>}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:shadow-md"
          style={{ backgroundColor: GOLD, color: '#fff' }}
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel' : 'Add Document'}
        </button>
      </div>

      {/* Expiry warnings banner */}
      {(expired > 0 || expiringSoon > 0) && (
        <div
          className="rounded-2xl border p-3 flex items-start gap-3"
          style={{
            backgroundColor: expired > 0 ? 'rgba(220,38,38,0.04)' : 'rgba(217,119,6,0.04)',
            borderColor: expired > 0 ? 'rgba(220,38,38,0.2)' : 'rgba(217,119,6,0.2)',
          }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: expired > 0 ? '#dc2626' : '#d97706' }} />
          <p className="text-xs" style={{ color: expired > 0 ? '#dc2626' : '#d97706' }}>
            {expired > 0
              ? `${expired} document${expired > 1 ? 's have' : ' has'} expired and may need renewal before the event.`
              : `${expiringSoon} document${expiringSoon > 1 ? 's are' : ' is'} expiring within 30 days — review and renew if needed.`}
          </p>
        </div>
      )}

      {/* Upload form */}
      {showForm && (
        <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: 'rgba(201,162,74,0.2)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: GOLD }}>New Compliance Document</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Document type */}
            <div>
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Document Type</label>
              <div className="relative">
                <select
                  value={form.documentType}
                  onChange={e => setForm(p => ({ ...p, documentType: e.target.value as ComplianceDocumentType }))}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs pr-8 focus:outline-none focus:border-amber-400"
                >
                  {Object.entries(COMPLIANCE_DOCUMENT_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Document Title *</label>
              <input
                type="text"
                placeholder="e.g. City of Cape Town Liquor License 2026"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Issued by */}
            <div>
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Issued By</label>
              <input
                type="text"
                placeholder="e.g. Department of Health"
                value={form.issuedBy}
                onChange={e => setForm(p => ({ ...p, issuedBy: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Issue date */}
            <div>
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Issue Date</label>
              <input
                type="date"
                value={form.issueDate}
                onChange={e => setForm(p => ({ ...p, issueDate: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Expiry date */}
            <div>
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Expiry Date</label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Notes</label>
              <input
                type="text"
                placeholder="Optional notes"
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* File drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
            style={{
              borderColor: isDragging ? GOLD : (file ? 'rgba(22,163,74,0.4)' : 'rgba(0,0,0,0.12)'),
              backgroundColor: isDragging ? 'rgba(201,162,74,0.04)' : file ? 'rgba(22,163,74,0.03)' : 'transparent',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) applyFile(f); }}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">{file.name}</span>
                <span className="text-[10px] text-gray-400">({formatBytes(file.size)})</span>
                <button
                  onClick={e => { e.stopPropagation(); setFile(null); }}
                  className="ml-1 text-gray-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                <p className="text-xs text-gray-500">Drop file here or click to browse</p>
                <p className="text-[10px] text-gray-400 mt-1">PDF, JPG, PNG, WEBP — max {MAX_SIZE_MB}MB</p>
              </>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={uploading || !file || !form.title.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: GOLD, color: '#fff' }}
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? 'Uploading…' : 'Upload Document'}
            </button>
          </div>
        </div>
      )}

      {/* Document list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : docs.length === 0 ? (
        <div className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <ShieldCheck className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-400">No compliance documents yet</p>
          <p className="text-xs text-gray-300 mt-1">Upload liquor licenses, municipal approvals, food certificates and other required documents.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => {
            const status = getComplianceStatus(doc);
            const colors = COMPLIANCE_STATUS_COLORS[status];
            const isDeleting = deleting === doc.id;

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border p-4 flex items-start gap-4 transition-all hover:shadow-sm"
                style={{ borderColor: status === 'expired' ? 'rgba(220,38,38,0.2)' : status === 'expiring_soon' ? 'rgba(217,119,6,0.2)' : 'rgba(0,0,0,0.06)' }}
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-800 truncate">{doc.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{COMPLIANCE_DOCUMENT_TYPES[doc.documentType]}</p>
                    </div>
                    <span
                      className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {COMPLIANCE_STATUS_LABELS[status]}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {doc.issuedBy && (
                      <span className="text-[10px] text-gray-500">
                        <span className="text-gray-400">Issued by:</span> {doc.issuedBy}
                      </span>
                    )}
                    {doc.issueDate && (
                      <span className="text-[10px] text-gray-500">
                        <span className="text-gray-400">Issued:</span> {formatDate(doc.issueDate)}
                      </span>
                    )}
                    {doc.expiryDate && (
                      <span className="text-[10px]" style={{ color: colors.text }}>
                        <span style={{ color: '#9ca3af' }}>Expires:</span> {formatDate(doc.expiryDate)}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">{doc.fileName} · {formatBytes(doc.fileSize)}</span>
                    {doc.uploadedByRole === 'supplier' && (
                      <span className="text-[10px] text-gray-400">Uploaded by supplier{doc.uploadedByName ? ` (${doc.uploadedByName})` : ''}</span>
                    )}
                  </div>

                  {doc.notes && (
                    <p className="text-[10px] text-gray-400 mt-1 italic">{doc.notes}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  {doc.userId === user?.id && (
                    <button
                      onClick={() => handleDelete(doc)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      {isDeleting
                        ? <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                      }
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ComplianceDocumentsTab;
