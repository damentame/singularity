import React, { useState, useEffect } from 'react';
import { Check, Plus, Trash2, Calendar, Clock, ChevronDown, ChevronUp, AlertCircle, Sparkles, CalendarDays, MapPin, Users, Palette, DollarSign, Edit, Cloud } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { DatePickerCompact } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { colorPalette, eventAreas, serviceProviderOptions } from '@/data/eventPlanningData';
import { allCelebrationTypes } from '@/data/celebrationTypes';

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

interface EventPlanSummary {
  eventName: string;
  eventType: string;
  numberOfDays: number;
  country: string;
  city: string;
  eventDays: any[];
  serviceProviders: any[];
  guests: any[];
  budgetMin: number;
  budgetMax: number;
  currency: string;
}

const defaultCategories = [
  'Planning',
  'Venues',
  'Catering',
  'Photography',
  'Videography',
  'Entertainment',
  'Florals',
  'Lighting',
  'Transport',
  'Planners',
  'Attire & Beauty',
  'Invitations & Stationery',
  'Accommodation',
  'Legal & Admin',
  'Other'
];

const defaultChecklist: Omit<ChecklistItem, 'id' | 'completed'>[] = [
  { title: 'Set wedding date', category: 'Planning', priority: 'high' },
  { title: 'Create budget', category: 'Planning', priority: 'high' },
  { title: 'Book venue', category: 'Venues', priority: 'high' },
  { title: 'Hire photographer', category: 'Photography', priority: 'high' },
  { title: 'Book caterer', category: 'Catering', priority: 'high' },
  { title: 'Choose wedding party', category: 'Other', priority: 'medium' },
  { title: 'Book DJ/Band', category: 'Entertainment', priority: 'medium' },
  { title: 'Order invitations', category: 'Invitations & Stationery', priority: 'medium' },
  { title: 'Book florist', category: 'Florals', priority: 'medium' },
  { title: 'Purchase wedding dress', category: 'Attire & Beauty', priority: 'high' },
  { title: 'Book hair & makeup', category: 'Attire & Beauty', priority: 'medium' },
  { title: 'Arrange transportation', category: 'Transport', priority: 'low' },
  { title: 'Book accommodation for guests', category: 'Accommodation', priority: 'medium' },
  { title: 'Get marriage license', category: 'Legal & Admin', priority: 'high' },
  { title: 'Plan honeymoon', category: 'Other', priority: 'low' },
];

const currencies: Record<string, string> = {
  'USD': '$',
  'GBP': '£',
  'EUR': '€',
  'ZAR': 'R',
  'AUD': 'A$',
  'AED': 'AED',
  'INR': '₹',
  'SGD': 'S$',
};

const CHECKLIST_STORAGE_KEY = 'theone_checklist_data';

