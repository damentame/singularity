import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PlannerEvent } from '@/contexts/EventContext';

export interface TemplateSummary {
  id: number;
  template_id: string;
  name: string;
  description: string;
  event_type: string;
  category: string;
  guest_count: number;
  country: string;
  currency: string;
  moments_count: number;
  line_items_count: number;
  total_estimated_cost: number;
  is_public: boolean;
  use_count: number;
  source_event_id: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateData {
  moments: any[];
  lineItems: any[];
  venueSpaces: any[];
  programs: any[];
  specs: any[];
  tasks: any[];
  backupVenueSpaces: any[];
  eventType: string;
  venueType: string;
  guestCount: number;
  currency: string;
  vatRate: number;
  vatName: string;
  defaultPricesIncludeVat: boolean;
}

const getDeviceId = (): string => {
  let id = localStorage.getItem('theone_device_id');
  if (!id) {
    id = 'dev-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('theone_device_id', id);
  }
  return id;
};

/**
 * Strips client-specific data from an event and extracts the reusable template structure.
 */
export function extractTemplateData(event: PlannerEvent): TemplateData {
  // Strip client-specific data from line items
  const cleanLineItems = event.lineItems.map(li => ({
    name: li.name,
    category: li.category,
    quantity: li.quantity,
    isGuestDependent: li.isGuestDependent,
    guestRatio: li.guestRatio,
    unitCost: li.unitCost,
    setupCost: li.setupCost,
    breakdownCost: li.breakdownCost,
    deliveryCost: li.deliveryCost,
    deliveryType: li.deliveryType,
    markupPercent: li.markupPercent,
    notes: li.notes,
    momentId: li.momentId,
    timeType: li.timeType,
    imageUrl: li.imageUrl,
    productId: li.productId,
    programId: li.programId,
    internalNotes: '', // Strip internal notes
    clientVisibleNotes: '', // Strip client notes
    supplierPriceIncludesVat: li.supplierPriceIncludesVat,
    vatRateUsed: li.vatRateUsed,
    isDryHire: li.isDryHire,
  }));

  // Strip client-specific data from moments
  const cleanMoments = (event.moments || []).map(m => ({
    name: m.name,
    momentType: m.momentType,
    momentTypeOption: m.momentTypeOption,
    date: '', // Strip specific date
    startTime: m.startTime,
    endTime: m.endTime,
    venueSpaceId: m.venueSpaceId,
    backupVenueSpaceId: m.backupVenueSpaceId,
    notes: '', // Strip notes
    programId: m.programId,
    parentMomentId: m.parentMomentId,
    sortOrder: m.sortOrder,
  }));

  // Clean venue spaces
  const cleanVenueSpaces = (event.venueSpaces || []).map(vs => ({
    name: vs.name,
    notes: '', // Strip notes
    capacity: vs.capacity,
    spaceType: vs.spaceType,
  }));

  // Clean programs
  const cleanPrograms = (event.programs || []).map(p => ({
    programName: p.programName,
    programTemplate: p.programTemplate,
    programDate: '', // Strip specific date
    sortOrder: p.sortOrder,
    venuePropertyName: p.venuePropertyName,
    primaryVenueSpaceIds: p.primaryVenueSpaceIds,
    backupVenuePropertyName: p.backupVenuePropertyName,
    backupVenueSpaceIds: p.backupVenueSpaceIds,
    notes: '', // Strip notes
    status: 'active' as const,
  }));

  // Clean specs (strip client-specific content)
  const cleanSpecs = (event.specs || []).map(s => ({
    ownerType: s.ownerType,
    ownerId: s.ownerId,
    programId: s.programId,
    venueSpaceId: s.venueSpaceId,
    placementLabel: s.placementLabel,
    placementDetails: '', // Strip
    visualBrief: s.visualBrief,
    exclusions: s.exclusions,
    culturalConstraints: '',
    safetyConstraints: s.safetyConstraints,
    supplierNotes: '', // Strip
    internalNotes: '', // Strip
    clientVisibleNotes: '', // Strip
    referenceAssetIds: [],
    floorplanAssetIds: [],
    status: 'DRAFT' as const,
  }));

  // Clean tasks (keep structure, strip assignments)
  const cleanTasks = (event.tasks || []).map(t => ({
    linkedType: t.linkedType,
    linkedId: t.linkedId,
    title: t.title,
    description: t.description,
    assignedTo: '', // Strip assignment
    dueAt: '', // Strip specific date
    status: 'TODO' as const,
    tags: t.tags,
  }));

  return {
    moments: cleanMoments,
    lineItems: cleanLineItems,
    venueSpaces: cleanVenueSpaces,
    programs: cleanPrograms,
    specs: cleanSpecs,
    tasks: cleanTasks,
    backupVenueSpaces: (event.backupVenueSpaces || []).map(vs => ({
      name: vs.name,
      notes: '',
      capacity: vs.capacity,
      spaceType: vs.spaceType,
    })),
    eventType: event.eventType,
    venueType: event.venueType,
    guestCount: event.guestCount,
    currency: event.currency,
    vatRate: event.vatRate,
    vatName: event.vatName,
    defaultPricesIncludeVat: event.defaultPricesIncludeVat,
  };
}

export function useTemplatePersistence() {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // List templates
  const loadTemplates = useCallback(async (eventType?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('manage-templates', {
        body: { action: 'list', deviceId: getDeviceId(), eventType, includePublic: true },
      });
      if (data?.success && data.templates) {
        setTemplates(data.templates);
        return data.templates as TemplateSummary[];
      } else {
        setError(data?.error || 'Failed to load templates');
        return [];
      }
    } catch (e: any) {
      setError(e.message);
      console.error('Failed to load templates:', e);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save a template
  const saveTemplate = useCallback(async (
    event: PlannerEvent,
    name: string,
    description: string,
    category: string,
    isPublic: boolean,
    calculateSummary: (items: any[]) => any,
  ): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    try {
      const templateData = extractTemplateData(event);
      const summary = calculateSummary(event.lineItems);

      const { data, error: fnError } = await supabase.functions.invoke('manage-templates', {
        body: {
          action: 'save',
          deviceId: getDeviceId(),
          templateData,
          metadata: {
            name,
            description,
            eventType: event.eventType,
            category,
            guestCount: event.guestCount,
            country: event.country,
            currency: event.currency,
            momentsCount: (event.moments || []).length,
            lineItemsCount: event.lineItems.length,
            totalEstimatedCost: summary.totalClientPrice || 0,
            isPublic,
            sourceEventId: event.id,
          },
        },
      });

      if (data?.success) {
        return true;
      } else {
        setError(data?.error || 'Failed to save template');
        return false;
      }
    } catch (e: any) {
      setError(e.message);
      console.error('Failed to save template:', e);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Load full template data
  const loadTemplateData = useCallback(async (templateId: string): Promise<TemplateData | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('manage-templates', {
        body: { action: 'load', templateId, deviceId: getDeviceId() },
      });
      if (data?.success && data.template?.template_data) {
        // Increment use count in background
        supabase.functions.invoke('manage-templates', {
          body: { action: 'use', templateId, deviceId: getDeviceId() },
        }).catch(() => {});
        
        return data.template.template_data as TemplateData;
      }
    } catch (e: any) {
      console.error('Failed to load template data:', e);
    }
    return null;
  }, []);

  // Delete a template
  const deleteTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    try {
      const { data } = await supabase.functions.invoke('manage-templates', {
        body: { action: 'delete', templateId, deviceId: getDeviceId() },
      });
      if (data?.success) {
        setTemplates(prev => prev.filter(t => t.template_id !== templateId));
        return true;
      }
    } catch (e: any) {
      console.error('Failed to delete template:', e);
    }
    return false;
  }, []);

  return {
    templates,
    isLoading,
    isSaving,
    error,
    loadTemplates,
    saveTemplate,
    loadTemplateData,
    deleteTemplate,
  };
}
