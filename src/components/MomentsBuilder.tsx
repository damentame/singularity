import React, { useState } from 'react';
import { Plus, Trash2, Clock, ChevronDown, GripVertical, CalendarDays, CornerDownRight, Layers } from 'lucide-react';
import {
  useEventContext,
  PlannerEvent,
  EventMoment,
  MOMENT_PRESETS,
  MomentType,
  MOMENT_TYPE_LABELS,
} from '@/contexts/EventContext';
import { useConfigOptions } from '@/hooks/useConfigOptions';

const GOLD = '#C9A24A';

interface MomentsBuilderProps {
  event: PlannerEvent;
}

// Helper to infer moment type from name
const inferMomentType = (name: string): MomentType => {
  const n = name.toLowerCase();
  if (n.includes('welcome') || n.includes('drinks reception')) return 'welcome_drinks';
  if (n.includes('ceremony')) return 'ceremony';
  if (n.includes('cocktail')) return 'cocktail_hour';
  if (n.includes('reception')) return 'reception';
  if (n.includes('dinner') || n.includes('main event')) return 'dinner';
  if (n.includes('after')) return 'after_party';
  if (n.includes('breakfast')) return 'breakfast';
  return 'other';
};

const MomentsBuilder: React.FC<MomentsBuilderProps> = ({ event }) => {
  const { addMoment, updateMoment, removeMoment } = useEventContext();
  const [addingMoment, setAddingMoment] = useState(false);
  const [newMomentName, setNewMomentName] = useState('');
  const [newMomentType, setNewMomentType] = useState<MomentType>('other');
  const [newVenueSpaceId, setNewVenueSpaceId] = useState('');
  const [newProgramId, setNewProgramId] = useState('');
  const [newParentMomentId, setNewParentMomentId] = useState('');
  const [customName, setCustomName] = useState('');

  const { options: momentTypeOptions } = useConfigOptions('MOMENT_TYPE');

  const moments = event.moments || [];
  const venueSpaces = event.venueSpaces || [];
  const programs = event.programs || [];

  // Group moments: top-level (no parentMomentId) and sub-moments
  const topLevelMoments = moments
    .filter(m => !m.parentMomentId)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const getSubMoments = (parentId: string) =>
    moments
      .filter(m => m.parentMomentId === parentId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // Group by program
  const programGroups: { programId: string; programName: string; moments: EventMoment[] }[] = [];
  
  if (programs.length > 0) {
    // Moments assigned to programs
    programs.forEach(prog => {
      const progMoments = topLevelMoments.filter(m => m.programId === prog.id);
      if (progMoments.length > 0) {
        programGroups.push({ programId: prog.id, programName: prog.programName, moments: progMoments });
      }
    });
    // Unassigned moments
    const unassigned = topLevelMoments.filter(m => !m.programId || !programs.find(p => p.id === m.programId));
    if (unassigned.length > 0) {
      programGroups.push({ programId: '', programName: 'Unassigned', moments: unassigned });
    }
  } else {
    // No programs — show all moments flat
    programGroups.push({ programId: '', programName: '', moments: topLevelMoments });
  }

  const handleAddMoment = () => {
    const name = newMomentName === 'Other' ? customName.trim() : newMomentName;
    if (!name) return;
    const maxSort = moments.reduce((max, m) => Math.max(max, m.sortOrder || 0), 0);
    addMoment(event.id, {
      name,
      momentType: newMomentType,
      date: event.date || '',
      startTime: '',
      endTime: '',
      venueSpaceId: newVenueSpaceId,
      backupVenueSpaceId: '',
      notes: '',
      programId: newProgramId,
      parentMomentId: newParentMomentId,
      sortOrder: maxSort + 10,
    });

    setNewMomentName('');
    setNewMomentType('other');
    setNewVenueSpaceId('');
    setNewProgramId('');
    setNewParentMomentId('');
    setCustomName('');
    setAddingMoment(false);
  };

  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
          <CalendarDays className="w-3.5 h-3.5 inline mr-1.5" />
          Moments / Schedule
        </h2>
        <span className="text-[10px] text-gray-300">
          {moments.length} moment{moments.length !== 1 ? 's' : ''}
          {programs.length > 0 && ` across ${programs.length} program${programs.length !== 1 ? 's' : ''}`}
        </span>
      </div>
      <div className="h-px mb-5" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />

      {moments.length === 0 && !addingMoment && (
        <p className="text-xs text-gray-300 text-center py-4 italic">
          No moments added yet. Add moments like Ceremony, Reception, After Party, etc.
        </p>
      )}

      {/* Moments List — grouped by program if programs exist */}
      {programGroups.map((group) => (
        <div key={group.programId || '_unassigned'} className="mb-4">
          {/* Program header (only if programs exist) */}
          {programs.length > 0 && (
            <div className="flex items-center gap-2 mb-2 mt-2">
              <Layers className="w-3 h-3" style={{ color: GOLD }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: group.programId ? GOLD : '#999' }}>
                {group.programName}
              </span>
              <div className="h-px flex-1" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />
            </div>
          )}

          <div className="space-y-2">
            {group.moments.map((moment, index) => (
              <React.Fragment key={moment.id}>
                <MomentRow
                  moment={moment}
                  index={index}
                  eventId={event.id}
                  eventDate={event.date}
                  venueSpaces={venueSpaces}
                  programs={programs}
                  momentTypeOptions={momentTypeOptions}
                  topLevelMoments={topLevelMoments}
                  onUpdate={(updates) => updateMoment(event.id, moment.id, updates)}
                  onRemove={() => removeMoment(event.id, moment.id)}
                  isSubMoment={false}
                />
                {/* Sub-moments */}
                {getSubMoments(moment.id).map((sub, si) => (
                  <MomentRow
                    key={sub.id}
                    moment={sub}
                    index={si}
                    eventId={event.id}
                    eventDate={event.date}
                    venueSpaces={venueSpaces}
                    programs={programs}
                    momentTypeOptions={momentTypeOptions}
                    topLevelMoments={topLevelMoments}
                    onUpdate={(updates) => updateMoment(event.id, sub.id, updates)}
                    onRemove={() => removeMoment(event.id, sub.id)}
                    isSubMoment={true}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}

      {/* Add Moment */}
      {addingMoment ? (
        <div className="p-4 rounded-xl border mt-4" style={{ borderColor: 'rgba(201,162,74,0.15)', backgroundColor: '#FAFAF7' }}>
          {/* Row 1: Moment Name + Moment Type (side by side) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1.5">Moment Name</label>
              <div className="relative">
                <select
                  value={newMomentName}
                  onChange={(e) => {
                    setNewMomentName(e.target.value);
                    if (e.target.value && e.target.value !== 'Other') {
                      setNewMomentType(inferMomentType(e.target.value));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border text-xs outline-none appearance-none bg-white pr-8"
                  style={{ borderColor: '#EFEFEF', color: newMomentName ? '#1A1A1A' : '#999' }}
                >
                  <option value="">Select moment...</option>
                  {MOMENT_PRESETS.map((preset) => (
                    <option key={preset} value={preset}>{preset}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1.5">Moment Type</label>
              <div className="relative">
                <select
                  value={newMomentType}
                  onChange={(e) => setNewMomentType(e.target.value as MomentType)}
                  className="w-full px-3 py-2 rounded-lg border text-xs outline-none appearance-none bg-white pr-8"
                  style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
                >
                  {(Object.keys(MOMENT_TYPE_LABELS) as MomentType[]).map((mt) => (
                    <option key={mt} value={mt}>{MOMENT_TYPE_LABELS[mt]}</option>
                  ))}
                  {/* Configurable types from DB */}
                  {momentTypeOptions
                    .filter(o => !Object.keys(MOMENT_TYPE_LABELS).includes(o.valueKey.toLowerCase()))
                    .map(o => (
                      <option key={o.id} value={o.valueKey.toLowerCase()}>{o.displayLabel}</option>
                    ))
                  }
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 2: Venue Space + Program + Parent Moment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            {newMomentName === 'Other' && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1.5">Custom Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddMoment(); }}
                  placeholder="Enter moment name..."
                  className="w-full px-3 py-2 rounded-lg border text-xs outline-none"
                  style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
                  autoFocus
                />
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1.5">Venue Space</label>
              <div className="relative">
                <select
                  value={newVenueSpaceId}
                  onChange={(e) => setNewVenueSpaceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-xs outline-none appearance-none bg-white pr-8"
                  style={{ borderColor: '#EFEFEF', color: newVenueSpaceId ? '#1A1A1A' : '#999' }}
                >
                  <option value="">Select space...</option>
                  {venueSpaces.map((space) => (
                    <option key={space.id} value={space.id}>{space.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Program assignment */}
            {programs.length > 0 && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1.5">
                  <Layers className="w-3 h-3 inline mr-0.5" />
                  Program
                </label>
                <div className="relative">
                  <select
                    value={newProgramId}
                    onChange={(e) => setNewProgramId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-xs outline-none appearance-none bg-white pr-8"
                    style={{ borderColor: '#EFEFEF', color: newProgramId ? '#1A1A1A' : '#999' }}
                  >
                    <option value="">No program</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.programName}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Sub-moment parent */}
            {topLevelMoments.length > 0 && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1.5">
                  <CornerDownRight className="w-3 h-3 inline mr-0.5" />
                  Sub-moment of
                </label>
                <div className="relative">
                  <select
                    value={newParentMomentId}
                    onChange={(e) => setNewParentMomentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-xs outline-none appearance-none bg-white pr-8"
                    style={{ borderColor: '#EFEFEF', color: newParentMomentId ? '#1A1A1A' : '#999' }}
                  >
                    <option value="">Top-level moment</option>
                    {topLevelMoments.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddMoment}
              disabled={!newMomentName || (newMomentName === 'Other' && !customName.trim())}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
              style={{ backgroundColor: GOLD, color: '#FFF' }}
            >
              Add Moment
            </button>
            <button
              onClick={() => { setAddingMoment(false); setNewMomentName(''); setCustomName(''); setNewVenueSpaceId(''); setNewMomentType('other'); setNewProgramId(''); setNewParentMomentId(''); }}
              className="px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingMoment(true)}
          className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-70 mt-2"
          style={{ color: GOLD }}
        >
          <Plus className="w-3.5 h-3.5" /> Add Moment
        </button>
      )}
    </div>
  );
};

// ─── Individual Moment Row ───────────────────────────────────────────────────

interface MomentRowProps {
  moment: EventMoment;
  index: number;
  eventId: string;
  eventDate: string;
  venueSpaces: { id: string; name: string }[];
  programs: { id: string; programName: string }[];
  momentTypeOptions: { id: string; valueKey: string; displayLabel: string; colorTag: string | null }[];
  topLevelMoments: EventMoment[];
  onUpdate: (updates: Partial<EventMoment>) => void;
  onRemove: () => void;
  isSubMoment: boolean;
}

const MomentRow: React.FC<MomentRowProps> = ({
  moment, index, eventDate, venueSpaces, programs, momentTypeOptions, topLevelMoments,
  onUpdate, onRemove, isSubMoment,
}) => {
  const [expanded, setExpanded] = useState(false);
  const momentType = moment.momentType || 'other';

  return (
    <div
      className="rounded-xl border transition-all"
      style={{
        borderColor: 'rgba(201,162,74,0.12)',
        marginLeft: isSubMoment ? '24px' : '0',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50/50"
        onClick={() => setExpanded(!expanded)}
      >
        <GripVertical className="w-3.5 h-3.5 text-gray-200 flex-shrink-0" />
        {isSubMoment && (
          <CornerDownRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
        )}
        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
          style={{ backgroundColor: 'rgba(201,162,74,0.1)', color: GOLD }}
        >
          {index + 1}
        </div>
        <span className="text-sm font-medium flex-1" style={{ color: '#1A1A1A' }}>
          {moment.name}
        </span>
        {/* Moment Type Badge */}
        <span className="text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider"
          style={{ backgroundColor: 'rgba(201,162,74,0.06)', color: '#B8860B' }}>
          {MOMENT_TYPE_LABELS[momentType] || momentType}
        </span>
        {moment.startTime && (
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {moment.startTime}{moment.endTime ? ` – ${moment.endTime}` : ''}
          </span>
        )}
        {moment.venueSpaceId && venueSpaces.find(s => s.id === moment.venueSpaceId) && (
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}>
            {venueSpaces.find(s => s.id === moment.venueSpaceId)?.name}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1 rounded hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-red-400" />
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
            {/* Moment Name */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Name</label>
              <input
                type="text"
                value={moment.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
              />
            </div>

            {/* Moment Type */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Moment Type</label>
              <div className="relative">
                <select
                  value={momentType}
                  onChange={(e) => onUpdate({ momentType: e.target.value as MomentType })}
                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none appearance-none bg-white pr-7"
                  style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
                >
                  {(Object.keys(MOMENT_TYPE_LABELS) as MomentType[]).map((mt) => (
                    <option key={mt} value={mt}>{MOMENT_TYPE_LABELS[mt]}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Venue Space */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Venue Space</label>
              <div className="relative">
                <select
                  value={moment.venueSpaceId || ''}
                  onChange={(e) => onUpdate({ venueSpaceId: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none appearance-none bg-white pr-7"
                  style={{ borderColor: '#EFEFEF', color: moment.venueSpaceId ? '#1A1A1A' : '#999' }}
                >
                  <option value="">Select space...</option>
                  {venueSpaces.map((space) => (
                    <option key={space.id} value={space.id}>{space.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Program Assignment */}
            {programs.length > 0 && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">
                  <Layers className="w-3 h-3 inline mr-0.5" /> Program
                </label>
                <div className="relative">
                  <select
                    value={moment.programId || ''}
                    onChange={(e) => onUpdate({ programId: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none appearance-none bg-white pr-7"
                    style={{ borderColor: '#EFEFEF', color: moment.programId ? '#1A1A1A' : '#999' }}
                  >
                    <option value="">No program</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.programName}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Date</label>
              <input
                type="date"
                value={moment.date || eventDate}
                onChange={(e) => onUpdate({ date: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Start Time</label>
              <input
                type="time"
                value={moment.startTime || ''}
                onChange={(e) => onUpdate({ startTime: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
              />
            </div>

            {/* End Time */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">End Time</label>
              <input
                type="time"
                value={moment.endTime || ''}
                onChange={(e) => onUpdate({ endTime: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
              />
            </div>

            {/* Sort Order */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Sort Order</label>
              <input
                type="number"
                value={moment.sortOrder || 0}
                onChange={(e) => onUpdate({ sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Notes</label>
              <input
                type="text"
                value={moment.notes || ''}
                onChange={(e) => onUpdate({ notes: e.target.value })}
                placeholder="Optional notes..."
                className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MomentsBuilder;
