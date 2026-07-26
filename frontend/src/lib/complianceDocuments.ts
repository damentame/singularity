// ─── Compliance Document Helpers ──────────────────────────────────────────────
// Per-event compliance docs (liquor license, municipal approvals, food licenses…)
// Coordinator path: authenticated Supabase calls + direct storage.
// Supplier portal path: security-definer RPCs (unauthenticated, token-validated).

import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ComplianceDocumentType =
  | 'liquor_license'
  | 'municipal_approval'
  | 'food_license'
  | 'venue_permit'
  | 'fire_safety'
  | 'health_certificate'
  | 'noise_permit'
  | 'temporary_structure'
  | 'public_liability'
  | 'supplier_certification'
  | 'other';

export const COMPLIANCE_DOCUMENT_TYPES: Record<ComplianceDocumentType, string> = {
  liquor_license:         'Liquor License',
  municipal_approval:     'Municipal Approval',
  food_license:           'Food Handler / Food License',
  venue_permit:           'Venue / Events Permit',
  fire_safety:            'Fire Safety Certificate',
  health_certificate:     'Health & Safety Certificate',
  noise_permit:           'Noise Permit',
  temporary_structure:    'Temporary Structure Permit',
  public_liability:       'Public Liability Insurance',
  supplier_certification: 'Supplier Certification',
  other:                  'Other',
};

export interface ComplianceDocument {
  id: string;
  eventId: string;
  userId: string;
  uploadedByRole: 'coordinator' | 'supplier';
  uploadedByName: string;
  documentType: ComplianceDocumentType;
  title: string;
  issuedBy: string;
  issueDate: string | null;
  expiryDate: string | null;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  notes: string;
  uploadedAt: string;
}

export type ComplianceStatus = 'valid' | 'expiring_soon' | 'expired' | 'no_expiry';

export const COMPLIANCE_STATUS_LABELS: Record<ComplianceStatus, string> = {
  valid:         'Valid',
  expiring_soon: 'Expiring Soon',
  expired:       'Expired',
  no_expiry:     'No Expiry Date',
};

export const COMPLIANCE_STATUS_COLORS: Record<ComplianceStatus, { bg: string; text: string }> = {
  valid:         { bg: 'rgba(22,163,74,0.1)',  text: '#16a34a' },
  expiring_soon: { bg: 'rgba(217,119,6,0.1)',  text: '#d97706' },
  expired:       { bg: 'rgba(220,38,38,0.1)',  text: '#dc2626' },
  no_expiry:     { bg: 'rgba(107,114,128,0.1)', text: '#6b7280' },
};

export function getComplianceStatus(doc: ComplianceDocument): ComplianceStatus {
  if (!doc.expiryDate) return 'no_expiry';
  const expiry = new Date(doc.expiryDate);
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (expiry < now) return 'expired';
  if (expiry < soon) return 'expiring_soon';
  return 'valid';
}

// ─── Row mapper ───────────────────────────────────────────────────────────────

function mapRow(row: any): ComplianceDocument {
  return {
    id:             row.id,
    eventId:        row.event_id,
    userId:         row.user_id,
    uploadedByRole: row.uploaded_by_role,
    uploadedByName: row.uploaded_by_name || '',
    documentType:   row.document_type as ComplianceDocumentType,
    title:          row.title,
    issuedBy:       row.issued_by || '',
    issueDate:      row.issue_date || null,
    expiryDate:     row.expiry_date || null,
    fileName:       row.file_name,
    filePath:       row.file_path,
    fileSize:       row.file_size,
    mimeType:       row.mime_type,
    notes:          row.notes || '',
    uploadedAt:     row.uploaded_at,
  };
}

// ─── Coordinator (authenticated) ─────────────────────────────────────────────

export async function getComplianceDocuments(eventId: string): Promise<ComplianceDocument[]> {
  const { data, error } = await supabase
    .from('event_compliance_documents')
    .select('*')
    .eq('event_id', eventId)
    .order('uploaded_at', { ascending: false });

  if (error) { console.warn('getComplianceDocuments:', error.message); return []; }
  return (data || []).map(mapRow);
}

