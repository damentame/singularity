import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from '@/components/ui/use-toast';
import {
  Users, UserPlus, Search, Filter, Download, Mail, Edit2, Trash2,
  Check, X, Clock, ChevronDown, Plus, Minus, Phone, MapPin,
  UtensilsCrossed, AlertCircle, CheckCircle, XCircle, Send, Cloud
} from 'lucide-react';

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  rsvpStatus: 'pending' | 'confirmed' | 'declined';
  dietaryRestrictions: string[];
  plusOne: boolean;
  plusOneName: string;
  tableAssignment: string;
  notes: string;
  invitationSent: boolean;
  invitationSentAt?: string;
  createdAt: string;
}

const dietaryOptions = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Nut Allergy',
  'Shellfish Allergy',
  'Halal',
  'Kosher',
  'Pescatarian',
  'No Pork',
  'No Beef',
];

const STORAGE_KEY = 'theone_guests_data';

const GuestList: React.FC = () => {
  const { user, setCurrentView } = useAppContext();
  
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setGuests(JSON.parse(saved));
      } else {
        const oldSaved = localStorage.getItem('theone_guests');
        setGuests(oldSaved ? JSON.parse(oldSaved) : []);
      }
    } catch {
      setGuests([]);
    }
  }, []);

  // Save to localStorage whenever guests change
  useEffect(() => {
    if (guests !== null) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(guests));
        setLastSaved(new Date());
      } catch (e) {
        console.error('Failed to save guest data:', e);
      }
    }
  }, [guests]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [eventType, setEventType] = useState<string>('weddings');

  // Form state
  const [formData, setFormData] = useState<Partial<Guest>>({
    name: '',
    email: '',
    phone: '',
    rsvpStatus: 'pending',
    dietaryRestrictions: [],
    plusOne: false,
    plusOneName: '',
    tableAssignment: '',
    notes: '',
  });


  // Load event type
  useEffect(() => {
    const savedEventType = localStorage.getItem('theone_event_type');
    if (savedEventType) {
      setEventType(savedEventType);
    }
  }, []);

  const guestList = guests || [];

  // Filter guests
  const filteredGuests = useMemo(() => {
    return guestList.filter(guest => {
      const matchesSearch = 
        guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.tableAssignment.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || guest.rsvpStatus === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [guestList, searchQuery, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = guestList.length;
    const confirmed = guestList.filter(g => g.rsvpStatus === 'confirmed').length;
    const declined = guestList.filter(g => g.rsvpStatus === 'declined').length;
    const pending = guestList.filter(g => g.rsvpStatus === 'pending').length;
    const plusOnes = guestList.filter(g => g.plusOne && g.rsvpStatus === 'confirmed').length;
    const totalAttending = confirmed + plusOnes;
    const invitationsSent = guestList.filter(g => g.invitationSent).length;

    // Dietary counts
    const dietaryCounts: Record<string, number> = {};
    guestList.filter(g => g.rsvpStatus === 'confirmed').forEach(guest => {
      guest.dietaryRestrictions.forEach(diet => {
        dietaryCounts[diet] = (dietaryCounts[diet] || 0) + 1;
      });
    });

    return {
      total,
      confirmed,
      declined,
      pending,
      plusOnes,
      totalAttending,
      invitationsSent,
      dietaryCounts,
    };
  }, [guestList]);

  const handleAddGuest = () => {
    if (!formData.name || !formData.email) {
      toast({
        title: 'Missing Information',
        description: 'Please enter at least a name and email.',
        variant: 'destructive',
      });
      return;
    }

    const newGuest: Guest = {
      id: `guest-${Date.now()}`,
      name: formData.name || '',
      email: formData.email || '',
      phone: formData.phone || '',
      rsvpStatus: formData.rsvpStatus as Guest['rsvpStatus'] || 'pending',
      dietaryRestrictions: formData.dietaryRestrictions || [],
      plusOne: formData.plusOne || false,
      plusOneName: formData.plusOneName || '',
      tableAssignment: formData.tableAssignment || '',
      notes: formData.notes || '',
      invitationSent: false,
      createdAt: new Date().toISOString(),
    };

    setGuests(prev => [...(prev || []), newGuest]);
    resetForm();
    setShowAddModal(false);
    toast({
      title: 'Guest Added',
      description: `${newGuest.name} has been added to your guest list.`,
    });
  };

  const handleUpdateGuest = () => {
    if (!editingGuest) return;

    setGuests(prev => (prev || []).map(g => 
      g.id === editingGuest.id 
        ? { ...g, ...formData } as Guest
        : g
    ));
    
    resetForm();
    setEditingGuest(null);
    toast({
      title: 'Guest Updated',
      description: 'Guest information has been updated.',
    });
  };

  const handleDeleteGuest = (guestId: string) => {
    setGuests(prev => (prev || []).filter(g => g.id !== guestId));
    toast({
      title: 'Guest Removed',
      description: 'Guest has been removed from your list.',
    });
  };

  const handleSendInvitation = async (guest: Guest) => {
    setIsLoading(true);
    try {
      // Simulate sending invitation (would connect to email service)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update guest invitation status
      setGuests(prev => (prev || []).map(g => 
        g.id === guest.id 
          ? { ...g, invitationSent: true, invitationSentAt: new Date().toISOString() }
          : g
      ));

      toast({
        title: 'Invitation Sent',
        description: `Invitation sent to ${guest.email}`,
      });
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSendInvitations = async () => {
    const guestsToInvite = guestList.filter(g => 
      selectedGuests.includes(g.id) && !g.invitationSent
    );

    for (const guest of guestsToInvite) {
      await handleSendInvitation(guest);
    }

    setSelectedGuests([]);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'RSVP Status', 'Dietary Restrictions', 'Plus One', 'Plus One Name', 'Table', 'Notes'];
    const rows = guestList.map(g => [
      g.name,
      g.email,
      g.phone,
      g.rsvpStatus,
      g.dietaryRestrictions.join('; '),
      g.plusOne ? 'Yes' : 'No',
      g.plusOneName,
      g.tableAssignment,
      g.notes,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guest-list-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Guest list has been exported to CSV.',
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      rsvpStatus: 'pending',
      dietaryRestrictions: [],
      plusOne: false,
      plusOneName: '',
      tableAssignment: '',
      notes: '',
    });
  };

  const openEditModal = (guest: Guest) => {
    setEditingGuest(guest);
    setFormData({
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      rsvpStatus: guest.rsvpStatus,
      dietaryRestrictions: guest.dietaryRestrictions,
      plusOne: guest.plusOne,
      plusOneName: guest.plusOneName,
      tableAssignment: guest.tableAssignment,
      notes: guest.notes,
    });
  };

  const toggleDietaryRestriction = (diet: string) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions?.includes(diet)
        ? prev.dietaryRestrictions.filter(d => d !== diet)
        : [...(prev.dietaryRestrictions || []), diet],
    }));
  };

  const toggleSelectGuest = (guestId: string) => {
    setSelectedGuests(prev => 
      prev.includes(guestId)
        ? prev.filter(id => id !== guestId)
        : [...prev, guestId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedGuests.length === filteredGuests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(filteredGuests.map(g => g.id));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'declined':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  };

  // Event type background colors
  const getBackgroundStyle = () => {
    switch (eventType) {
      case 'corporate':
        return 'bg-gradient-to-br from-[#E8DCC8] via-[#F0E6D3] to-[#F5EFE4]';
      case 'weddings':
        return 'bg-gradient-to-br from-pink-50 via-pink-100/50 to-pink-50';
      case 'celebrations':
      default:
        return 'bg-gradient-to-br from-[#FFFBF5] via-[#FFF8ED] to-[#FFFBF5]';
    }
  };

  return (
    <div className={`min-h-screen pt-24 pb-16 ${getBackgroundStyle()}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-playfair text-4xl md:text-5xl text-navy font-semibold mb-2">
              Guest List
            </h1>
            <p className="font-montserrat text-gray-600">
              Manage your event guests and track RSVPs
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {lastSaved && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <Cloud className="w-4 h-4" />
                <span>Saved</span>
              </div>
            )}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-2 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              <span>Add Guest</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-navy" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Guests</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
                <p className="text-xs text-gray-500">Confirmed</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.declined}</p>
                <p className="text-xs text-gray-500">Declined</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gold">{stats.plusOnes}</p>
                <p className="text-xs text-gray-500">Plus Ones</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.invitationsSent}</p>
                <p className="text-xs text-gray-500">Invites Sent</p>
              </div>
            </div>
          </div>
        </div>

        {/* RSVP Progress */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-playfair text-lg text-navy font-semibold">RSVP Progress</h3>
            <span className="text-sm text-gray-500">
              {stats.totalAttending} attending (including plus ones)
            </span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
            <div 
              className="bg-green-500 transition-all duration-500"
              style={{ width: `${stats.total > 0 ? (stats.confirmed / stats.total) * 100 : 0}%` }}
            />
            <div 
              className="bg-amber-500 transition-all duration-500"
              style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
            />
            <div 
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${stats.total > 0 ? (stats.declined / stats.total) * 100 : 0}%` }}
            />
          </div>
          <div className="flex gap-6 mt-3 text-sm">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              Confirmed ({stats.confirmed})
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              Pending ({stats.pending})
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              Declined ({stats.declined})
            </span>
          </div>
        </div>

        {/* Dietary Requirements Summary */}
        {Object.keys(stats.dietaryCounts).length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <h3 className="font-playfair text-lg text-navy font-semibold mb-4 flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-gold" />
              Dietary Requirements (Confirmed Guests)
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.dietaryCounts).map(([diet, count]) => (
                <span key={diet} className="px-3 py-1 bg-gold/10 text-navy rounded-full text-sm">
                  {diet}: {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="guest-search"
                name="guest-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guests by name, email, or table..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold focus:outline-none"
                autoComplete="off"
              />
            </div>
            <div className="flex gap-3">
              <select
                id="filter-status"
                name="filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold bg-white focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="declined">Declined</option>
              </select>
              {selectedGuests.length > 0 && (
                <button
                  onClick={handleBulkSendInvitations}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-3 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Invites ({selectedGuests.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Guest Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      id="select-all-guests"
                      checked={selectedGuests.length === filteredGuests.length && filteredGuests.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-gold focus:ring-gold"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    RSVP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Dietary
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Plus One
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Table
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredGuests.length > 0 ? (
                  filteredGuests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedGuests.includes(guest.id)}
                          onChange={() => toggleSelectGuest(guest.id)}
                          className="w-4 h-4 rounded border-gray-300 text-gold focus:ring-gold"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {guest.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-navy">{guest.name}</p>
                            {guest.invitationSent && (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Invite sent
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-600">{guest.email}</p>
                        {guest.phone && (
                          <p className="text-xs text-gray-400">{guest.phone}</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(guest.rsvpStatus)}`}>
                          {getStatusIcon(guest.rsvpStatus)}
                          {guest.rsvpStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {guest.dietaryRestrictions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {guest.dietaryRestrictions.slice(0, 2).map((diet, i) => (
                              <span key={i} className="px-2 py-0.5 bg-gold/10 text-gold text-xs rounded-full">
                                {diet}
                              </span>
                            ))}
                            {guest.dietaryRestrictions.length > 2 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{guest.dietaryRestrictions.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {guest.plusOne ? (
                          <div>
                            <span className="text-xs text-green-600 font-medium">Yes</span>
                            {guest.plusOneName && (
                              <p className="text-xs text-gray-500">{guest.plusOneName}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600">
                          {guest.tableAssignment || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {!guest.invitationSent && (
                            <button
                              onClick={() => handleSendInvitation(guest)}
                              disabled={isLoading}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Send Invitation"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(guest)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Guest"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteGuest(guest.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove Guest"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-playfair text-xl text-navy mb-2">No guests yet</h3>
                      <p className="text-gray-600 mb-4">Start building your guest list</p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-2 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-colors"
                      >
                        Add Your First Guest
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Guest Modal */}
      {(showAddModal || editingGuest) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-navy/80 backdrop-blur-sm"
            onClick={() => {
              setShowAddModal(false);
              setEditingGuest(null);
              resetForm();
            }}
          />
          <div 
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-navy p-6 rounded-t-2xl">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingGuest(null);
                  resetForm();
                }}
                className="absolute top-4 right-4 text-white/60 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="font-playfair text-2xl text-white font-semibold">
                {editingGuest ? 'Edit Guest' : 'Add Guest'}
              </h2>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label htmlFor="guest-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="guest-name"
                  name="guest-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold focus:outline-none"
                  placeholder="Enter guest name"
                  autoComplete="name"
                  autoFocus
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="guest-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="guest-email"
                  name="guest-email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold focus:outline-none"
                  placeholder="guest@email.com"
                  autoComplete="email"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="guest-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="guest-phone"
                  name="guest-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold focus:outline-none"
                  placeholder="+1 234 567 8900"
                  autoComplete="tel"
                />
              </div>

              {/* RSVP Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RSVP Status
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['pending', 'confirmed', 'declined'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFormData({ ...formData, rsvpStatus: status as Guest['rsvpStatus'] })}
                      className={`py-2 px-4 rounded-lg border-2 text-sm font-medium capitalize transition-colors ${
                        formData.rsvpStatus === status
                          ? status === 'confirmed' ? 'border-green-500 bg-green-50 text-green-700'
                          : status === 'declined' ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary Restrictions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dietary Restrictions
                </label>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map((diet) => (
                    <button
                      key={diet}
                      type="button"
                      onClick={() => toggleDietaryRestriction(diet)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        formData.dietaryRestrictions?.includes(diet)
                          ? 'bg-gold text-navy'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {diet}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plus One */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="guest-plus-one"
                    checked={formData.plusOne}
                    onChange={(e) => setFormData({ ...formData, plusOne: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-gold focus:ring-gold"
                  />
                  <span className="text-sm font-medium text-gray-700">Plus One Allowed</span>
                </label>
                {formData.plusOne && (
                  <input
                    type="text"
                    id="plus-one-name"
                    name="plus-one-name"
                    value={formData.plusOneName}
                    onChange={(e) => setFormData({ ...formData, plusOneName: e.target.value })}
                    className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold focus:outline-none"
                    placeholder="Plus one name (if known)"
                    autoComplete="name"
                  />
                )}
              </div>

              {/* Table Assignment */}
              <div>
                <label htmlFor="table-assignment" className="block text-sm font-medium text-gray-700 mb-1">
                  Table Assignment
                </label>
                <input
                  type="text"
                  id="table-assignment"
                  name="table-assignment"
                  value={formData.tableAssignment}
                  onChange={(e) => setFormData({ ...formData, tableAssignment: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold focus:outline-none"
                  placeholder="e.g., Table 1, Head Table"
                  autoComplete="off"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="guest-notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="guest-notes"
                  name="guest-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold resize-none focus:outline-none"
                  placeholder="Any additional notes..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingGuest(null);
                    resetForm();
                  }}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={editingGuest ? handleUpdateGuest : handleAddGuest}
                  className="flex-1 py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-colors"
                >
                  {editingGuest ? 'Update Guest' : 'Add Guest'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestList;
