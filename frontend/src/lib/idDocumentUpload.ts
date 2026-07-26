import { supabase } from '@/lib/supabase';

export type IdDocumentType = 'id_card' | 'passport' | 'drivers_license';

export const ID_DOCUMENT_TYPE_LABELS: Record<IdDocumentType, string> = {
  id_card: 'National ID Card',
  passport: 'Passport',
  drivers_license: "Driver's License",
};

export type IdVerificationStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface IdDocumentRecord {
  id: string;
  user_id: string;
  document_type: IdDocumentType;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  uploaded_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

/**
 * Upload a single ID document to the private supplier-id-documents bucket,
 * insert a record into supplier_id_documents, and flip service_providers
 * id_verification_status to 'pending'.
 */
export async function uploadIdDocument(
  file: File,
  userId: string,
  documentType: IdDocumentType,
): Promise<{ success: boolean; record?: IdDocumentRecord; error?: string }> {
  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    const storagePath = `${userId}/${Date.now()}-${safeName}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('supplier-id-documents')
      .upload(storagePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data, error: dbError } = await supabase
      .from('supplier_id_documents')
      .insert({
        user_id: userId,
        document_type: documentType,
        file_name: file.name,
        file_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    // Mark the provider's verification status as pending
    await supabase
      .from('service_providers')
      .update({ id_verification_status: 'pending' })
      .eq('user_id', userId);

    return { success: true, record: data as IdDocumentRecord };
  } catch (err: any) {
    return { success: false, error: err.message || 'Upload failed' };
  }
}

/**
 * Fetch the most recently uploaded ID document for a supplier.
 */
export async function getIdDocument(userId: string): Promise<IdDocumentRecord | null> {
  try {
    const { data, error } = await supabase
      .from('supplier_id_documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as IdDocumentRecord;
  } catch {
    return null;
  }
}

/**
 * Return a short-lived signed URL (1 hour) for a document in the private bucket.
 */
export async function getIdDocumentSignedUrl(filePath: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('supplier-id-documents')
      .createSignedUrl(filePath, 3600);

    if (error || !data) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
