import React, { useState, useEffect } from 'react';
import {
  X, BookTemplate, Save, Tag, Globe, Lock, FileText, Layers, Users,
  DollarSign, MapPin, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';
import { PlannerEvent, getEventDisplayName, EVENT_TYPE_LABELS } from '@/contexts/EventContext';
import { useTemplatePersistence, extractTemplateData } from '@/hooks/useTemplatePersistence';
import { toast } from '@/components/ui/use-toast';

const GOLD = '#C9A24A';

const TEMPLATE_CATEGORIES = [
  { value: 'custom', label: 'Custom Template' },
  { value: 'wedding_classic', label: 'Classic Wedding' },
  { value: 'wedding_modern', label: 'Modern Wedding' },
  { value: 'wedding_destination', label: 'Destination Wedding' },
  { value: 'wedding_intimate', label: 'Intimate Wedding' },
  { value: 'corporate_conference', label: 'Conference' },
  { value: 'corporate_gala', label: 'Gala Dinner' },
  { value: 'corporate_teambuilding', label: 'Team Building' },
  { value: 'corporate_launch', label: 'Product Launch' },
  { value: 'celebration_birthday', label: 'Birthday Party' },
  { value: 'celebration_anniversary', label: 'Anniversary' },
  { value: 'celebration_holiday', label: 'Holiday Event' },
  { value: 'celebration_graduation', label: 'Graduation' },
];

interface SaveAsTemplateModalProps {
  open: boolean;
  onClose: () => void;
  event: PlannerEvent;
  calculateSummary: (items: any[]) => any;
}

const SaveAsTemplateModal: React.FC<SaveAsTemplateModalProps> = ({
  open,
  onClose,
  event,
  calculateSummary,
}) => {
  const { saveTemplate, isSaving } = useTemplatePersistence();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('custom');
  const [isPublic, setIsPublic] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (open) {
      const eventName = getEventDisplayName(event);
      setName(`${eventName} Template`);
      setDescription('');
      setCategory('custom');
      setIsPublic(false);
      setShowPreview(false);
    }
  }, [open, event]);

  if (!open) return null;

  const templatePreview = extractTemplateData(event);
  const summary = calculateSummary(event.lineItems);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Name Required', description: 'Please enter a template name.', variant: 'destructive' });
      return;
    }
    const success = await saveTemplate(event, name.trim(), description.trim(), category, isPublic, calculateSummary);
    if (success) {
      toast({
        title: 'Template Saved',
        description: `"${name.trim()}" has been saved as a reusable template.`,
      });
      onClose();
    } else {
      toast({
        title: 'Save Failed',
        description: 'Could not save template. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const categoryLabels = Object.fromEntries(TEMPLATE_CATEGORIES.map(c => [c.value, c.label]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slideUp"
        onClick={(e) => e.stopPropagation()}
        style={{ border: '1px solid rgba(201,162,74,0.15)' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b px-6 py-4 flex items-center justify-between z-10" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}>
              <BookTemplate className="w-5 h-5" style={{ color: GOLD }} />
            </div>
            <div>
              <h2 className="text-lg font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
                Save as Template
              </h2>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                Create a reusable event template
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* What gets saved info */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(201,162,74,0.04)', border: '1px solid rgba(201,162,74,0.1)' }}>
            <div className="flex items-start gap-2 mb-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: GOLD }} />
              <div>
                <p className="text-xs font-medium" style={{ color: '#1A1A1A' }}>What gets saved in the template:</p>
                <p className="text-[10px] text-gray-500 mt-1">
                  Event structure (moments, line items, venue spaces, programs) will be saved.
                  Client-specific data (names, emails, notes, dates) will be stripped for privacy.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                <Layers className="w-3 h-3" style={{ color: GOLD }} />
                <span>{templatePreview.moments.length} moments</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                <FileText className="w-3 h-3" style={{ color: GOLD }} />
                <span>{templatePreview.lineItems.length} line items</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                <Users className="w-3 h-3" style={{ color: GOLD }} />
                <span>{event.guestCount} guests</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                <DollarSign className="w-3 h-3" style={{ color: GOLD }} />
                <span>{event.currency} {Math.round(summary.totalClientPrice).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Template Name */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] mb-1.5" style={{ color: GOLD, fontWeight: 600 }}>
              Template Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Classic 100-Guest Wedding"
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
              style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = GOLD; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = '#E5E5E5'; }}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] mb-1.5" style={{ color: GOLD, fontWeight: 600 }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this template includes and when to use it..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors resize-none"
              style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = GOLD; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = '#E5E5E5'; }}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] mb-1.5" style={{ color: GOLD, fontWeight: 600 }}>
              <Tag className="w-3 h-3 inline mr-1" />
              Category
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors appearance-none bg-white pr-8"
                style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
              >
                {TEMPLATE_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: '#FAFAF7', border: '1px solid rgba(201,162,74,0.08)' }}>
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="w-4 h-4" style={{ color: GOLD }} />
              ) : (
                <Lock className="w-4 h-4 text-gray-400" />
              )}
              <div>
                <p className="text-xs font-medium" style={{ color: '#1A1A1A' }}>
                  {isPublic ? 'Public Template' : 'Private Template'}
                </p>
                <p className="text-[10px] text-gray-400">
                  {isPublic
                    ? 'Other team members can use this template'
                    : 'Only you can see and use this template'
                  }
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className="relative w-10 h-5 rounded-full transition-colors"
              style={{ backgroundColor: isPublic ? GOLD : '#D1D5DB' }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                style={{ left: isPublic ? '22px' : '2px' }}
              />
            </button>
          </div>

          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="w-full text-left text-[10px] uppercase tracking-wider font-medium py-2 transition-colors"
            style={{ color: GOLD }}
          >
            {showPreview ? 'Hide' : 'Show'} Template Preview
          </button>

          {showPreview && (
            <div className="p-4 rounded-xl border space-y-3 max-h-60 overflow-y-auto" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Event Type</p>
                <p className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{EVENT_TYPE_LABELS[event.eventType]}</p>
              </div>
              {templatePreview.moments.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Moments / Sub-Events</p>
                  <div className="space-y-1">
                    {templatePreview.moments.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GOLD }} />
                        <span style={{ color: '#1A1A1A' }}>{m.name}</span>
                        {m.startTime && <span className="text-gray-400 text-[10px]">{m.startTime}{m.endTime ? ` - ${m.endTime}` : ''}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {templatePreview.lineItems.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Line Items ({templatePreview.lineItems.length})</p>
                  <div className="space-y-0.5 max-h-32 overflow-y-auto">
                    {templatePreview.lineItems.slice(0, 10).map((li, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-600 truncate">{li.name}</span>
                        <span className="text-gray-400 flex-shrink-0 ml-2">x{li.quantity}</span>
                      </div>
                    ))}
                    {templatePreview.lineItems.length > 10 && (
                      <p className="text-[10px] text-gray-400 italic">
                        +{templatePreview.lineItems.length - 10} more items...
                      </p>
                    )}
                  </div>
                </div>
              )}
              {templatePreview.venueSpaces.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Venue Spaces</p>
                  <div className="flex flex-wrap gap-1">
                    {templatePreview.venueSpaces.map((vs, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}>
                        {vs.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium uppercase tracking-wider transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: GOLD, color: '#FFF' }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Template
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveAsTemplateModal;