const PlanningChecklist: React.FC = () => {
  const { setCurrentView } = useAppContext();
  
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      } else {
        const oldSaved = localStorage.getItem('theone_checklist');
        if (oldSaved) {
          setItems(JSON.parse(oldSaved));
        }
        // else items stays null and will be initialized below
      }
    } catch {
      // items stays null
    }
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (items !== null) {
      try {
        localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(items));
        setLastSaved(new Date());
      } catch (e) {
        console.error('Failed to save checklist data:', e);
      }
    }
  }, [items]);

  const [expandedCategories, setExpandedCategories] = useState<string[]>(defaultCategories);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Other');
  const [newItemPriority, setNewItemPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newItemDueDate, setNewItemDueDate] = useState<Date | undefined>(undefined);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [eventPlan, setEventPlan] = useState<EventPlanSummary | null>(null);
  const [showEventSummary, setShowEventSummary] = useState(true);

  useEffect(() => {
    const savedEventPlanV2 = localStorage.getItem('theone_event_plan_v2');
    if (savedEventPlanV2) {
      try {
        const plan = JSON.parse(savedEventPlanV2);
        setEventPlan(plan);
      } catch (e) {
        console.error('Error parsing event plan v2:', e);
      }
    }

    const savedEventPlan = localStorage.getItem('theone_event_plan');
    if (savedEventPlan && items === null) {
      try {
        const eventPlanV1 = JSON.parse(savedEventPlan);
        if (eventPlanV1.checklist && eventPlanV1.checklist.length > 0) {
          const wizardItems: ChecklistItem[] = eventPlanV1.checklist.map((item: any) => ({
            id: item.id,
            title: item.task,
            description: item.description,
            dueDate: item.dueDate ? format(new Date(item.dueDate), 'yyyy-MM-dd') : undefined,
            completed: item.completed || false,
            category: item.category,
            priority: item.priority,
          }));
          setItems(wizardItems);
          return;
        }
      } catch (e) {
        console.error('Error parsing event plan:', e);
      }
    }
    
    if (items === null) {
      const initialItems = defaultChecklist.map((item, index) => ({
        ...item,
        id: `item-${index}`,
        completed: false,
      }));
      setItems(initialItems);
    }
  }, [items, setItems]);

  const itemList = items || [];

  const getColorHex = (colorId: string) => {
    const color = colorPalette.find(c => c.id === colorId);
    return color?.hex || colorId;
  };

  const getEventTypeName = (typeId: string) => {
    const type = allCelebrationTypes.find(t => t.id === typeId);
    return type?.name || typeId;
  };

  const getEventAreaName = (areaId: string) => {
    const area = eventAreas.find(a => a.id === areaId);
    return area?.name || areaId;
  };

  const getServiceProviderName = (categoryId: string) => {
    const sp = serviceProviderOptions.find(s => s.id === categoryId);
    return sp?.name || categoryId;
  };

  const formatBudget = (amount: number, currency: string) => {
    const symbol = currencies[currency] || '$';
    if (amount >= 1000000) return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(0)}K`;
    return `${symbol}${amount}`;
  };

  const toggleItem = (id: string) => {
    setItems(prev => (prev || []).map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const addItem = () => {
    if (!newItemTitle.trim()) return;
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      title: newItemTitle,
      category: newItemCategory,
      priority: newItemPriority,
      dueDate: newItemDueDate ? format(newItemDueDate, 'yyyy-MM-dd') : undefined,
      completed: false,
    };
    setItems(prev => [...(prev || []), newItem]);
    setNewItemTitle('');
    setNewItemDueDate(undefined);
    setShowAddForm(false);
  };

  const removeItem = (id: string) => {
    setItems(prev => (prev || []).filter(item => item.id !== id));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const filteredItems = itemList.filter(item => {
    if (filter === 'pending') return !item.completed;
    if (filter === 'completed') return item.completed;
    return true;
  });

  const groupedItems = defaultCategories.reduce((acc, category) => {
    acc[category] = filteredItems.filter(item => item.category === category);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const completedCount = itemList.filter(i => i.completed).length;
  const progress = itemList.length > 0 ? (completedCount / itemList.length) * 100 : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'low': return 'text-green-400 bg-green-400/10';
      default: return 'text-white/50 bg-white/5';
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: '#0B1426' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-4xl md:text-5xl font-normal tracking-[0.04em]" style={{ color: '#FFFFFF' }}>
              Planning Checklist
            </h1>
            {lastSaved && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Cloud className="w-4 h-4" />
                <span>Saved</span>
              </div>
            )}
          </div>
          <p className="font-body text-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Stay organized and never miss a detail
          </p>
        </div>

        {/* Event Plan Summary */}
        {eventPlan && showEventSummary && (
          <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                {eventPlan.eventName || 'Your Event'}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('wizard')}
                  className="px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-sm flex items-center gap-1 hover:bg-amber-500/30 transition-colors"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => setShowEventSummary(false)}
                  className="text-white/40 hover:text-white/60"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-white/40 text-xs mb-1">Event Type</div>
                <div className="text-amber-400 font-medium">{getEventTypeName(eventPlan.eventType)}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-white/40 text-xs mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Location
                </div>
                <div className="text-white font-medium">{eventPlan.city}, {eventPlan.country}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-white/40 text-xs mb-1 flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> Duration
                </div>
                <div className="text-white font-medium">{eventPlan.numberOfDays} Day{eventPlan.numberOfDays > 1 ? 's' : ''}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-white/40 text-xs mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Budget
                </div>
                <div className="text-white font-medium">
                  {formatBudget(eventPlan.budgetMin, eventPlan.currency)} - {formatBudget(eventPlan.budgetMax, eventPlan.currency)}
                </div>
              </div>
            </div>

            {/* Event Days Summary */}
            {eventPlan.eventDays && eventPlan.eventDays.length > 0 && (
              <div className="mb-4">
                <h3 className="text-white/60 text-sm mb-2">Event Schedule</h3>
                <div className="space-y-2">
                  {eventPlan.eventDays.map((day: any, idx: number) => (
                    <div key={day.id} className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">Day {idx + 1}</span>
                        {day.date && (
                          <span className="text-amber-400 text-sm">
                            {format(new Date(day.date), 'EEE, MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                      {day.subEvents && day.subEvents.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {day.subEvents.map((event: any) => (
                            <div key={event.id} className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded text-xs">
                              <span className="text-white/80">{getEventAreaName(event.areaType) || event.name || 'Event'}</span>
                              {event.eventStartTime && (
                                <span className="text-white/40">{event.eventStartTime}</span>
                              )}
                              {event.colorScheme && event.colorScheme.length > 0 && (
                                <div className="flex gap-0.5">
                                  {event.colorScheme.slice(0, 3).map((colorId: string, i: number) => (
                                    <div
                                      key={i}
                                      className="w-3 h-3 rounded-full border border-white/20"
                                      style={{ backgroundColor: getColorHex(colorId) }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service Providers */}
            {eventPlan.serviceProviders && (
              <div className="mb-4">
                <h3 className="text-white/60 text-sm mb-2">Service Providers</h3>
                <div className="flex flex-wrap gap-2">
                  {eventPlan.serviceProviders.filter((sp: any) => sp.enabled).map((sp: any) => (
                    <span key={sp.categoryId} className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs">
                      {getServiceProviderName(sp.categoryId)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Guests Summary */}
            {eventPlan.guests && eventPlan.guests.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-white/40" />
                <span className="text-white/60">{eventPlan.guests.length} guests added</span>
                <span className="text-white/40">•</span>
                <span className="text-white/60">
                  {eventPlan.guests.filter((g: any) => g.dietaryRequirements?.length > 0).length} with dietary requirements
                </span>
              </div>
            )}
          </div>
        )}

        {/* Collapsed Event Summary Toggle */}
        {eventPlan && !showEventSummary && (
          <button
            onClick={() => setShowEventSummary(true)}
            className="w-full mb-8 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-amber-400 hover:bg-amber-500/15 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {eventPlan.eventName || 'Your Event Plan'}
            </span>
            <ChevronDown className="w-5 h-5" />
          </button>
        )}

        {/* Progress Bar */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="font-body text-lg" style={{ color: '#FFFFFF' }}>Overall Progress</span>
            <span className="font-display text-2xl text-gold">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-white/[0.1] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-gold-light via-gold to-gold-dark rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-3">
            <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{completedCount} completed</span>
            <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{itemList.length - completedCount} remaining</span>
          </div>
        </div>

        {/* Filters & Add Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex gap-2">
            {(['all', 'pending', 'completed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-body text-sm uppercase tracking-wider transition-colors ${
                  filter === f 
                    ? 'bg-gold text-navy' 
                    : 'bg-white/[0.05] text-white/70 hover:bg-white/[0.1]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-5 py-2.5 bg-gradient-to-r from-gold-light via-gold to-gold-dark rounded-lg font-body font-medium text-nav uppercase flex items-center gap-2"
            style={{ color: '#0B1426' }}
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white/[0.03] border border-gold/20 rounded-2xl p-6 mb-8 animate-fadeIn">
            <h3 className="font-display text-xl mb-4" style={{ color: '#FFFFFF' }}>Add New Task</h3>
            <div className="space-y-4">
              <input
                type="text"
                id="task-title"
                name="task-title"
                placeholder="Task title"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg font-body text-white placeholder-white/40 focus:outline-none focus:border-gold/50"
                autoComplete="off"
                autoFocus
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  id="task-category"
                  name="task-category"
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg font-body text-white focus:outline-none focus:border-gold/50"
                >
                  {defaultCategories.map(cat => (
                    <option key={cat} value={cat} className="bg-navy">{cat}</option>
                  ))}
                </select>
                <select
                  id="task-priority"
                  name="task-priority"
                  value={newItemPriority}
                  onChange={(e) => setNewItemPriority(e.target.value as any)}
                  className="px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg font-body text-white focus:outline-none focus:border-gold/50"
                >
                  <option value="high" className="bg-navy">High Priority</option>
                  <option value="medium" className="bg-navy">Medium Priority</option>
                  <option value="low" className="bg-navy">Low Priority</option>
                </select>
                <DatePickerCompact
                  value={newItemDueDate}
                  onChange={setNewItemDueDate}
                  placeholder="Due date"
                  variant="dark"
                  minDate={new Date()}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={addItem}
                  className="px-6 py-3 bg-gold text-navy rounded-lg font-body font-medium"
                >
                  Add Task
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 bg-white/[0.05] text-white rounded-lg font-body"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Checklist by Category */}
        <div className="space-y-4">
          {defaultCategories.map(category => {
            const categoryItems = groupedItems[category];
            if (categoryItems.length === 0) return null;
            
            const isExpanded = expandedCategories.includes(category);
            const categoryCompleted = categoryItems.filter(i => i.completed).length;
            
            return (
              <div key={category} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-display text-lg" style={{ color: '#FFFFFF' }}>{category}</span>
                    <span className="px-2 py-1 rounded-full text-xs font-body bg-gold/20 text-gold">
                      {categoryCompleted}/{categoryItems.length}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-white/50" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/50" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="px-6 pb-4 space-y-2">
                    {categoryItems.map(item => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                          item.completed ? 'bg-green-500/10' : 'bg-white/[0.02]'
                        }`}
                      >
                        <button
                          onClick={() => toggleItem(item.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            item.completed 
                              ? 'bg-green-500 border-green-500' 
                              : 'border-white/30 hover:border-gold'
                          }`}
                          aria-label={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                          {item.completed && <Check className="w-4 h-4 text-white" />}
                        </button>
                        
                        <div className="flex-1">
                          <p className={`font-body ${item.completed ? 'line-through text-white/40' : 'text-white'}`}>
                            {item.title}
                          </p>
                          {item.dueDate && (
                            <p className="font-body text-xs flex items-center gap-1 mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              <Calendar className="w-3 h-3" />
                              {new Date(item.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        
                        <span className={`px-2 py-1 rounded text-xs font-body uppercase ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-red-400 hover:text-red-300 opacity-50 hover:opacity-100 transition-opacity"
                          aria-label="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* No Event Plan CTA */}
        {!eventPlan && (
          <div className="mt-8 p-6 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-center">
            <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-4" />
            <h3 className="font-display text-xl text-white mb-2">Create Your Event Plan</h3>
            <p className="text-white/60 mb-4">Use our step-by-step wizard to plan your event with detailed scheduling, service providers, and more.</p>
            <button
              onClick={() => setCurrentView('wizard')}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-lg font-medium transition-all"
            >
              Start Planning Wizard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanningChecklist;
