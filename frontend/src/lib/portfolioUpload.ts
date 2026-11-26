import { supabase } from '@/lib/supabase';

export interface UploadResult {
  url: string;
  fileName: string;
  error?: string;
}

export interface UploadProgress {
  current: number;
  total: number;
  fileName: string;
  percentage: number;
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const MAX_BYTES = 50 * 1024 * 1024;

function resolveMime(file: File): string {
  if (file.type && ALLOWED_MIME.has(file.type)) return file.type;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return file.type || '';
}

function validateImageFile(file: File): string | null {
  const mime = resolveMime(file);
  if (!ALLOWED_MIME.has(mime)) {
    return 'Use a JPEG, PNG, WebP, or GIF image. HEIC/AVIF files are not supported — convert them first.';
  }
  if (file.size > MAX_BYTES) {
    return 'Image must be under 50 MB.';
  }
  return null;
}

/**
 * Upload a single file to the supplier-media bucket under portfolios/{authUid}/.
 * Path must match RLS: folder[1]=portfolios, folder[2]=auth.uid().
 */
export async function uploadPortfolioImage(
  file: File,
  userId: string,
): Promise<UploadResult> {
  try {
    const validationError = validateImageFile(file);
    if (validationError) {
      return { url: '', fileName: file.name, error: validationError };
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const authUid = sessionData.session?.user?.id;
    if (!authUid) {
      return { url: '', fileName: file.name, error: 'Sign in again to upload photos.' };
    }
    if (authUid !== userId) {
      return { url: '', fileName: file.name, error: 'Upload path does not match the signed-in account.' };
    }

    const mime = resolveMime(file);
    const ext = EXT_BY_MIME[mime] || 'jpg';
    const safeName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50) || 'photo';
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const storagePath = `portfolios/${authUid}/${uniqueId}-${safeName}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('supplier-media')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: mime,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      const msg = uploadError.message || 'Upload failed';
      if (/mime|type|not allowed/i.test(msg)) {
        return { url: '', fileName: file.name, error: 'This image type is not allowed. Use JPEG, PNG, WebP, or GIF.' };
      }
      if (/bucket|not found/i.test(msg)) {
        return { url: '', fileName: file.name, error: 'Media storage is not configured. Contact support.' };
      }
      if (/policy|row-level|unauthorized|403/i.test(msg)) {
        return { url: '', fileName: file.name, error: 'Upload was blocked by storage permissions. Sign out and back in, then try again.' };
      }
      return { url: '', fileName: file.name, error: msg };
    }

    const { data: urlData } = supabase.storage
      .from('supplier-media')
      .getPublicUrl(storagePath);

    return {
      url: urlData.publicUrl,
      fileName: file.name,
    };
  } catch (err: any) {
    console.error('Upload failed:', err);
    return { url: '', fileName: file.name, error: err.message || 'Upload failed' };
  }
}

/**
 * Upload multiple portfolio images with progress callback
 */
export async function uploadPortfolioImages(
  files: File[],
  userId: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    onProgress?.({
      current: i + 1,
      total: files.length,
      fileName: file.name,
      percentage: Math.round(((i + 1) / files.length) * 100),
    });

    const result = await uploadPortfolioImage(file, userId);
    results.push(result);
  }

  return results;
}

/**
 * Save portfolio URLs to the service_providers record
 */
export async function savePortfolioUrls(
  userId: string,
  urls: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('service_providers')
      .update({ portfolio_urls: urls })
      .eq('user_id', userId);

    if (error) {
      console.error('Error saving portfolio URLs:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Append new portfolio URLs to existing ones
 */
export async function appendPortfolioUrls(
  userId: string,
  newUrls: string[],
): Promise<{ success: boolean; allUrls: string[]; error?: string }> {
  try {
    const { data, error: fetchError } = await supabase
      .from('service_providers')
      .select('portfolio_urls')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return { success: false, allUrls: [], error: fetchError.message };
    }

    const existingUrls: string[] = data?.portfolio_urls || [];
    const allUrls = [...existingUrls, ...newUrls];

    const { error: updateError } = await supabase
      .from('service_providers')
      .update({ portfolio_urls: allUrls })
      .eq('user_id', userId);

    if (updateError) {
      return { success: false, allUrls: existingUrls, error: updateError.message };
    }

    return { success: true, allUrls };
  } catch (err: any) {
    return { success: false, allUrls: [], error: err.message };
  }
}

/**
 * Remove a portfolio URL and delete from storage
 */
export async function removePortfolioUrl(
  userId: string,
  urlToRemove: string,
): Promise<{ success: boolean; remainingUrls: string[]; error?: string }> {
  try {
    const { data, error: fetchError } = await supabase
      .from('service_providers')
      .select('portfolio_urls')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return { success: false, remainingUrls: [], error: fetchError.message };
    }

    const existingUrls: string[] = data?.portfolio_urls || [];
    const remainingUrls = existingUrls.filter(u => u !== urlToRemove);

    const { error: updateError } = await supabase
      .from('service_providers')
      .update({ portfolio_urls: remainingUrls })
      .eq('user_id', userId);

    if (updateError) {
      return { success: false, remainingUrls: existingUrls, error: updateError.message };
    }

    try {
      const bucketUrl = '/supplier-media/';
      const idx = urlToRemove.indexOf(bucketUrl);
      if (idx !== -1) {
        const filePath = urlToRemove.substring(idx + bucketUrl.length);
        await supabase.storage.from('supplier-media').remove([filePath]);
      }
    } catch {
      console.warn('Could not delete file from storage');
    }

    return { success: true, remainingUrls };
  } catch (err: any) {
    return { success: false, remainingUrls: [], error: err.message };
  }
}

/**
 * Load portfolio URLs for a given user
 */
export async function loadPortfolioUrls(
  userId: string,
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('service_providers')
      .select('portfolio_urls')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error loading portfolio URLs:', error);
      return [];
    }

    return data?.portfolio_urls || [];
  } catch {
    return [];
  }
}

/**
 * Set a portfolio image as the provider's cover image
 */
export async function setCoverImage(
  userId: string,
  coverUrl: string | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('service_providers')
      .update({ cover_image_url: coverUrl })
      .eq('user_id', userId);

    if (error) {
      console.error('Error setting cover image:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Load the current cover image URL for a given user
 */
export async function loadCoverImage(
  userId: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('service_providers')
      .select('cover_image_url')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error loading cover image:', error);
      return null;
    }
    return data?.cover_image_url || null;
  } catch {
    return null;
  }
}
