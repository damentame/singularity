import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OptionItem {
  id: string;
  groupKey: string;
  valueKey: string;
  displayLabel: string;
  sortOrder: number;
  colorTag: string | null;
  isActive: boolean;
}

export interface ConfigOptionSelection {
  optionId: string;       // UUID of selected option_item (empty if custom)
  valueKey: string;       // Stable internal key (e.g. "WEDDING")
  displayLabel: string;   // User-facing label (always stored as snapshot)
  isCustom: boolean;      // True if user typed a custom value
}

// ─── Local Fallback Defaults ─────────────────────────────────────────────────

const LOCAL_DEFAULTS: Record<string, OptionItem[]> = {
  EVENT_TYPE: [
    { id: 'local-et-1', groupKey: 'EVENT_TYPE', valueKey: 'WEDDING', displayLabel: 'Wedding', sortOrder: 10, colorTag: '#E8B4B8', isActive: true },
    { id: 'local-et-2', groupKey: 'EVENT_TYPE', valueKey: 'CORPORATE', displayLabel: 'Corporate', sortOrder: 20, colorTag: '#4A90D9', isActive: true },
    { id: 'local-et-3', groupKey: 'EVENT_TYPE', valueKey: 'CELEBRATION', displayLabel: 'Celebration', sortOrder: 30, colorTag: '#C9A24A', isActive: true },
    { id: 'local-et-4', groupKey: 'EVENT_TYPE', valueKey: 'PRIVATE_DINNER', displayLabel: 'Private Dinner', sortOrder: 40, colorTag: '#7B68EE', isActive: true },
    { id: 'local-et-5', groupKey: 'EVENT_TYPE', valueKey: 'GALA', displayLabel: 'Gala', sortOrder: 50, colorTag: '#DAA520', isActive: true },
    { id: 'local-et-6', groupKey: 'EVENT_TYPE', valueKey: 'CONFERENCE', displayLabel: 'Conference', sortOrder: 60, colorTag: '#20B2AA', isActive: true },
    { id: 'local-et-7', groupKey: 'EVENT_TYPE', valueKey: 'OTHER', displayLabel: 'Other', sortOrder: 999, colorTag: '#999999', isActive: true },
  ],
  MOMENT_TYPE: [
    { id: 'local-mt-1', groupKey: 'MOMENT_TYPE', valueKey: 'WELCOME', displayLabel: 'Welcome / Arrival', sortOrder: 10, colorTag: '#87CEEB', isActive: true },
    { id: 'local-mt-2', groupKey: 'MOMENT_TYPE', valueKey: 'CEREMONY', displayLabel: 'Ceremony', sortOrder: 20, colorTag: '#E8B4B8', isActive: true },
    { id: 'local-mt-3', groupKey: 'MOMENT_TYPE', valueKey: 'DINING', displayLabel: 'Dining', sortOrder: 30, colorTag: '#C9A24A', isActive: true },
    { id: 'local-mt-4', groupKey: 'MOMENT_TYPE', valueKey: 'SOCIAL', displayLabel: 'Social / Drinks', sortOrder: 40, colorTag: '#DDA0DD', isActive: true },
    { id: 'local-mt-5', groupKey: 'MOMENT_TYPE', valueKey: 'ENTERTAINMENT', displayLabel: 'Entertainment', sortOrder: 50, colorTag: '#98FB98', isActive: true },
    { id: 'local-mt-6', groupKey: 'MOMENT_TYPE', valueKey: 'TRANSITION', displayLabel: 'Transition / Break', sortOrder: 60, colorTag: '#D3D3D3', isActive: true },
    { id: 'local-mt-7', groupKey: 'MOMENT_TYPE', valueKey: 'MAIN', displayLabel: 'Main Event', sortOrder: 70, colorTag: '#FFD700', isActive: true },
    { id: 'local-mt-8', groupKey: 'MOMENT_TYPE', valueKey: 'AFTER_PARTY', displayLabel: 'After Party', sortOrder: 80, colorTag: '#FF69B4', isActive: true },
    { id: 'local-mt-9', groupKey: 'MOMENT_TYPE', valueKey: 'OTHER', displayLabel: 'Other', sortOrder: 999, colorTag: '#999999', isActive: true },
  ],
  SPACE_TYPE: [
    { id: 'local-st-1', groupKey: 'SPACE_TYPE', valueKey: 'BALLROOM', displayLabel: 'Ballroom', sortOrder: 10, colorTag: '#DAA520', isActive: true },
    { id: 'local-st-2', groupKey: 'SPACE_TYPE', valueKey: 'GARDEN', displayLabel: 'Garden', sortOrder: 20, colorTag: '#228B22', isActive: true },
    { id: 'local-st-3', groupKey: 'SPACE_TYPE', valueKey: 'TERRACE', displayLabel: 'Terrace', sortOrder: 30, colorTag: '#87CEEB', isActive: true },
    { id: 'local-st-4', groupKey: 'SPACE_TYPE', valueKey: 'BEACH', displayLabel: 'Beach', sortOrder: 40, colorTag: '#F4A460', isActive: true },
    { id: 'local-st-5', groupKey: 'SPACE_TYPE', valueKey: 'COURTYARD', displayLabel: 'Courtyard', sortOrder: 50, colorTag: '#DEB887', isActive: true },
    { id: 'local-st-6', groupKey: 'SPACE_TYPE', valueKey: 'DINING_ROOM', displayLabel: 'Dining Room', sortOrder: 60, colorTag: '#CD853F', isActive: true },
    { id: 'local-st-7', groupKey: 'SPACE_TYPE', valueKey: 'CHAPEL', displayLabel: 'Chapel', sortOrder: 70, colorTag: '#E8B4B8', isActive: true },
    { id: 'local-st-8', groupKey: 'SPACE_TYPE', valueKey: 'MARQUEE', displayLabel: 'Marquee / Tent', sortOrder: 80, colorTag: '#FAFAD2', isActive: true },
    { id: 'local-st-9', groupKey: 'SPACE_TYPE', valueKey: 'ROOFTOP', displayLabel: 'Rooftop', sortOrder: 90, colorTag: '#4682B4', isActive: true },
    { id: 'local-st-10', groupKey: 'SPACE_TYPE', valueKey: 'OTHER', displayLabel: 'Other', sortOrder: 999, colorTag: '#999999', isActive: true },
  ],
  PROGRAM_TEMPLATE: [
    { id: 'local-pt-1', groupKey: 'PROGRAM_TEMPLATE', valueKey: 'WELCOME_EVENT', displayLabel: 'Welcome Event', sortOrder: 10, colorTag: null, isActive: true },
    { id: 'local-pt-2', groupKey: 'PROGRAM_TEMPLATE', valueKey: 'MAIN_EVENT', displayLabel: 'Main Event', sortOrder: 20, colorTag: null, isActive: true },
    { id: 'local-pt-3', groupKey: 'PROGRAM_TEMPLATE', valueKey: 'MORNING_AFTER', displayLabel: 'Morning After', sortOrder: 30, colorTag: null, isActive: true },
    { id: 'local-pt-4', groupKey: 'PROGRAM_TEMPLATE', valueKey: 'REHEARSAL', displayLabel: 'Rehearsal', sortOrder: 40, colorTag: null, isActive: true },
    { id: 'local-pt-5', groupKey: 'PROGRAM_TEMPLATE', valueKey: 'PRE_EVENT', displayLabel: 'Pre-Event', sortOrder: 50, colorTag: null, isActive: true },
    { id: 'local-pt-6', groupKey: 'PROGRAM_TEMPLATE', valueKey: 'POST_EVENT', displayLabel: 'Post-Event', sortOrder: 60, colorTag: null, isActive: true },
    { id: 'local-pt-7', groupKey: 'PROGRAM_TEMPLATE', valueKey: 'OTHER', displayLabel: 'Other', sortOrder: 999, colorTag: null, isActive: true },
  ],
  VENUE_TYPE: [
    { id: 'local-vt-1', groupKey: 'VENUE_TYPE', valueKey: 'HOTEL', displayLabel: 'Hotel', sortOrder: 10, colorTag: null, isActive: true },
    { id: 'local-vt-2', groupKey: 'VENUE_TYPE', valueKey: 'WINE_ESTATE', displayLabel: 'Wine Estate', sortOrder: 20, colorTag: null, isActive: true },
    { id: 'local-vt-3', groupKey: 'VENUE_TYPE', valueKey: 'PRIVATE_HOME', displayLabel: 'Private Home', sortOrder: 30, colorTag: null, isActive: true },
    { id: 'local-vt-4', groupKey: 'VENUE_TYPE', valueKey: 'RESTAURANT', displayLabel: 'Restaurant', sortOrder: 40, colorTag: null, isActive: true },
    { id: 'local-vt-5', groupKey: 'VENUE_TYPE', valueKey: 'BEACH', displayLabel: 'Beach', sortOrder: 50, colorTag: null, isActive: true },
    { id: 'local-vt-6', groupKey: 'VENUE_TYPE', valueKey: 'CASTLE', displayLabel: 'Castle / Estate', sortOrder: 60, colorTag: null, isActive: true },
    { id: 'local-vt-7', groupKey: 'VENUE_TYPE', valueKey: 'OTHER', displayLabel: 'Other', sortOrder: 999, colorTag: null, isActive: true },
  ],
  UNIT_TYPE: [
    { id: 'local-ut-1', groupKey: 'UNIT_TYPE', valueKey: 'EACH', displayLabel: 'Each', sortOrder: 10, colorTag: null, isActive: true },
    { id: 'local-ut-2', groupKey: 'UNIT_TYPE', valueKey: 'SET', displayLabel: 'Set', sortOrder: 20, colorTag: null, isActive: true },
    { id: 'local-ut-3', groupKey: 'UNIT_TYPE', valueKey: 'METER', displayLabel: 'Meter', sortOrder: 30, colorTag: null, isActive: true },
    { id: 'local-ut-4', groupKey: 'UNIT_TYPE', valueKey: 'HOUR', displayLabel: 'Hour', sortOrder: 40, colorTag: null, isActive: true },
    { id: 'local-ut-5', groupKey: 'UNIT_TYPE', valueKey: 'PACKAGE', displayLabel: 'Package', sortOrder: 50, colorTag: null, isActive: true },
    { id: 'local-ut-6', groupKey: 'UNIT_TYPE', valueKey: 'PER_HEAD', displayLabel: 'Per Head', sortOrder: 60, colorTag: null, isActive: true },
    { id: 'local-ut-7', groupKey: 'UNIT_TYPE', valueKey: 'OTHER', displayLabel: 'Other', sortOrder: 999, colorTag: null, isActive: true },
  ],
};

