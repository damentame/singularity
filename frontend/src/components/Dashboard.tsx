import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useEventContext } from '@/contexts/EventContext';
import { useAutoSaveStatus } from './EventAutoSaver';
import { suppliers } from '@/data/suppliers';
import SupplierCard from './SupplierCard';
import MyEventsPanel from './MyEventsPanel';
import { supabase } from '@/lib/supabase';
import { 
  Heart, FileText, Calendar, MessageSquare, Clock, CheckCircle, XCircle,
  Users, DollarSign, ListChecks, Grid3X3, Cloud, RefreshCw, Palette,
  Database, Loader2, CloudOff, FolderOpen
} from 'lucide-react';


interface SyncInfo {
  guests: { count: number; lastSync: string | null };
  budget: { count: number; lastSync: string | null };
  checklist: { count: number; completed: number; lastSync: string | null };
  seating: { tables: number; assigned: number; lastSync: string | null };
}

const Dashboard: React.FC = () => {
  const { user, wishlist, bookingRequests, setCurrentView } = useAppContext();
  const { events, selectEvent } = useEventContext();
  const { isSaving, lastSaveTime } = useAutoSaveStatus();
  const [activeTab, setActiveTab] = useState<'saved' | 'requests' | 'bookings' | 'planning' | 'my-events'>('my-events');
  const [syncInfo, setSyncInfo] = useState<SyncInfo>({
    guests: { count: 0, lastSync: null },
    budget: { count: 0, lastSync: null },
    checklist: { count: 0, completed: 0, lastSync: null },
    seating: { tables: 0, assigned: 0, lastSync: null },
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const savedSuppliers = suppliers.filter(s => wishlist.includes(s.id));

  // Load sync info from localStorage
  useEffect(() => {
    const loadSyncInfo = () => {
      const guests = JSON.parse(localStorage.getItem('theone_guests') || '[]');
      const guestsSync = localStorage.getItem('theone_guests_sync_time');
      const budgetData = JSON.parse(localStorage.getItem('theone_budget_data') || '{"items":[]}');
      const budgetSync = localStorage.getItem('theone_budget_data_sync_time');
      const checklist = JSON.parse(localStorage.getItem('theone_checklist') || '[]');
      const checklistSync = localStorage.getItem('theone_checklist_sync_time');
      const seating = JSON.parse(localStorage.getItem('theone_seating') || '{"tables":[],"guests":[]}');
      const seatingSync = localStorage.getItem('theone_seating_sync_time');

      setSyncInfo({
        guests: { count: guests.length, lastSync: guestsSync },
        budget: { count: budgetData.items?.length || 0, lastSync: budgetSync },
        checklist: { 
          count: checklist.length, 
          completed: checklist.filter((i: any) => i.completed).length,
          lastSync: checklistSync 
        },
        seating: { 
          tables: seating.tables?.length || 0, 
          assigned: seating.guests?.filter((g: any) => g.tableId)?.length || 0,
          lastSync: seatingSync 
        },
      });
    };

    loadSyncInfo();
    const interval = setInterval(loadSyncInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const syncAllData = async () => {
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to sync your data');
        return;
      }

      const dataTypes = ['guests', 'budget', 'checklist', 'seating'];
      
      for (const dataType of dataTypes) {
        const localKey = dataType === 'budget' ? 'theone_budget_data' : 
                        dataType === 'seating' ? 'theone_seating' : 
                        `theone_${dataType}`;
        const localData = localStorage.getItem(localKey);
        
        if (localData) {
          let data;
          const parsed = JSON.parse(localData);
          
          switch (dataType) {
            case 'guests':
              data = { guests: parsed };
              break;
            case 'budget':
              data = {
                budgetItems: parsed.items || [],
                budgetSettings: {
                  totalBudget: parsed.totalBudget,
                  currencyCode: parsed.currencyCode,
                },
              };
              break;
            case 'checklist':
              data = { checklistItems: parsed };
              break;
            case 'seating':
              data = {
                seatingTables: parsed.tables || [],
                seatingAssignments: parsed.guests || [],
              };
              break;
          }

          await supabase.functions.invoke('sync-event-data', {
            body: {
              action: 'push',
              dataType,
              data,
            },
          });
        }
      }

      const now = new Date().toISOString();
      localStorage.setItem('theone_guests_sync_time', now);
      localStorage.setItem('theone_budget_data_sync_time', now);
      localStorage.setItem('theone_checklist_sync_time', now);
      localStorage.setItem('theone_seating_sync_time', now);

      alert('All data synced successfully!');
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync data. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (time: string | null) => {
    if (!time) return 'Never';
    const date = new Date(time);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const handleOpenEvent = (eventId: string) => {
    selectEvent(eventId);
    setCurrentView('coordinator-event');
  };

  const tabs = [
    { id: 'my-events', label: 'My Events', icon: FolderOpen, count: events.length },
    { id: 'planning', label: 'Planning Tools', icon: ListChecks, count: null },
    { id: 'saved', label: 'Saved Suppliers', icon: Heart, count: savedSuppliers.length },
    { id: 'requests', label: 'Quote Requests', icon: FileText, count: bookingRequests.length },
    { id: 'bookings', label: 'Confirmed Bookings', icon: Calendar, count: 0 },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gold" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'declined':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gold/10 text-gold';
    }
  };

  const planningTools = [
    {
      id: 'questionnaire',
      title: 'Event Questionnaire',
      icon: FileText,
      color: 'bg-rose-500',
      stats: 'Client intake form',
      lastSync: null,
      view: 'wizard' as const,
    },
    {
      id: 'guests',
      title: 'Guest List',
      icon: Users,
      color: 'bg-blue-500',
      stats: `${syncInfo.guests.count} guests`,
      lastSync: syncInfo.guests.lastSync,
      view: 'guests' as const,
    },
    {
      id: 'budget',
      title: 'Budget Tracker',
      icon: DollarSign,
      color: 'bg-green-500',
      stats: `${syncInfo.budget.count} expenses`,
      lastSync: syncInfo.budget.lastSync,
      view: 'budget' as const,
    },
    {
      id: 'checklist',
      title: 'Planning Checklist',
      icon: ListChecks,
      color: 'bg-purple-500',
      stats: `${syncInfo.checklist.completed}/${syncInfo.checklist.count} completed`,
      lastSync: syncInfo.checklist.lastSync,
      view: 'checklist' as const,
    },
    {
      id: 'seating',
      title: 'Seating Chart',
      icon: Grid3X3,
      color: 'bg-orange-500',
      stats: `${syncInfo.seating.tables} tables, ${syncInfo.seating.assigned} assigned`,
      lastSync: syncInfo.seating.lastSync,
      view: 'seating' as const,
    },
    {
      id: 'moodboard',
      title: 'Mood Board',
      icon: Palette,
      color: 'bg-pink-500',
      stats: 'Visual inspiration board',
      lastSync: null,
      view: 'moodboard' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-cream pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-playfair text-4xl md:text-5xl text-navy font-semibold mb-2">
              Welcome back, {user?.name}
            </h1>
            <p className="font-montserrat text-gray-600">
              Manage your event planning, saved suppliers, and bookings
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-save status */}
            <div className="flex items-center gap-2 text-sm">
              {isSaving ? (
                <span className="flex items-center gap-1.5 text-amber-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : lastSaveTime ? (
                <span className="flex items-center gap-1.5 text-green-600">
                  <Cloud className="w-4 h-4" />
                  Auto-saved
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-gray-400">
                  <CloudOff className="w-4 h-4" />
                  Not saved
                </span>
              )}
            </div>
            <button
              onClick={syncAllData}
              disabled={isSyncing}
              className="flex items-center gap-2 px-6 py-3 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync All Data'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-navy text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.id ? 'bg-gold text-navy' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* My Events Tab */}
        {activeTab === 'my-events' && (
          <MyEventsPanel onOpenEvent={handleOpenEvent} />
        )}

        {/* Planning Tools Tab */}
        {activeTab === 'planning' && (
          <div className="space-y-6">
            {/* Cloud Sync Status */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Cloud className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-playfair text-lg text-navy font-semibold">Cloud Sync</h3>
                    <p className="text-sm text-gray-500">Your data is automatically saved and synced</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Connected</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                All your planning data (guest lists, budget, checklist, seating) is automatically saved locally 
                and synced to the cloud when you're logged in. Your data is safe even if you close the browser.
              </p>
            </div>

            {/* Planning Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {planningTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setCurrentView(tool.view)}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-gold/50 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center`}>
                      <tool.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Cloud className="w-3 h-3" />
                      <span>{formatLastSync(tool.lastSync)}</span>
                    </div>
                  </div>
                  <h3 className="font-playfair text-xl text-navy font-semibold mb-1 group-hover:text-gold transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-gray-500">{tool.stats}</p>
                </button>
              ))}
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-r from-navy to-navy-light rounded-xl p-6 text-white">
              <h3 className="font-playfair text-xl font-semibold mb-3">Planning Tips</h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" />
                  <span>Your event data auto-saves to the database every 30 seconds</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" />
                  <span>Changes are saved locally first, so you won't lose work even offline</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" />
                  <span>Use "My Events" tab to view and resume any saved event from the cloud</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Saved Suppliers Tab */}
        {activeTab === 'saved' && (
          <>
            {savedSuppliers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {savedSuppliers.map((supplier) => (
                  <SupplierCard key={supplier.id} supplier={supplier} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-playfair text-2xl text-navy mb-2">No saved suppliers yet</h3>
                <p className="text-gray-600 mb-6">
                  Start browsing and save your favorite suppliers
                </p>
                <button
                  onClick={() => setCurrentView('browse')}
                  className="px-6 py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-colors"
                >
                  Browse Suppliers
                </button>
              </div>
            )}
          </>
        )}

        {/* Quote Requests Tab */}
        {activeTab === 'requests' && (
          <>
            {bookingRequests.length > 0 ? (
              <div className="space-y-4">
                {bookingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-playfair text-xl text-navy font-semibold">
                          {request.supplierName}
                        </h3>
                        <p className="text-gray-500 text-sm capitalize">
                          {request.eventType} Event
                        </p>
                      </div>
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Event Date</p>
                        <p className="font-medium text-navy">
                          {new Date(request.eventDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Guests</p>
                        <p className="font-medium text-navy">{request.guestCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Budget</p>
                        <p className="font-medium text-navy">{request.budget || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Sent</p>
                        <p className="font-medium text-navy">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {request.message && (
                      <div className="bg-cream rounded-lg p-4">
                        <p className="text-sm text-gray-600">{request.message}</p>
                      </div>
                    )}

                    <div className="flex gap-3 mt-4">
                      <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-navy hover:text-gold transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        Send Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-playfair text-2xl text-navy mb-2">No quote requests yet</h3>
                <p className="text-gray-600 mb-6">
                  Request quotes from suppliers to get started
                </p>
                <button
                  onClick={() => setCurrentView('browse')}
                  className="px-6 py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-colors"
                >
                  Browse Suppliers
                </button>
              </div>
            )}
          </>
        )}

        {/* Confirmed Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="text-center py-16 bg-white rounded-2xl">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-playfair text-2xl text-navy mb-2">No confirmed bookings</h3>
            <p className="text-gray-600">
              Your confirmed bookings will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
