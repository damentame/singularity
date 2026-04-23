import React, { useState } from 'react';
import {
  X, Plus, MapPin, Palette, AlertTriangle, Shield, Eye, FileText,
  ChevronDown, ChevronRight, Trash2, CheckCircle2, Clock, Pencil
} from 'lucide-react';
import {
  useEventContext,
  PlannerEvent,
  CostLineItem,
  LineItemSpec,
  SpecStatus,
  SPEC_STATUS_LABELS,
  createEmptySpec,
} from '@/contexts/EventContext';

const GOLD = '#C9A24A';

interface LineItemSpecEditorProps {
  event: PlannerEvent;
  lineItem: CostLineItem;
  onClose: () => void;
}

const SPEC_STATUS_COLORS: Record<SpecStatus, string> = {
  DRAFT: '#9CA3AF',
  CONFIRMED: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  FINAL: '#22C55E',
};

const LineItemSpecEditor: React.FC<LineItemSpecEditorProps> = ({ event, lineItem, onClose }) => {
  const { addSpec, updateSpec, removeSpec, getSpecsForItem, updateLineItem } = useEventContext();
  const specs = getSpecsForItem(event, lineItem.id);
  const [expandedSpec, setExpandedSpec] = useState<string | null>(specs.length > 0 ? specs[0].id : null);

  const venueSpaces = event.venueSpaces || [];
  const programs = event.programs || [];

  const handleAddSpec = () => {
    const newSpec = createEmptySpec(lineItem.id);
    const id = addSpec(event.id, newSpec);
    setExpandedSpec(id);
  };

  const handleRemoveSpec = (specId: string) => {
    removeSpec(event.id, specId);
    if (expandedSpec === specId) setExpandedSpec(null);
  };

  const SpecField: React.FC<{
    label: string;
    icon: React.ReactNode;
    value: string;
    onChange: (v: string) => void;
    multiline?: boolean;
    placeholder?: string;
    accentColor?: string;
  }> = ({ label, icon, value, onChange, multiline, placeholder, accentColor }) => (
    <div className="mb-3">
      <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium mb-1.5" style={{ color: accentColor || '#888' }}>
        {icon}
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border text-xs outline-none resize-none transition-colors focus:ring-1"
          style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
          onFocus={(e) => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 1px ${GOLD}20`; }}
          onBlur={(e) => { e.target.style.borderColor = '#EFEFEF'; e.target.style.boxShadow = 'none'; }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
          className="w-full px-3 py-2 rounded-lg border text-xs outline-none transition-colors"
          style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
          onFocus={(e) => { e.target.style.borderColor = GOLD; }}
          onBlur={(e) => { e.target.style.borderColor = '#EFEFEF'; }}
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
        style={{ border: '1px solid rgba(201,162,74,0.15)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
              Specifications & Operational Notes
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {lineItem.name} · Qty {lineItem.quantity}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Internal + Client Notes (on the line item itself) */}
        <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(201,162,74,0.08)', backgroundColor: '#FAFAF7' }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium mb-1.5" style={{ color: '#F59E0B' }}>
                <Eye className="w-3 h-3" /> Internal Notes (Planner Only)
              </label>
              <textarea
                value={lineItem.internalNotes || ''}
                onChange={(e) => updateLineItem(event.id, lineItem.id, { internalNotes: e.target.value })}
                placeholder="Notes visible only to the planning team..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border text-xs outline-none resize-none"
                style={{ borderColor: '#EFEFEF', color: '#1A1A1A', backgroundColor: '#FFFBEB' }}
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium mb-1.5" style={{ color: '#3B82F6' }}>
                <FileText className="w-3 h-3" /> Client-Visible Notes
              </label>
              <textarea
                value={lineItem.clientVisibleNotes || ''}
                onChange={(e) => updateLineItem(event.id, lineItem.id, { clientVisibleNotes: e.target.value })}
                placeholder="Polished summary for the client proposal..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border text-xs outline-none resize-none"
                style={{ borderColor: '#EFEFEF', color: '#1A1A1A', backgroundColor: '#EFF6FF' }}
              />
            </div>
          </div>
        </div>

        {/* Specs List */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
              Placement Specifications ({specs.length})
            </span>
            <button
              onClick={handleAddSpec}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all hover:shadow-sm"
              style={{ borderColor: 'rgba(201,162,74,0.2)', color: GOLD }}
            >
              <Plus className="w-3 h-3" /> Add Spec
            </button>
          </div>

          {specs.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(201,162,74,0.2)' }} />
              <p className="text-xs text-gray-400">No specifications yet.</p>
              <p className="text-[10px] text-gray-300 mt-1">Add a spec to define placement, visual brief, and constraints.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {specs.map((spec, idx) => {
                const isExpanded = expandedSpec === spec.id;
                const statusColor = SPEC_STATUS_COLORS[spec.status];

                return (
                  <div key={spec.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
                    {/* Spec Header */}
                    <button
                      onClick={() => setExpandedSpec(isExpanded ? null : spec.id)}
                      className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-black/[0.02]"
                      style={{ backgroundColor: isExpanded ? '#FAFAF7' : '#FFF' }}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" style={{ color: GOLD }} />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" style={{ color: GOLD }} />
                        )}
                        <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>
                          {spec.placementLabel || `Spec ${idx + 1}`}
                        </span>
                        {spec.venueSpaceId && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(201,162,74,0.06)', color: GOLD }}>
                            {venueSpaces.find(s => s.id === spec.venueSpaceId)?.name || 'Space'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
                        >
                          {SPEC_STATUS_LABELS[spec.status]}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveSpec(spec.id); }}
                          className="p-1 rounded hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-gray-300 hover:text-red-400" />
                        </button>
                      </div>
                    </button>

                    {/* Spec Body */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 space-y-0">
                        {/* Status + Program + Space Row */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Status</label>
                            <select
                              value={spec.status}
                              onChange={(e) => updateSpec(event.id, spec.id, { status: e.target.value as SpecStatus })}
                              className="w-full h-8 text-xs rounded-lg border px-2 outline-none"
                              style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
                            >
                              {Object.entries(SPEC_STATUS_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Program</label>
                            <select
                              value={spec.programId || ''}
                              onChange={(e) => updateSpec(event.id, spec.id, { programId: e.target.value })}
                              className="w-full h-8 text-xs rounded-lg border px-2 outline-none"
                              style={{ borderColor: '#EFEFEF', color: spec.programId ? '#1A1A1A' : '#999' }}
                            >
                              <option value="">Overall Event</option>
                              {programs.map(p => <option key={p.id} value={p.id}>{p.programName}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Venue Space</label>
                            <select
                              value={spec.venueSpaceId || ''}
                              onChange={(e) => updateSpec(event.id, spec.id, { venueSpaceId: e.target.value })}
                              className="w-full h-8 text-xs rounded-lg border px-2 outline-none"
                              style={{ borderColor: '#EFEFEF', color: spec.venueSpaceId ? '#1A1A1A' : '#999' }}
                            >
                              <option value="">Unassigned</option>
                              {venueSpaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Placement */}
                        <SpecField
                          label="Placement Label"
                          icon={<MapPin className="w-3 h-3" />}
                          value={spec.placementLabel}
                          onChange={(v) => updateSpec(event.id, spec.id, { placementLabel: v })}
                          placeholder="e.g. Garden entrance table, Stage left"
                          accentColor="#8B5CF6"
                        />
                        <SpecField
                          label="Placement Details"
                          icon={<MapPin className="w-3 h-3" />}
                          value={spec.placementDetails}
                          onChange={(v) => updateSpec(event.id, spec.id, { placementDetails: v })}
                          multiline
                          placeholder="Exact placement and setup instructions..."
                          accentColor="#8B5CF6"
                        />

                        {/* Visual Brief */}
                        <SpecField
                          label="Visual Brief"
                          icon={<Palette className="w-3 h-3" />}
                          value={spec.visualBrief}
                          onChange={(v) => updateSpec(event.id, spec.id, { visualBrief: v })}
                          multiline
                          placeholder="What it should look like, style notes, colours..."
                          accentColor="#EC4899"
                        />

                        {/* Exclusions */}
                        <SpecField
                          label="Exclusions"
                          icon={<AlertTriangle className="w-3 h-3" />}
                          value={spec.exclusions}
                          onChange={(v) => updateSpec(event.id, spec.id, { exclusions: v })}
                          multiline
                          placeholder='e.g. "No fragrant flowers near food stations"'
                          accentColor="#EF4444"
                        />

                        {/* Cultural Constraints */}
                        <SpecField
                          label="Cultural / Religious Constraints"
                          icon={<Shield className="w-3 h-3" />}
                          value={spec.culturalConstraints}
                          onChange={(v) => updateSpec(event.id, spec.id, { culturalConstraints: v })}
                          multiline
                          placeholder='e.g. "No chrysanthemums — funeral symbolism"'
                          accentColor="#F59E0B"
                        />

                        {/* Safety Constraints */}
                        <SpecField
                          label="Safety Constraints"
                          icon={<AlertTriangle className="w-3 h-3" />}
                          value={spec.safetyConstraints}
                          onChange={(v) => updateSpec(event.id, spec.id, { safetyConstraints: v })}
                          multiline
                          placeholder='e.g. "No open flames — venue restriction"'
                          accentColor="#DC2626"
                        />

                        {/* Supplier Notes */}
                        <SpecField
                          label="Supplier Notes"
                          icon={<FileText className="w-3 h-3" />}
                          value={spec.supplierNotes}
                          onChange={(v) => updateSpec(event.id, spec.id, { supplierNotes: v })}
                          multiline
                          placeholder="What the supplier must know..."
                          accentColor="#059669"
                        />

                        {/* Internal Notes */}
                        <SpecField
                          label="Internal Notes (Planner Only)"
                          icon={<Eye className="w-3 h-3" />}
                          value={spec.internalNotes}
                          onChange={(v) => updateSpec(event.id, spec.id, { internalNotes: v })}
                          multiline
                          placeholder="Private notes for the planning team..."
                          accentColor="#F59E0B"
                        />

                        {/* Client Visible Notes */}
                        <SpecField
                          label="Client-Visible Notes"
                          icon={<FileText className="w-3 h-3" />}
                          value={spec.clientVisibleNotes}
                          onChange={(v) => updateSpec(event.id, spec.id, { clientVisibleNotes: v })}
                          multiline
                          placeholder="Polished summary for the client..."
                          accentColor="#3B82F6"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t" style={{ borderColor: 'rgba(201,162,74,0.12)', backgroundColor: '#FAFAF7' }}>
          <span className="text-[10px] text-gray-400">
            {specs.length} spec{specs.length !== 1 ? 's' : ''} · Changes save automatically
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium"
            style={{ backgroundColor: GOLD, color: '#FFF' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default LineItemSpecEditor;
