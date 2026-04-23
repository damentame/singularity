import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Plus, Users, Filter, SortAsc, SortDesc, Loader2,
  Mail, Phone, MapPin, Calendar, DollarSign, RefreshCw,
  Heart, Briefcase, PartyPopper, ChevronDown, Tag, Building2,
  UserPlus, LayoutGrid, List
} from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { DbClient, fetchClients, searchClients, fetchClientEvents, getDbClientDisplayName, DbClientEvent } from '@/data/clientDbStore';
import { getCountryByCode } from '@/data/countries';
import AddClientModal from './AddClientModal';
import ClientDetailDrawer from './ClientDetailDrawer';

const GOLD = '#C9A24A';
const fmt = (n: number) => 'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const TYPE_ICONS: Record<string, React.FC<any>> = {
  wedding: Heart,
  celebration: PartyPopper,
  corporate: Briefcase,
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  wedding: { bg: 'rgba(244,114,182,0.08)', text: '#EC4899' },
  celebration: { bg: 'rgba(168,85,247,0.08)', text: '#A855F7' },
  corporate: { bg: 'rgba(59,130,246,0.08)', text: '#3B82F6' },
};

interface ClientWithStats extends DbClient {
  eventCount: number;
  totalSpend: number;
}

const ClientDirectory: React.FC = () => {
  const { user } = useAppContext();
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'wedding' | 'celebration' | 'corporate'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'spend'>('recent');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<DbClient | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('grid');

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = searchQuery.trim()
        ? await searchClients(searchQuery)
        : await fetchClients();

      // Load event counts and total spend for each client
      const enriched: ClientWithStats[] = await Promise.all(
        data.map(async (client) => {
          try {
            const events = await fetchClientEvents(client.id);
            const totalSpend = events.reduce((sum, e) => sum + (e.total_client_price || 0), 0);
            return { ...client, eventCount: events.length, totalSpend };
          } catch {
            return { ...client, eventCount: 0, totalSpend: 0 };
          }
        })
      );

      setClients(enriched);
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadClients();
  }, [debouncedSearch]);

  // Filter and sort
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(c => c.client_type === typeFilter);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = getDbClientDisplayName(a).localeCompare(getDbClientDisplayName(b));
          break;
        case 'spend':
          cmp = a.totalSpend - b.totalSpend;
          break;
        case 'recent':
        default:
          cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [clients, typeFilter, sortBy, sortDir]);

  const handleOpenClient = (client: ClientWithStats) => {
    setSelectedClient(client);
    setShowDrawer(true);
  };

  const toggleSort = (field: 'recent' | 'name' | 'spend') => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir(field === 'name' ? 'asc' : 'desc');
    }
  };

  // Stats
  const totalClients = clients.length;
  const weddingCount = clients.filter(c => c.client_type === 'wedding').length;
  const celebrationCount = clients.filter(c => c.client_type === 'celebration').length;
  const corporateCount = clients.filter(c => c.client_type === 'corporate').length;
  const totalRevenue = clients.reduce((sum, c) => sum + c.totalSpend, 0);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}>
                <Users className="w-5 h-5" style={{ color: GOLD }} />
              </div>
              <div>
                <h2 className="text-lg font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
                  Client Directory
                </h2>
                <p className="text-xs text-gray-400">
                  {totalClients} client{totalClients !== 1 ? 's' : ''} · {fmt(totalRevenue)} total revenue
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadClients}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-black/5"
                style={{ color: GOLD }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-all hover:shadow-md"
                style={{ backgroundColor: GOLD, color: '#FFF' }}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Client
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => setTypeFilter('all')}
              className="rounded-xl p-3 text-center transition-all border-2"
              style={{
                borderColor: typeFilter === 'all' ? GOLD : 'transparent',
                backgroundColor: typeFilter === 'all' ? 'rgba(201,162,74,0.04)' : 'rgba(0,0,0,0.02)',
              }}
            >
              <div className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>{totalClients}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">All Clients</div>
            </button>
            <button
              onClick={() => setTypeFilter(typeFilter === 'wedding' ? 'all' : 'wedding')}
              className="rounded-xl p-3 text-center transition-all border-2"
              style={{
                borderColor: typeFilter === 'wedding' ? '#EC4899' : 'transparent',
                backgroundColor: typeFilter === 'wedding' ? 'rgba(244,114,182,0.04)' : 'rgba(0,0,0,0.02)',
              }}
            >
              <div className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>{weddingCount}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center justify-center gap-1">
                <Heart className="w-2.5 h-2.5" style={{ color: '#EC4899' }} /> Weddings
              </div>
            </button>
            <button
              onClick={() => setTypeFilter(typeFilter === 'celebration' ? 'all' : 'celebration')}
              className="rounded-xl p-3 text-center transition-all border-2"
              style={{
                borderColor: typeFilter === 'celebration' ? '#A855F7' : 'transparent',
                backgroundColor: typeFilter === 'celebration' ? 'rgba(168,85,247,0.04)' : 'rgba(0,0,0,0.02)',
              }}
            >
              <div className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>{celebrationCount}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center justify-center gap-1">
                <PartyPopper className="w-2.5 h-2.5" style={{ color: '#A855F7' }} /> Celebrations
              </div>
            </button>
            <button
              onClick={() => setTypeFilter(typeFilter === 'corporate' ? 'all' : 'corporate')}
              className="rounded-xl p-3 text-center transition-all border-2"
              style={{
                borderColor: typeFilter === 'corporate' ? '#3B82F6' : 'transparent',
                backgroundColor: typeFilter === 'corporate' ? 'rgba(59,130,246,0.04)' : 'rgba(0,0,0,0.02)',
              }}
            >
              <div className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>{corporateCount}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center justify-center gap-1">
                <Briefcase className="w-2.5 h-2.5" style={{ color: '#3B82F6' }} /> Corporate
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Search + Sort Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search clients by name, email, or company..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 transition-all"
            style={{ borderColor: 'rgba(0,0,0,0.08)' }}
          />
        </div>

        {/* Sort buttons */}
        <div className="flex gap-1 p-1 rounded-lg bg-white border" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          {([
            { key: 'recent', label: 'Recent' },
            { key: 'name', label: 'Name' },
            { key: 'spend', label: 'Spend' },
          ] as const).map(s => (
            <button
              key={s.key}
              onClick={() => toggleSort(s.key)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                backgroundColor: sortBy === s.key ? 'rgba(201,162,74,0.08)' : 'transparent',
                color: sortBy === s.key ? GOLD : '#999',
              }}
            >
              {s.label}
              {sortBy === s.key && (sortDir === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />)}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 p-1 rounded-lg bg-white border" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <button
            onClick={() => setViewStyle('grid')}
            className="p-1.5 rounded-md transition-all"
            style={{ backgroundColor: viewStyle === 'grid' ? 'rgba(201,162,74,0.08)' : 'transparent' }}
          >
            <LayoutGrid className="w-4 h-4" style={{ color: viewStyle === 'grid' ? GOLD : '#999' }} />
          </button>
          <button
            onClick={() => setViewStyle('list')}
            className="p-1.5 rounded-md transition-all"
            style={{ backgroundColor: viewStyle === 'list' ? 'rgba(201,162,74,0.08)' : 'transparent' }}
          >
            <List className="w-4 h-4" style={{ color: viewStyle === 'list' ? GOLD : '#999' }} />
          </button>
        </div>
      </div>

      {/* Client Grid / List */}
      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: GOLD }} />
          <p className="text-sm text-gray-400">Loading clients...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
          <Users className="w-12 h-12 mx-auto mb-4" style={{ color: '#DDD' }} />
          <p className="text-gray-400 mb-2">
            {searchQuery ? 'No clients match your search' : 'No clients yet'}
          </p>
          <p className="text-xs text-gray-300 mb-6">
            {searchQuery ? 'Try a different search term' : 'Add your first client to get started'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider"
              style={{ backgroundColor: GOLD, color: '#FFF' }}
            >
              Add First Client
            </button>
          )}
        </div>
      ) : viewStyle === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map(client => {
            const displayName = getDbClientDisplayName(client);
            const TypeIcon = TYPE_ICONS[client.client_type] || Users;
            const typeColor = TYPE_COLORS[client.client_type] || { bg: 'rgba(0,0,0,0.04)', text: '#666' };
            const countryObj = getCountryByCode(client.country);
            const styles = client.style_preferences?.styles || [];

            return (
              <div
                key={client.id}
                onClick={() => handleOpenClient(client)}
                className="bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md cursor-pointer group"
                style={{ borderColor: 'rgba(201,162,74,0.15)' }}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: typeColor.bg }}>
                        <TypeIcon className="w-5 h-5" style={{ color: typeColor.text }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium group-hover:opacity-80 transition-opacity" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
                          {displayName}
                        </h3>
                        <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: typeColor.text }}>
                          {client.client_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 mb-3">
                    {client.primary_contact_email && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Mail className="w-3 h-3" style={{ color: GOLD }} />
                        <span className="truncate">{client.primary_contact_email}</span>
                      </div>
                    )}
                    {client.primary_contact_phone && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Phone className="w-3 h-3" style={{ color: GOLD }} />
                        <span>{client.primary_contact_phone_code} {client.primary_contact_phone}</span>
                      </div>
                    )}
                    {(client.city || countryObj) && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" style={{ color: GOLD }} />
                        <span>{[client.city, countryObj?.name].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Style tags */}
                  {styles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {styles.slice(0, 3).map((s: string) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(201,162,74,0.06)', color: GOLD }}>
                          {s}
                        </span>
                      ))}
                      {styles.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full text-gray-400" style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
                          +{styles.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Divider */}
                  <div className="h-px mb-3" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />

                  {/* Stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar className="w-3 h-3" style={{ color: GOLD }} />
                      <span className="text-gray-500">{client.eventCount} event{client.eventCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <DollarSign className="w-3 h-3" style={{ color: GOLD }} />
                      <span className="font-semibold" style={{ color: '#1A1A1A' }}>{fmt(client.totalSpend)}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {client.tags && client.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {client.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: '#888' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b text-[10px] uppercase tracking-wider font-medium text-gray-400" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            <div className="col-span-4">Client</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2 text-center">Events</div>
            <div className="col-span-2 text-right">Total Spend</div>
          </div>
          {filteredClients.map((client, i) => {
            const displayName = getDbClientDisplayName(client);
            const TypeIcon = TYPE_ICONS[client.client_type] || Users;
            const typeColor = TYPE_COLORS[client.client_type] || { bg: 'rgba(0,0,0,0.04)', text: '#666' };
            const countryObj = getCountryByCode(client.country);

            return (
              <div
                key={client.id}
                onClick={() => handleOpenClient(client)}
                className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center cursor-pointer transition-colors hover:bg-black/[0.02] border-b last:border-b-0"
                style={{ borderColor: 'rgba(0,0,0,0.04)' }}
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: typeColor.bg }}>
                    <TypeIcon className="w-4 h-4" style={{ color: typeColor.text }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>{displayName}</div>
                    {client.primary_contact_email && (
                      <div className="text-[10px] text-gray-400 truncate">{client.primary_contact_email}</div>
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: typeColor.bg, color: typeColor.text }}>
                    {client.client_type}
                  </span>
                </div>
                <div className="col-span-2 text-xs text-gray-500 truncate">
                  {[client.city, countryObj?.name].filter(Boolean).join(', ') || '—'}
                </div>
                <div className="col-span-2 text-center text-xs text-gray-500">
                  {client.eventCount}
                </div>
                <div className="col-span-2 text-right text-sm font-semibold" style={{ color: '#1A1A1A' }}>
                  {fmt(client.totalSpend)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Client Modal */}
      <AddClientModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={loadClients}
      />

      {/* Client Detail Drawer */}
      <ClientDetailDrawer
        client={selectedClient}
        open={showDrawer}
        onClose={() => { setShowDrawer(false); setSelectedClient(null); }}
        onUpdated={loadClients}
      />
    </div>
  );
};

export default ClientDirectory;