// ─── Cache ───────────────────────────────────────────────────────────────────

const optionCache: Record<string, { data: OptionItem[]; fetchedAt: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useConfigOptions(groupKey: string): {
  options: OptionItem[];
  loading: boolean;
  allowCustom: boolean;
  getLabel: (valueKey: string) => string;
  getColor: (valueKey: string) => string | null;
  makeSelection: (valueKey: string, customLabel?: string) => ConfigOptionSelection;
} {
  const [options, setOptions] = useState<OptionItem[]>(() => {
    // Return cached or local defaults immediately
    if (optionCache[groupKey] && Date.now() - optionCache[groupKey].fetchedAt < CACHE_TTL) {
      return optionCache[groupKey].data;
    }
    return LOCAL_DEFAULTS[groupKey] || [];
  });
  const [loading, setLoading] = useState(false);
  const [allowCustom, setAllowCustom] = useState(true);

  useEffect(() => {
    // Check cache first
    if (optionCache[groupKey] && Date.now() - optionCache[groupKey].fetchedAt < CACHE_TTL) {
      setOptions(optionCache[groupKey].data);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data, error } = await supabase
          .from('option_items')
          .select('*')
          .eq('group_key', groupKey)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error || !data || data.length === 0) {
          // Fall back to local defaults
          if (!cancelled) {
            setOptions(LOCAL_DEFAULTS[groupKey] || []);
          }
          return;
        }

        const mapped: OptionItem[] = data.map((row: any) => ({
          id: row.id,
          groupKey: row.group_key,
          valueKey: row.value_key,
          displayLabel: row.display_label,
          sortOrder: row.sort_order,
          colorTag: row.color_tag,
          isActive: row.is_active,
        }));

        optionCache[groupKey] = { data: mapped, fetchedAt: Date.now() };

        if (!cancelled) {
          setOptions(mapped);
        }
      } catch {
        if (!cancelled) {
          setOptions(LOCAL_DEFAULTS[groupKey] || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [groupKey]);

  const getLabel = useCallback((valueKey: string): string => {
    const found = options.find(o => o.valueKey === valueKey);
    return found?.displayLabel || valueKey;
  }, [options]);

  const getColor = useCallback((valueKey: string): string | null => {
    const found = options.find(o => o.valueKey === valueKey);
    return found?.colorTag || null;
  }, [options]);

  const makeSelection = useCallback((valueKey: string, customLabel?: string): ConfigOptionSelection => {
    const found = options.find(o => o.valueKey === valueKey);
    if (found) {
      return {
        optionId: found.id,
        valueKey: found.valueKey,
        displayLabel: found.displayLabel,
        isCustom: false,
      };
    }
    // Custom / Other
    return {
      optionId: '',
      valueKey: valueKey || 'CUSTOM',
      displayLabel: customLabel || valueKey,
      isCustom: true,
    };
  }, [options]);

  return { options, loading, allowCustom, getLabel, getColor, makeSelection };
}

// ─── Utility: Get display name for event ─────────────────────────────────────

export function getEventDisplayName(event: {
  name?: string;
  companyName?: string;
  divisionName?: string;
  eventTitle?: string;
}): string {
  if (event.companyName) {
    const parts = [event.companyName, event.divisionName, event.eventTitle].filter(Boolean);
    if (parts.length > 1) return parts.join(' — ');
    if (parts.length === 1) return parts[0];
  }
  return event.name || 'Untitled Event';
}
