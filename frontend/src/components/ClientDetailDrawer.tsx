import React, { useState, useEffect, useRef } from 'react';
import {
  X, Mail, Phone, MapPin, Building2, Calendar, Users, Tag,
  FileText, Palette, Clock, ChevronRight, Loader2, Edit3,
  Save, Image, Briefcase, Heart, PartyPopper, DollarSign, TrendingUp
} from 'lucide-react';
import { DbClient, DbClientEvent, fetchClientEvents, updateClient, getDbClientDisplayName } from '@/data/clientDbStore';
import { getCountryByCode } from '@/data/countries';
import { toast } from '@/components/ui/use-toast';

const GOLD = '#C9A24A';
const fmt = (n: number) => 'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface ClientDetailDrawerProps {
  client: DbClient | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const TYPE_ICONS: Record<string, React.FC<any>> = {
  wedding: Heart,
  celebration: PartyPopper,
  corporate: Briefcase,
};

const ClientDetailDrawer: React.FC<ClientDetailDrawerProps> = ({ client, open, onClose, onUpdated }) => {
  const [events, setEvents] = useState<DbClientEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'suppliers' | 'moodboards'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (client && open) {
      setActiveTab('profile');
      setIsEditing(false);
      setEditNotes(client.notes || '');
      loadEvents();
    }
  }, [client, open]);

  const loadEvents = async () => {
    if (!client) return;
    setLoadingEvents(true);
    try {
      const data = await fetchClientEvents(client.id);
      setEvents(data);
    } catch (err) {
      console.error('Error loading client events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!client) return;
    setSavingNotes(true);
    try {
      await updateClient(client.id, { notes: editNotes });
      toast({ title: 'Notes Saved', description: 'Client notes have been updated.' });
      setIsEditing(false);
      onUpdated();
    } catch (err) {
      toast({ title: 'Error', description: 'Could not save notes.', variant: 'destructive' });
    } finally {
      setSavingNotes(false);
    }
  };

  // Aggregate suppliers from all events
  const allSuppliers = events.flatMap(e => e.suppliers_used || []);
  const uniqueSuppliers = allSuppliers.reduce((acc, s) => {
    const key = s.name?.toLowerCase();
    if (key && !acc.find(a => a.name?.toLowerCase() === key)) acc.push(s);
    return acc;
  }, [] as Array<{ name: string; category?: string }>);

  // Aggregate mood boards
  const allMoodBoards = [
    ...(client?.mood_board_refs || []),
    ...events.flatMap(e => e.mood_board_refs || []),
  ];

  // Total spend
  const totalSpend = events.reduce((sum, e) => sum + (e.total_client_price || 0), 0);
  const totalBudget = events.reduce((sum, e) => sum + (e.total_budget || 0), 0);

  const countryObj = client ? getCountryByCode(client.country) : null;
  const TypeIcon = client ? (TYPE_ICONS[client.client_type] || Users) : Users;

  if (!open || !client) return null;

  const displayName = getDbClientDisplayName(client);
  const styles = client.style_preferences?.styles || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }}>
      {/* Backdrop click */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="w-full max-w-xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        style={{ borderLeft: `3px solid ${GOLD}` }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(201,162,74,0.15)', backgroundColor: '#FAFAF7' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}>
                <TypeIcon className="w-6 h-6" style={{ color: GOLD }} />
              </div>
              <div>
                <h2 className="text-xl font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
                  {displayName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}>
                    {client.client_type}
                  </span>
                  {client.tags?.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: '#666' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'rgba(201,162,74,0.06)' }}>
              <Calendar className="w-4 h-4 mx-auto mb-1" style={{ color: GOLD }} />
              <div className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>{events.length}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Events</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'rgba(201,162,74,0.06)' }}>
              <DollarSign className="w-4 h-4 mx-auto mb-1" style={{ color: GOLD }} />
              <div className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>{fmt(totalSpend)}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Total Spend</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'rgba(201,162,74,0.06)' }}>
              <Users className="w-4 h-4 mx-auto mb-1" style={{ color: GOLD }} />
              <div className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>{uniqueSuppliers.length}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Suppliers</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
          {(['profile', 'history', 'suppliers', 'moodboards'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-3 text-xs font-medium uppercase tracking-wider transition-all relative"
              style={{ color: activeTab === tab ? GOLD : '#999' }}
            >
              {tab === 'moodboards' ? 'Mood Boards' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: GOLD }} />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ─── PROFILE TAB ─── */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {/* Contact Info */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">Contact Information</h3>
                <div className="space-y-2.5">
                  {client.primary_contact_email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4" style={{ color: GOLD }} />
                      <a href={`mailto:${client.primary_contact_email}`} className="text-sm text-gray-600 hover:underline">{client.primary_contact_email}</a>
                    </div>
                  )}
                  {client.primary_contact_phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4" style={{ color: GOLD }} />
                      <a href={`tel:${client.primary_contact_phone_code}${client.primary_contact_phone}`} className="text-sm text-gray-600 hover:underline">
                        {client.primary_contact_phone_code} {client.primary_contact_phone}
                      </a>
                    </div>
                  )}
                  {(client.city || countryObj) && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4" style={{ color: GOLD }} />
                      <span className="text-sm text-gray-600">
                        {[client.city, countryObj?.name].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  {client.company_name && (
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4" style={{ color: GOLD }} />
                      <span className="text-sm text-gray-600">{client.company_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Style Preferences */}
              {styles.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">Style Preferences</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {styles.map((style: string) => (
                      <span key={style} className="px-3 py-1.5 rounded-full text-xs font-medium border" style={{ borderColor: GOLD, color: GOLD, backgroundColor: 'rgba(201,162,74,0.04)' }}>
                        <Palette className="w-3 h-3 inline mr-1" />
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget History */}
              {client.budget_history && client.budget_history.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">Budget History</h3>
                  <div className="space-y-2">
                    {client.budget_history.map((bh, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                        <div>
                          <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{bh.eventName}</span>
                          <span className="text-xs text-gray-400 ml-2">{bh.date}</span>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: GOLD }}>{fmt(bh.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Notes</h3>
                  {!isEditing ? (
                    <button onClick={() => { setIsEditing(true); setEditNotes(client.notes || ''); }} className="flex items-center gap-1 text-xs transition-colors hover:opacity-70" style={{ color: GOLD }}>
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditing(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                      <button onClick={handleSaveNotes} disabled={savingNotes} className="flex items-center gap-1 text-xs font-medium" style={{ color: GOLD }}>
                        {savingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save
                      </button>
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <textarea
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 resize-none"
                    style={{ borderColor: 'rgba(201,162,74,0.3)' }}
                    autoFocus
                  />
                ) : (
                  <div className="p-4 rounded-xl text-sm text-gray-500 leading-relaxed" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    {client.notes || 'No notes yet.'}
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="pt-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <Clock className="w-3 h-3" />
                  Added {new Date(client.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {client.updated_at !== client.created_at && (
                    <span className="ml-2">
                      · Updated {new Date(client.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── HISTORY TAB ─── */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {loadingEvents ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" style={{ color: GOLD }} />
                  <p className="text-xs text-gray-400">Loading event history...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: '#DDD' }} />
                  <p className="text-sm text-gray-400">No events recorded yet</p>
                  <p className="text-xs text-gray-300 mt-1">Events will appear here once linked to this client</p>
                </div>
              ) : (
                events.map(evt => (
                  <div key={evt.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
                          {evt.event_name}
                        </h4>
                        <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-medium" style={{
                          backgroundColor: evt.status === 'completed' ? 'rgba(34,197,94,0.1)' : 'rgba(201,162,74,0.1)',
                          color: evt.status === 'completed' ? '#22C55E' : GOLD,
                        }}>
                          {evt.status || 'active'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        {evt.event_type && (
                          <div className="flex items-center gap-1.5">
                            <Tag className="w-3 h-3" style={{ color: GOLD }} />
                            {evt.event_type}
                          </div>
                        )}
                        {evt.event_date && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" style={{ color: GOLD }} />
                            {new Date(evt.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                        {evt.venue && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" style={{ color: GOLD }} />
                            {evt.venue}
                          </div>
                        )}
                        {evt.guest_count > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3 h-3" style={{ color: GOLD }} />
                            {evt.guest_count} guests
                          </div>
                        )}
                      </div>
                      {/* Financials */}
                      <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                        <div className="text-xs">
                          <span className="text-gray-400">Budget: </span>
                          <span className="font-medium" style={{ color: '#1A1A1A' }}>{fmt(evt.total_budget || 0)}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-400">Client Price: </span>
                          <span className="font-semibold" style={{ color: GOLD }}>{fmt(evt.total_client_price || 0)}</span>
                        </div>
                      </div>
                      {/* Suppliers used */}
                      {evt.suppliers_used && evt.suppliers_used.length > 0 && (
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                          <span className="text-[10px] uppercase tracking-wider text-gray-400">Suppliers Used</span>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {evt.suppliers_used.map((s, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(201,162,74,0.06)', color: '#666' }}>
                                {s.name}{s.category ? ` · ${s.category}` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ─── SUPPLIERS TAB ─── */}
          {activeTab === 'suppliers' && (
            <div className="space-y-4">
              {uniqueSuppliers.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-10 h-10 mx-auto mb-3" style={{ color: '#DDD' }} />
                  <p className="text-sm text-gray-400">No suppliers recorded</p>
                  <p className="text-xs text-gray-300 mt-1">Suppliers from linked events will appear here</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-400">{uniqueSuppliers.length} supplier{uniqueSuppliers.length !== 1 ? 's' : ''} used across {events.length} event{events.length !== 1 ? 's' : ''}</p>
                  <div className="space-y-2">
                    {uniqueSuppliers.map((s, i) => {
                      const eventCount = events.filter(e => e.suppliers_used?.some(su => su.name?.toLowerCase() === s.name?.toLowerCase())).length;
                      return (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.08)' }}>
                              <Briefcase className="w-4 h-4" style={{ color: GOLD }} />
                            </div>
                            <div>
                              <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{s.name}</span>
                              {s.category && <span className="text-xs text-gray-400 ml-2">{s.category}</span>}
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(201,162,74,0.06)', color: GOLD }}>
                            {eventCount} event{eventCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─── MOOD BOARDS TAB ─── */}
          {activeTab === 'moodboards' && (
            <div className="space-y-4">
              {allMoodBoards.length === 0 ? (
                <div className="text-center py-12">
                  <Image className="w-10 h-10 mx-auto mb-3" style={{ color: '#DDD' }} />
                  <p className="text-sm text-gray-400">No mood boards saved</p>
                  <p className="text-xs text-gray-300 mt-1">Mood board references will appear here</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-400">{allMoodBoards.length} mood board reference{allMoodBoards.length !== 1 ? 's' : ''}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {allMoodBoards.map((mb, i) => (
                      <div key={i} className="rounded-xl border overflow-hidden group cursor-pointer hover:shadow-md transition-all" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                        {mb.url ? (
                          <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                            <img src={mb.url} alt={mb.label || 'Mood board'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                        ) : (
                          <div className="aspect-[4/3] flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.06)' }}>
                            <Image className="w-8 h-8" style={{ color: 'rgba(201,162,74,0.3)' }} />
                          </div>
                        )}
                        <div className="p-2.5">
                          <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{mb.label || 'Untitled'}</span>
                          {(mb as any).momentName && (
                            <span className="text-[10px] text-gray-400 block mt-0.5">{(mb as any).momentName}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetailDrawer;
