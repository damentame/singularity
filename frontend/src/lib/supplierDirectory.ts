// ─── Supplier Directory ────────────────────────────────────────────────────────
// Queries onboarded service providers from Supabase for the coordinator's
// supplier assignment picker — filtered by event location and item category.
// Falls back to demo mock suppliers when Supabase returns no results.

import { supabase } from '@/lib/supabase';
import { MOCK_SUPPLIERS } from './demoSeed';

export interface AppSupplier {
  userId: string;
  businessName: string;
  tradingName: string;
  email: string;
  city: string;
  country: string;
  serviceRadius: string;
  categories: string[];
  coverImageUrl: string | null;
}

function applyFilters(suppliers: AppSupplier[], filters: { country: string; city?: string; category?: string }): AppSupplier[] {
  let results = suppliers.filter(s => s.country === filters.country);

  if (filters.category) {
    const cat = filters.category.toLowerCase();
    const withCat = results.filter(s => s.categories.some(c => c.toLowerCase() === cat));
    if (withCat.length > 0) results = withCat;
  }

  if (filters.city) {
    const city = filters.city.toLowerCase();
    results.sort((a, b) => {
      const aMatch = a.city.toLowerCase().includes(city) || city.includes(a.city.toLowerCase());
      const bMatch = b.city.toLowerCase().includes(city) || city.includes(b.city.toLowerCase());
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return a.businessName.localeCompare(b.businessName);
    });
  }

  return results;
}

export async function searchAppSuppliers(filters: {
  country: string;
  city?: string;
  category?: string;
}): Promise<AppSupplier[]> {
  try {
    // Fetch active providers in the event's country
    const { data: providers, error } = await supabase
      .from('service_providers')
      .select('user_id, business_name, trading_name, city, country, service_radius, selected_categories, cover_image_url')
      .eq('is_active', true)
      .eq('country', filters.country)
      .order('business_name');

    if (error || !providers || providers.length === 0) {
      return applyFilters(MOCK_SUPPLIERS, filters);
    }

    // Fetch emails from profiles for these user_ids
    const userIds = providers.map((p: any) => p.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds);

    const emailMap: Record<string, string> = {};
    (profiles || []).forEach((p: any) => { emailMap[p.id] = p.email || ''; });

    // Build results — extract category keys from selected_categories jsonb
    const results: AppSupplier[] = providers.map((p: any) => {
      const cats = p.selected_categories && typeof p.selected_categories === 'object'
        ? Object.keys(p.selected_categories).filter(k => p.selected_categories[k])
        : [];
      return {
        userId:        p.user_id,
        businessName:  p.business_name || p.trading_name || '',
        tradingName:   p.trading_name || '',
        email:         emailMap[p.user_id] || '',
        city:          p.city || '',
        country:       p.country || '',
        serviceRadius: p.service_radius || '',
        categories:    cats,
        coverImageUrl: p.cover_image_url || null,
      };
    });

    return applyFilters(results, filters);
  } catch (err: any) {
    console.warn('searchAppSuppliers error:', err.message);
    return applyFilters(MOCK_SUPPLIERS, filters);
  }
}
