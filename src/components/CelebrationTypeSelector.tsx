import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronDown, Search, X, PartyPopper, Check, Heart, Briefcase, Sparkles,
  Globe, Zap, TrendingUp, Users, Scissors, Cake, BookOpen,
  CalendarDays, Trophy, Wine, Medal, GraduationCap,
  Sun, Flower2, Star, Flag, Building2, ChevronRight, ChevronLeft,
  Gift, Landmark,
} from 'lucide-react';

import {
  celebrationCategories,
  allCelebrationTypes,
  CelebrationType,
  CelebrationTab,
  celebrationTabs,
  getCategoriesForTab,
  getTabForCategory,
} from '@/data/celebrationTypes';

interface CelebrationTypeSelectorProps {
  value: string;
  onChange: (value: string, displayName?: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

// ─── Icon mapping for each category ──────────────────────────────────────────
const categoryIcons: Record<string, React.ReactNode> = {
  'weddings': <Heart className="w-5 h-5" />,
  'cultural-weddings': <Globe className="w-5 h-5" />,
  'pre-wedding': <Sparkles className="w-5 h-5" />,
  'corporate': <Building2 className="w-5 h-5" />,
  'brand-activation': <Zap className="w-5 h-5" />,
  'sales-marketing': <TrendingUp className="w-5 h-5" />,
  'team-building': <Users className="w-5 h-5" />,
  'business-ceremonies': <Scissors className="w-5 h-5" />,
  'birthdays': <Cake className="w-5 h-5" />,
  'religious': <BookOpen className="w-5 h-5" />,
  'baby': <Gift className="w-5 h-5" />,
  'anniversaries': <Heart className="w-5 h-5" />,
  'holidays': <CalendarDays className="w-5 h-5" />,
  'achievements': <Trophy className="w-5 h-5" />,
  'social': <Wine className="w-5 h-5" />,
  'sports': <Medal className="w-5 h-5" />,
  'charity': <Landmark className="w-5 h-5" />,
  'educational': <GraduationCap className="w-5 h-5" />,
  'seasonal': <Sun className="w-5 h-5" />,
  'memorial': <Flower2 className="w-5 h-5" />,
  'special-interest': <Star className="w-5 h-5" />,
  'political': <Flag className="w-5 h-5" />,
  'kids': <Gift className="w-5 h-5" />,

};

// ─── Color themes for each category ──────────────────────────────────────────
const categoryColors: Record<string, { bg: string; iconBg: string; text: string; border: string; activeBg: string }> = {
  'weddings': { bg: 'bg-rose-50', iconBg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200', activeBg: 'bg-rose-500' },
  'cultural-weddings': { bg: 'bg-pink-50', iconBg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200', activeBg: 'bg-pink-500' },
  'pre-wedding': { bg: 'bg-fuchsia-50', iconBg: 'bg-fuchsia-100', text: 'text-fuchsia-600', border: 'border-fuchsia-200', activeBg: 'bg-fuchsia-500' },
  'corporate': { bg: 'bg-blue-50', iconBg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200', activeBg: 'bg-blue-500' },
  'brand-activation': { bg: 'bg-violet-50', iconBg: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200', activeBg: 'bg-violet-500' },
  'sales-marketing': { bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200', activeBg: 'bg-indigo-500' },
  'team-building': { bg: 'bg-cyan-50', iconBg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-200', activeBg: 'bg-cyan-500' },
  'business-ceremonies': { bg: 'bg-sky-50', iconBg: 'bg-sky-100', text: 'text-sky-600', border: 'border-sky-200', activeBg: 'bg-sky-500' },
  'birthdays': { bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200', activeBg: 'bg-amber-500' },
  'religious': { bg: 'bg-purple-50', iconBg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200', activeBg: 'bg-purple-500' },
  'baby': { bg: 'bg-teal-50', iconBg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-200', activeBg: 'bg-teal-500' },
  'anniversaries': { bg: 'bg-red-50', iconBg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200', activeBg: 'bg-red-500' },
  'holidays': { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200', activeBg: 'bg-emerald-500' },
  'achievements': { bg: 'bg-yellow-50', iconBg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200', activeBg: 'bg-yellow-500' },
  'social': { bg: 'bg-orange-50', iconBg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200', activeBg: 'bg-orange-500' },
  'sports': { bg: 'bg-lime-50', iconBg: 'bg-lime-100', text: 'text-lime-600', border: 'border-lime-200', activeBg: 'bg-lime-500' },
  'charity': { bg: 'bg-pink-50', iconBg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200', activeBg: 'bg-pink-500' },
  'educational': { bg: 'bg-slate-50', iconBg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', activeBg: 'bg-slate-500' },
  'seasonal': { bg: 'bg-orange-50', iconBg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200', activeBg: 'bg-orange-500' },
  'memorial': { bg: 'bg-gray-50', iconBg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', activeBg: 'bg-gray-500' },
  'special-interest': { bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200', activeBg: 'bg-amber-500' },
  'political': { bg: 'bg-blue-50', iconBg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200', activeBg: 'bg-blue-500' },
  'kids': { bg: 'bg-green-50', iconBg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200', activeBg: 'bg-green-500' },
};

const defaultCatColor = { bg: 'bg-gray-50', iconBg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', activeBg: 'bg-gray-500' };

// ─── Tab config ──────────────────────────────────────────────────────────────
const tabConfig: Record<CelebrationTab, {
  icon: React.ReactNode;
  gradient: string;
  activeBg: string;
  activeText: string;
  ring: string;
  lightBg: string;
  description: string;
}> = {
  weddings: {
    icon: <Heart className="w-6 h-6" />,
    gradient: 'from-rose-500 to-pink-500',
    activeBg: 'bg-rose-50',
    activeText: 'text-rose-700',
    ring: 'ring-rose-300',
    lightBg: 'bg-rose-500/10',
    description: 'Weddings & Pre-Wedding',
  },
  corporate: {
    icon: <Briefcase className="w-6 h-6" />,
    gradient: 'from-blue-500 to-indigo-500',
    activeBg: 'bg-blue-50',
    activeText: 'text-blue-700',
    ring: 'ring-blue-300',
    lightBg: 'bg-blue-500/10',
    description: 'Business & Corporate',
  },
  celebrations: {
    icon: <PartyPopper className="w-6 h-6" />,
    gradient: 'from-amber-500 to-orange-500',
    activeBg: 'bg-amber-50',
    activeText: 'text-amber-700',
    ring: 'ring-amber-300',
    lightBg: 'bg-amber-500/10',
    description: 'Life Events & Parties',
  },
};

const CelebrationTypeSelector: React.FC<CelebrationTypeSelectorProps> = ({
  value,
  onChange,
  placeholder = 'What type of celebration?',
  className = '',
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CelebrationTab>('weddings');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCelebration = allCelebrationTypes.find((type) => type.id === value);

  useEffect(() => {
    if (isOpen && selectedCelebration) {
      const tab = getTabForCategory(selectedCelebration.category);
      if (tab) {
        setActiveTab(tab);
        setSelectedCategory(selectedCelebration.category);
      }
    }
  }, [isOpen, selectedCelebration]);

  const tabCategories = useMemo(() => getCategoriesForTab(activeTab), [activeTab]);

  const tabCounts = useMemo(() => {
    const counts: Record<CelebrationTab, number> = { weddings: 0, corporate: 0, celebrations: 0 };
    for (const tab of celebrationTabs) {
      const cats = getCategoriesForTab(tab.id);
      counts[tab.id] = cats.reduce((sum, cat) => sum + cat.types.length, 0);
    }
    return counts;
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return allCelebrationTypes.filter((type) =>
      type.name.toLowerCase().includes(lowerQuery)
    ).slice(0, 20);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setSelectedCategory(null);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        if (selectedCategory) {
          setSelectedCategory(null);
        } else {
          setIsOpen(false);
          setSearchQuery('');
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, selectedCategory]);

  const handleSelect = (type: CelebrationType) => {
    onChange(type.id, type.name);
    setIsOpen(false);
    setSearchQuery('');
    setSelectedCategory(null);
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange('', '');
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOpen) {
      setSelectedCategory(null);
      setSearchQuery('');
    }
    setIsOpen(!isOpen);
  };

  const selectedCatColors = selectedCelebration
    ? (categoryColors[selectedCelebration.category] || defaultCatColor)
    : null;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* ═══ Trigger Button ═══ */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={`w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl transition-all duration-300 hover:border-[#C9A24A]/40 focus:ring-2 focus:ring-[#C9A24A]/30 focus:border-[#C9A24A] focus:outline-none ${
          compact ? 'px-4 py-3 text-sm' : 'px-5 py-4'
        } ${isOpen ? 'border-[#C9A24A] ring-2 ring-[#C9A24A]/30 shadow-lg' : 'shadow-sm'}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 min-w-0">
          {selectedCelebration && selectedCatColors ? (
            <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${selectedCatColors.iconBg} ${selectedCatColors.text} flex items-center justify-center`}>
              {categoryIcons[selectedCelebration.category] || <PartyPopper className="w-5 h-5" />}
            </div>
          ) : (
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#C9A24A]/10 flex items-center justify-center">
              <PartyPopper className={`text-[#C9A24A] ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} strokeWidth={1.5} />
            </div>
          )}
          <div className="min-w-0">
            <span className={`block truncate ${selectedCelebration ? 'text-gray-900 font-medium' : 'text-gray-400'} ${compact ? 'text-sm' : 'text-[15px]'}`}>
              {selectedCelebration ? selectedCelebration.name : placeholder}
            </span>
            {selectedCelebration && (
              <span className="block text-[10px] text-gray-400 truncate">
                {celebrationCategories.find(c => c.id === selectedCelebration.category)?.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {selectedCelebration && (
            <button
              type="button"
              onClick={clearSelection}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* ═══ Dropdown Panel ═══ */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-slideDown"
          style={{ zIndex: 9999 }}
          role="listbox"
        >
          {/* ─── Search Bar ─── */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => { e.stopPropagation(); setSearchQuery(e.target.value); }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Search celebrations..."
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24A]/30 focus:border-[#C9A24A] transition-all text-gray-800 placeholder:text-gray-400"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSearchQuery(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* ─── Search Results ─── */}
          {searchQuery.trim() ? (
            <div className="max-h-80 overflow-y-auto overscroll-contain p-2">
              {searchResults.length === 0 ? (
                <div className="p-6 text-center">
                  <Search className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                  <p className="text-sm text-gray-500">No celebrations found</p>
                  <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {searchResults.map((type) => {
                    const catColors = categoryColors[type.category] || defaultCatColor;
                    const catName = celebrationCategories.find(c => c.id === type.category)?.name || '';
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleSelect(type)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-gray-50 ${
                          value === type.id ? 'bg-[#C9A24A]/5 ring-1 ring-[#C9A24A]/20' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg ${catColors.iconBg} ${catColors.text} flex items-center justify-center flex-shrink-0`}>
                          {categoryIcons[type.category] || <Star className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm block truncate ${value === type.id ? 'text-[#C9A24A] font-medium' : 'text-gray-800'}`}>
                            {type.name}
                          </span>
                          <span className="text-[10px] text-gray-400 block truncate">{catName}</span>
                        </div>
                        {value === type.id && <Check className="w-4 h-4 text-[#C9A24A] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : selectedCategory ? (
            /* ─── Types List (within a selected category) ─── */
            <div>
              {/* Back button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelectedCategory(null); }}
                className="w-full flex items-center gap-2 px-4 py-3 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Back to categories</span>
              </button>

              {/* Category header */}
              {(() => {
                const cat = celebrationCategories.find(c => c.id === selectedCategory);
                const catColors = categoryColors[selectedCategory] || defaultCatColor;
                if (!cat) return null;
                return (
                  <div className={`px-4 py-3 ${catColors.bg} border-b ${catColors.border} flex items-center gap-3`}>
                    <div className={`w-10 h-10 rounded-xl ${catColors.iconBg} ${catColors.text} flex items-center justify-center`}>
                      {categoryIcons[selectedCategory] || <Star className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className={`text-sm font-semibold ${catColors.text}`} style={{ fontFamily: 'Inter, sans-serif' }}>{cat.name}</h4>
                      <p className="text-[10px] text-gray-400">{cat.types.length} celebration types</p>
                    </div>
                  </div>
                );
              })()}

              {/* Types list */}
              <div className="max-h-64 overflow-y-auto overscroll-contain p-2">
                {(() => {
                  const cat = celebrationCategories.find(c => c.id === selectedCategory);
                  if (!cat) return null;
                  const catColors = categoryColors[selectedCategory] || defaultCatColor;
                  return (
                    <div className="space-y-0.5">
                      {cat.types.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => handleSelect(type)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                            value === type.id
                              ? `${catColors.bg} ring-1 ${catColors.border}`
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${value === type.id ? catColors.activeBg : 'bg-gray-200'}`} />
                            <span className={`text-sm truncate ${
                              value === type.id ? `${catColors.text} font-medium` : 'text-gray-700'
                            }`}>
                              {type.name}
                            </span>
                          </div>
                          {value === type.id && <Check className={`w-4 h-4 ${catColors.text} flex-shrink-0`} />}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            /* ─── Main View: Tabs + Category Icons ─── */
            <div>
              {/* ─── Tab Buttons (Beautiful large tappable icons) ─── */}
              <div className="p-3 pb-2">
                <div className="grid grid-cols-3 gap-2">
                  {celebrationTabs.map((tab) => {
                    const conf = tabConfig[tab.id];
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTab(tab.id); }}
                        className={`relative flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-xl border-2 transition-all duration-200 ${
                          isActive
                            ? `${conf.activeBg} ${conf.activeText} border-current shadow-sm`
                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                          isActive
                            ? `bg-gradient-to-br ${conf.gradient} text-white shadow-lg`
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {conf.icon}
                        </div>
                        <span className={`text-[11px] font-bold leading-tight text-center ${
                          isActive ? '' : 'text-gray-500'
                        }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                          {tab.label.split(' ')[0]}
                        </span>
                        <span className={`text-[9px] leading-tight text-center ${
                          isActive ? 'opacity-60' : 'text-gray-400'
                        }`}>
                          {tabCounts[tab.id]} types
                        </span>
                        {isActive && (
                          <div className={`absolute -bottom-px left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-gradient-to-r ${conf.gradient}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ─── Category Icon Grid ─── */}
              <div className="px-3 pb-1.5">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2 px-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Choose a category
                </p>
              </div>
              <div className="max-h-[280px] overflow-y-auto overscroll-contain px-3 pb-3">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {tabCategories.map((category) => {
                    const catColors = categoryColors[category.id] || defaultCatColor;
                    const isSelectedCat = selectedCelebration?.category === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedCategory(category.id); }}
                        className={`group relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95 ${
                          isSelectedCat
                            ? `${catColors.bg} ${catColors.border} border-2 shadow-sm`
                            : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                          isSelectedCat
                            ? `${catColors.activeBg} text-white shadow-md`
                            : `${catColors.iconBg} ${catColors.text} group-hover:scale-110`
                        }`}>
                          {categoryIcons[category.id] || <Star className="w-5 h-5" />}
                        </div>
                        <span className={`text-[10px] font-medium leading-tight text-center line-clamp-2 ${
                          isSelectedCat ? catColors.text : 'text-gray-600'
                        }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                          {category.name
                            .replace(' Events', '')
                            .replace(' Celebrations', '')
                            .replace(' Ceremonies', '')
                            .replace(' & Openings', '')
                            .replace(' & Employee', '')
                            .replace(' & Marketing', '')
                            .replace(' & Hobby', '')
                          }
                        </span>
                        <span className="text-[9px] text-gray-400">{category.types.length}</span>
                        {isSelectedCat && (
                          <div className={`absolute top-1 right-1 w-4 h-4 rounded-full ${catColors.activeBg} flex items-center justify-center`}>
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        <div className="absolute right-1.5 bottom-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="w-3 h-3 text-gray-300" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
                <p className="text-[10px] text-gray-400">
                  {tabCategories.length} categories · {tabCounts[activeTab]} types
                </p>
                <p className="text-[10px] text-gray-400">
                  {allCelebrationTypes.length} total celebrations
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CelebrationTypeSelector;