export async function uploadComplianceDocument(
  file: File,
  eventId: string,
  userId: string,
  meta: {
    documentType: ComplianceDocumentType;
    title: string;
    issuedBy: string;
    issueDate: string | null;
    expiryDate: string | null;
    notes: string;
    uploadedByName?: string;
  },
): Promise<{ success: boolean; doc?: ComplianceDocument; error?: string }> {
  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${userId}/${eventId}/${Date.now()}-${safeName}`;

    const { error: storageErr } = await supabase.storage
      .from('event-compliance-docs')
      .upload(filePath, file, { contentType: file.type, upsert: false });

    if (storageErr) return { success: false, error: storageErr.message };

    const { data: inserted, error: dbErr } = await supabase
      .from('event_compliance_documents')
      .insert({
        event_id:         eventId,
        user_id:          userId,
        uploaded_by_role: 'coordinator',
        uploaded_by_name: meta.uploadedByName || '',
        document_type:    meta.documentType,
        title:            meta.title,
        issued_by:        meta.issuedBy,
        issue_date:       meta.issueDate || null,
        expiry_date:      meta.expiryDate || null,
        file_name:        file.name,
        file_path:        filePath,
        file_size:        file.size,
        mime_type:        file.type,
        notes:            meta.notes,
      })
      .select()
      .single();

    if (dbErr) {
      await supabase.storage.from('event-compliance-docs').remove([filePath]);
      return { success: false, error: dbErr.message };
    }

    return { success: true, doc: mapRow(inserted) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteComplianceDocument(docId: string, filePath: string): Promise<boolean> {
  try {
    await supabase.storage.from('event-compliance-docs').remove([filePath]);
    const { error } = await supabase
      .from('event_compliance_documents')
      .delete()
      .eq('id', docId);
    return !error;
  } catch {
    return false;
  }
}

export async function getComplianceDocumentUrl(filePath: string): Promise<string | null> {
  try {
    const { data } = await supabase.storage
      .from('event-compliance-docs')
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl || null;
  } catch {
    return null;
  }
}

// ─── Supplier portal (anon, token-validated via security-definer RPCs) ────────

export async function portalGetComplianceDocs(token: string): Promise<ComplianceDocument[]> {
  try {
    const { data, error } = await supabase.rpc('portal_get_compliance_docs', { p_token: token });
    if (error || !data) return [];
    return (data as any[]).map(mapRow);
  } catch {
    return [];
  }
}

export async function portalUploadComplianceDoc(
  token: string,
  file: File,
  eventId: string,
  supplierName: string,
  meta: {
    documentType: ComplianceDocumentType;
    title: string;
    issuedBy: string;
    issueDate: string | null;
    expiryDate: string | null;
    notes: string;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const docId = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `portal/${token}/${Date.now()}-${safeName}`;

    const { error: storageErr } = await supabase.storage
      .from('event-compliance-docs')
      .upload(filePath, file, { contentType: file.type, upsert: false });

    if (storageErr) return { success: false, error: storageErr.message };

    const { error: rpcErr } = await supabase.rpc('portal_save_compliance_doc', {
      p_token:         token,
      p_doc_id:        docId,
      p_event_id:      eventId,
      p_doc_type:      meta.documentType,
      p_title:         meta.title,
      p_issued_by:     meta.issuedBy,
      p_issue_date:    meta.issueDate,
      p_expiry_date:   meta.expiryDate,
      p_file_name:     file.name,
      p_file_path:     filePath,
      p_file_size:     file.size,
      p_mime_type:     file.type,
      p_notes:         meta.notes,
      p_supplier_name: supplierName,
    });

    if (rpcErr) {
      await supabase.storage.from('event-compliance-docs').remove([filePath]);
      return { success: false, error: rpcErr.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
