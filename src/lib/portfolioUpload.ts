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

/**
 * Upload a single file to the supplier-media bucket under portfolios/{userId}/
 */
export async function uploadPortfolioImage(
  file: File,
  userId: string,
): Promise<UploadResult> {
  try {
    // Sanitize filename: remove special chars, keep extension
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeName = file.name
      .replace(/\.[^/.]+$/, '') // remove extension
      .replace(/[^a-zA-Z0-9_-]/g, '_') // replace special chars
      .substring(0, 50); // limit length
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const storagePath = `portfolios/${userId}/${uniqueId}-${safeName}.${ext}`;

    const { data, error: uploadError } = await supabase.storage
      .from('supplier-media')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { url: '', fileName: file.name, error: uploadError.message };
    }

    // Get the public URL
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
    // First fetch existing URLs
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
    // Fetch existing URLs
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

    // Update the record
    const { error: updateError } = await supabase
      .from('service_providers')
      .update({ portfolio_urls: remainingUrls })
      .eq('user_id', userId);

    if (updateError) {
      return { success: false, remainingUrls: existingUrls, error: updateError.message };
    }

    // Try to delete from storage (extract path from URL)
    try {
      const bucketUrl = '/supplier-media/';
      const idx = urlToRemove.indexOf(bucketUrl);
      if (idx !== -1) {
        const filePath = urlToRemove.substring(idx + bucketUrl.length);
        await supabase.storage.from('supplier-media').remove([filePath]);
      }
    } catch {
      // Storage deletion is best-effort
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
