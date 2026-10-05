import React, { useState, useMemo } from 'react';
import { Truck, Plus, Bell, BellOff, FileDown, Loader2, Trash2 } from 'lucide-react';
import { useEventContext, PlannerEvent, SupplierLoadSlot, LoadSlotType } from '@/contexts/EventContext';
import { notifySupplierOfLoadSlot } from '@/lib/loadScheduleMessaging';
import { exportLoadScheduleToPdf, exportOrderOfEventsToPdf } from '@/lib/pdfExport';
import { toast } from '@/components/ui/use-toast';

const GOLD = '#C9A24A';

interface LoadScheduleManagerProps {
  event: PlannerEvent;
}

interface SupplierOption {
  key: string;
  name: string;
  email: string;
}

interface SlotFormState {
  supplierKey: string;
  type: LoadSlotType;
  label: string;
  date: string;
  startTime: string;
  endTime: string;
  venueSpaceId: string;
  notes: string;
}

const emptyForm = (type: LoadSlotType): SlotFormState => ({
  supplierKey: '', type, label: '', date: '', startTime: '', endTime: '', venueSpaceId: '', notes: '',
});

const inputStyle = "w-full px-3 py-2 rounded-lg border text-xs outline-none transition-colors";

const LoadScheduleManager: React.FC<LoadScheduleManagerProps> = ({ event }) => {
  const { addLoadSlot, updateLoadSlot, removeLoadSlot } = useEventContext();
  const [addingType, setAddingType] = useState<LoadSlotType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SlotFormState>(emptyForm('load_in'));
  const [saving, setSaving] = useState(false);

  // Dynamically pulled from whoever has actually been assigned to a line item on this quote
  const supplierOptions = useMemo((): SupplierOption[] => {
    const seen = new Map<string, SupplierOption>();
    (event.supplierAssignments || []).forEach(a => {
      const key = `${a.supplierName}|||${a.supplierEmail}`.toLowerCase();
      if (!seen.has(key)) seen.set(key, { key, name: a.supplierName, email: a.supplierEmail });
    });
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [event.supplierAssignments]);

  const loadSlots = event.loadSlots || [];
  const slotsByType = (type: LoadSlotType) =>
    loadSlots.filter(s => s.type === type).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  const startAdd = (type: LoadSlotType) => {
    setAddingType(type);
    setEditingId(null);
    setForm(emptyForm(type));
  };

  const startEdit = (slot: SupplierLoadSlot) => {
    setEditingId(slot.id);
    setAddingType(slot.type);
    setForm({
      supplierKey: slot.supplierKey, type: slot.type, label: slot.label, date: slot.date,
      startTime: slot.startTime, endTime: slot.endTime, venueSpaceId: slot.venueSpaceId, notes: slot.notes,
    });
  };

  const cancelForm = () => { setAddingType(null); setEditingId(null); };

  const handleSave = async () => {
    const option = supplierOptions.find(o => o.key === form.supplierKey);
    if (!option) { toast({ title: 'Select a supplier', variant: 'destructive' }); return; }

    setSaving(true);
    try {
      const draft = {
        supplierKey: option.key, supplierName: option.name, supplierEmail: option.email,
        type: form.type, label: form.label.trim(), date: form.date, startTime: form.startTime,
        endTime: form.endTime, venueSpaceId: form.venueSpaceId, notes: form.notes.trim(),
      };

      const priorSlot = editingId ? loadSlots.find(s => s.id === editingId) : undefined;
      const timeChanged = !priorSlot || priorSlot.date !== draft.date || priorSlot.startTime !== draft.startTime || priorSlot.endTime !== draft.endTime;

      let notifiedAt = priorSlot?.notifiedAt || '';
      if (draft.date && draft.startTime && timeChanged) {
        const sent = await notifySupplierOfLoadSlot(event, { ...draft, id: editingId || 'pending', notifiedAt: '' });
        if (sent) {
          notifiedAt = new Date().toISOString();
          toast({ title: 'Supplier notified', description: `${option.name} was messaged about this ${form.type === 'load_in' ? 'load-in' : 'load-out'} time.` });
        }
      }

      if (editingId) {
        updateLoadSlot(event.id, editingId, { ...draft, notifiedAt });
      } else {
        addLoadSlot(event.id, { ...draft, notifiedAt });
      }
      cancelForm();
    } finally {
      setSaving(false);
    }
  };

  const renderSlotRow = (slot: SupplierLoadSlot) => {
    const space = (event.venueSpaces || []).find(s => s.id === slot.venueSpaceId);
    return (
      <div key={slot.id} className="flex items-start gap-3 px-3.5 py-3 rounded-xl border" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>{slot.supplierName}</span>
            {slot.label && <span className="text-[10px] text-gray-400">· {slot.label}</span>}
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {slot.date ? new Date(slot.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Date TBC'}
            {' · '}{slot.startTime ? `${slot.startTime}${slot.endTime ? '–' + slot.endTime : ''}` : 'Time TBC'}
            {space && <> · {space.name}</>}
          </p>
          {slot.notes && <p className="text-[10px] text-gray-400 mt-1 italic">{slot.notes}</p>}
          <p className="text-[9px] mt-1 flex items-center gap-1" style={{ color: slot.notifiedAt ? '#16A34A' : '#B45309' }}>
            {slot.notifiedAt ? <Bell className="w-2.5 h-2.5" /> : <BellOff className="w-2.5 h-2.5" />}
            {slot.notifiedAt ? 'Supplier notified' : 'Not yet notified'}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button type="button" onClick={() => startEdit(slot)} className="text-[10px] px-2 py-1 rounded-lg hover:bg-black/5 transition-colors" style={{ color: GOLD }}>
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Remove this ${slot.type === 'load_in' ? 'load-in' : 'load-out'} slot for ${slot.supplierName}?${slot.notifiedAt ? ' The supplier was already notified of this time and will not be told it was removed.' : ''}`)) {
                removeLoadSlot(event.id, slot.id);
              }
            }}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors group"
          >
            <Trash2 className="w-3 h-3 text-gray-300 group-hover:text-red-500 transition-colors" />
          </button>
        </div>
      </div>
    );
  };

  const renderForm = () => (
    <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: 'rgba(201,162,74,0.25)', backgroundColor: 'rgba(201,162,74,0.03)' }}>
      <div className="grid grid-cols-2 gap-3">
        <select value={form.supplierKey} onChange={(e) => setForm({ ...form, supplierKey: e.target.value })} className={inputStyle} style={{ borderColor: '#EFEFEF' }}>
          <option value="">Select supplier…</option>
          {supplierOptions.map(o => <option key={o.key} value={o.key}>{o.name}</option>)}
        </select>
        <select value={form.venueSpaceId} onChange={(e) => setForm({ ...form, venueSpaceId: e.target.value })} className={inputStyle} style={{ borderColor: '#EFEFEF' }}>
          <option value="">Venue space (optional)</option>
          {(event.venueSpaces || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <input
        value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
        placeholder="e.g. Morning setup, Bridal bouquet delivery" className={inputStyle} style={{ borderColor: '#EFEFEF' }}
      />
      <div className="grid grid-cols-3 gap-3">
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputStyle} style={{ borderColor: '#EFEFEF' }} />
        <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className={inputStyle} style={{ borderColor: '#EFEFEF' }} />
        <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className={inputStyle} style={{ borderColor: '#EFEFEF' }} />
      </div>
      <textarea
        value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
        placeholder="Notes for this slot (optional)" rows={2} className={`${inputStyle} resize-none`} style={{ borderColor: '#EFEFEF' }}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] text-gray-400 italic">Saving with a date + time will automatically message the supplier.</p>
        <div className="flex gap-2 flex-shrink-0">
          <button type="button" onClick={cancelForm} className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-black/5 transition-colors">Cancel</button>
          <button
            type="button"
            onClick={handleSave} disabled={saving || !form.supplierKey}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1.5"
            style={{ backgroundColor: GOLD, color: '#FFF' }}
          >
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
            {editingId ? 'Save Changes' : 'Add Slot'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] flex items-center gap-1.5" style={{ color: GOLD }}>
          <Truck className="w-3.5 h-3.5" /> Load-In / Load-Out Schedule
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportLoadScheduleToPdf(event)}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border hover:shadow-sm transition-all"
            style={{ borderColor: 'rgba(201,162,74,0.25)', color: GOLD }}
          >
            <FileDown className="w-3 h-3" /> Load Schedule PDF
          </button>
          <button
            type="button"
            onClick={() => exportOrderOfEventsToPdf(event)}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border hover:shadow-sm transition-all"
            style={{ borderColor: 'rgba(201,162,74,0.25)', color: GOLD }}
          >
            <FileDown className="w-3 h-3" /> Order of Events PDF
          </button>
        </div>
      </div>

      {supplierOptions.length === 0 && (
        <p className="text-[10px] text-gray-300 italic">Assign a supplier to a line item first — they'll show up here automatically.</p>
      )}

      {(['load_in', 'load_out'] as const).map(type => (
        <div key={type} className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
              {type === 'load_in' ? 'Load-In / Setup' : 'Load-Out / Strike'}
            </p>
            {supplierOptions.length > 0 && addingType !== type && (
              <button type="button" onClick={() => startAdd(type)} className="flex items-center gap-1 text-[10px]" style={{ color: GOLD }}>
                <Plus className="w-3 h-3" /> Add Slot
              </button>
            )}
          </div>
          <div className="space-y-2">
            {slotsByType(type).map(renderSlotRow)}
          </div>
          {slotsByType(type).length === 0 && addingType !== type && (
            <p className="text-[10px] text-gray-300 italic">No slots yet.</p>
          )}
          {addingType === type && renderForm()}
        </div>
      ))}
    </div>
  );
};

export default LoadScheduleManager;
