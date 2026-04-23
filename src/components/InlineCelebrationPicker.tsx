import React, { useState, useMemo } from 'react';
import {
  Heart, Briefcase, PartyPopper, ChevronRight, ChevronLeft, Search, X,
  Globe, Sparkles, Zap, TrendingUp, Users, Scissors, Cake, BookOpen,
  CalendarDays, Trophy, Wine, Medal, GraduationCap, Sun, Flower2, Star,
  Flag, Building2, Gift, Landmark,
} from 'lucide-react';

import {
  celebrationCategories,
  allCelebrationTypes,
  CelebrationType,
  CelebrationTab,
  celebrationTabs,
  getCategoriesForTab,
} from '@/data/celebrationTypes';

interface InlineCelebrationPickerProps {
  onSelect: (celebrationType: CelebrationType) => void;
  disabled?: boolean;
}

// ─── Icon mapping ──────────────────────────────────────────────────────────
const categoryIcons: Record<string, React.ReactNode> = {
  'weddings': <Heart className="w-6 h-6" />,
  'cultural-weddings': <Globe className="w-6 h-6" />,
  'pre-wedding': <Sparkles className="w-6 h-6" />,
  'corporate': <Building2 className="w-6 h-6" />,
  'brand-activation': <Zap className="w-6 h-6" />,
  'sales-marketing': <TrendingUp className="w-6 h-6" />,
  'team-building': <Users className="w-6 h-6" />,
  'business-ceremonies': <Scissors className="w-6 h-6" />,
  'birthdays': <Cake className="w-6 h-6" />,
  'religious': <BookOpen className="w-6 h-6" />,
  'baby': <Gift className="w-6 h-6" />,
  'anniversaries': <Heart className="w-6 h-6" />,
  'holidays': <CalendarDays className="w-6 h-6" />,
  'achievements': <Trophy className="w-6 h-6" />,
  'social': <Wine className="w-6 h-6" />,
  'sports': <Medal className="w-6 h-6" />,
  'charity': <Landmark className="w-6 h-6" />,
  'educational': <GraduationCap className="w-6 h-6" />,
  'seasonal': <Sun className="w-6 h-6" />,
  'memorial': <Flower2 className="w-6 h-6" />,
  'special-interest': <Star className="w-6 h-6" />,
  'political': <Flag className="w-6 h-6" />,
  'kids': <Gift className="w-6 h-6" />,
};

// ─── Color themes ──────────────────────────────────────────────────────────
const categoryColors: Record<string, { gradient: string; text: string; glow: string; border: string }> = {
  'weddings': { gradient: 'from-rose-500 to-pink-500', text: 'text-rose-300', glow: 'rgba(244,63,94,0.3)', border: 'border-rose-500/30' },
  'cultural-weddings': { gradient: 'from-pink-500 to-fuchsia-500', text: 'text-pink-300', glow: 'rgba(236,72,153,0.3)', border: 'border-pink-500/30' },
  'pre-wedding': { gradient: 'from-fuchsia-500 to-purple-500', text: 'text-fuchsia-300', glow: 'rgba(192,38,211,0.3)', border: 'border-fuchsia-500/30' },
  'corporate': { gradient: 'from-blue-500 to-indigo-500', text: 'text-blue-300', glow: 'rgba(59,130,246,0.3)', border: 'border-blue-500/30' },
  'brand-activation': { gradient: 'from-violet-500 to-purple-500', text: 'text-violet-300', glow: 'rgba(139,92,246,0.3)', border: 'border-violet-500/30' },
  'sales-marketing': { gradient: 'from-indigo-500 to-blue-500', text: 'text-indigo-300', glow: 'rgba(99,102,241,0.3)', border: 'border-indigo-500/30' },
  'team-building': { gradient: 'from-cyan-500 to-teal-500', text: 'text-cyan-300', glow: 'rgba(6,182,212,0.3)', border: 'border-cyan-500/30' },
  'business-ceremonies': { gradient: 'from-sky-500 to-blue-500', text: 'text-sky-300', glow: 'rgba(14,165,233,0.3)', border: 'border-sky-500/30' },
  'birthdays': { gradient: 'from-amber-500 to-orange-500', text: 'text-amber-300', glow: 'rgba(245,158,11,0.3)', border: 'border-amber-500/30' },
  'religious': { gradient: 'from-purple-500 to-indigo-500', text: 'text-purple-300', glow: 'rgba(168,85,247,0.3)', border: 'border-purple-500/30' },
  'baby': { gradient: 'from-teal-500 to-emerald-500', text: 'text-teal-300', glow: 'rgba(20,184,166,0.3)', border: 'border-teal-500/30' },
  'anniversaries': { gradient: 'from-red-500 to-rose-500', text: 'text-red-300', glow: 'rgba(239,68,68,0.3)', border: 'border-red-500/30' },
  'holidays': { gradient: 'from-emerald-500 to-green-500', text: 'text-emerald-300', glow: 'rgba(16,185,129,0.3)', border: 'border-emerald-500/30' },
  'achievements': { gradient: 'from-yellow-500 to-amber-500', text: 'text-yellow-300', glow: 'rgba(234,179,8,0.3)', border: 'border-yellow-500/30' },
  'social': { gradient: 'from-orange-500 to-red-500', text: 'text-orange-300', glow: 'rgba(249,115,22,0.3)', border: 'border-orange-500/30' },
  'sports': { gradient: 'from-lime-500 to-green-500', text: 'text-lime-300', glow: 'rgba(132,204,22,0.3)', border: 'border-lime-500/30' },
  'charity': { gradient: 'from-pink-500 to-rose-500', text: 'text-pink-300', glow: 'rgba(236,72,153,0.3)', border: 'border-pink-500/30' },
  'educational': { gradient: 'from-slate-500 to-gray-500', text: 'text-slate-300', glow: 'rgba(100,116,139,0.3)', border: 'border-slate-500/30' },
  'seasonal': { gradient: 'from-orange-500 to-amber-500', text: 'text-orange-300', glow: 'rgba(249,115,22,0.3)', border: 'border-orange-500/30' },
  'memorial': { gradient: 'from-gray-500 to-slate-500', text: 'text-gray-300', glow: 'rgba(107,114,128,0.3)', border: 'border-gray-500/30' },
  'special-interest': { gradient: 'from-amber-500 to-yellow-500', text: 'text-amber-300', glow: 'rgba(245,158,11,0.3)', border: 'border-amber-500/30' },
  'political': { gradient: 'from-blue-500 to-sky-500', text: 'text-blue-300', glow: 'rgba(59,130,246,0.3)', border: 'border-blue-500/30' },
  'kids': { gradient: 'from-green-500 to-emerald-500', text: 'text-green-300', glow: 'rgba(34,197,94,0.3)', border: 'border-green-500/30' },
};

const defaultCatColor = { gradient: 'from-gray-500 to-gray-600', text: 'text-gray-300', glow: 'rgba(107,114,128,0.3)', border: 'border-gray-500/30' };

// ─── Tab config ──────────────────────────────────────────────────────────
const tabConfig: Record<CelebrationTab, {
  icon: React.ReactNode;
  gradient: string;
  glowColor: string;
  description: string;
  image: string;
}> = {
  weddings: {
    icon: <Heart className="w-8 h-8" />,
    gradient: 'from-rose-500 to-pink-500',
    glowColor: 'rgba(244,63,94,0.25)',
    description: 'Weddings & Pre-Wedding Events',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=60',
  },
  corporate: {
    icon: <Briefcase className="w-8 h-8" />,
    gradient: 'from-blue-500 to-indigo-500',
    glowColor: 'rgba(59,130,246,0.25)',
    description: 'Business & Corporate Events',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=60',
  },
  celebrations: {
    icon: <PartyPopper className="w-8 h-8" />,
    gradient: 'from-amber-500 to-orange-500',
    glowColor: 'rgba(245,158,11,0.25)',
    description: 'Life Events & Celebrations',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=60',
  },
};

const InlineCelebrationPicker: React.FC<InlineCelebrationPickerProps> = ({ onSelect, disabled = false }) => {
  const [activeTab, setActiveTab] = useState<CelebrationTab>('weddings');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    const q = searchQuery.toLowerCase();
    return allCelebrationTypes.filter(t => t.name.toLowerCase().includes(q)).slice(0, 15);
  }, [searchQuery]);

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    setSearchQuery('');
  };

  const handleBack = () => {
    setSelectedCategory(null);
  };

  const handleTabChange = (tab: CelebrationTab) => {
    setActiveTab(tab);
    setSelectedCategory(null);
    setSearchQuery('');
  };

  return (
    <div className={`transition-all duration-500 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      {/* ═══ Search Bar ═══ */}
      <div className="max-w-xl mx-auto mb-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 800+ celebration types..."
            className="w-full pl-12 pr-12 py-4 rounded-2xl text-white placeholder:text-white/30 text-base outline-none transition-all duration-300 focus:ring-2 focus:ring-[#C9A24A]/40"
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/40" />
            </button>
          )}
        </div>

        {/* Search Results */}
        {searchQuery.trim() && (
          <div
            className="mt-3 rounded-2xl overflow-hidden max-h-80 overflow-y-auto"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {searchResults.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-10 h-10 mx-auto mb-3 text-white/15" />
                <p className="text-white/40 text-sm">No celebrations found</p>
              </div>
            ) : (
              searchResults.map((type) => {
                const colors = categoryColors[type.category] || defaultCatColor;
                const catName = celebrationCategories.find(c => c.id === type.category)?.name || '';
                return (
                  <button
                    key={type.id}
                    onClick={() => onSelect(type)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 text-left transition-all hover:bg-white/5 border-b border-white/5 last:border-b-0"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center flex-shrink-0 text-white`}>
                      {categoryIcons[type.category] || <Star className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-white text-sm font-medium block truncate">{type.name}</span>
                      <span className="text-white/30 text-xs block truncate">{catName}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ═══ Tab Buttons ═══ */}
      {!searchQuery.trim() && !selectedCategory && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto mb-12">
            {celebrationTabs.map((tab) => {
              const conf = tabConfig[tab.id];
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`group relative overflow-hidden rounded-2xl transition-all duration-500 transform ${
                    isActive
                      ? 'scale-[1.02] ring-2 ring-white/20'
                      : 'hover:scale-[1.01] opacity-70 hover:opacity-90'
                  }`}
                  style={{
                    boxShadow: isActive ? `0 8px 40px ${conf.glowColor}` : 'none',
                  }}
                >
                  {/* Background Image */}
                  <div className="aspect-[16/9] md:aspect-[4/3] overflow-hidden">
                    <img
                      src={conf.image}
                      alt={tab.label}
                      className={`w-full h-full object-cover transition-transform duration-700 ${
                        isActive ? 'scale-110' : 'group-hover:scale-105'
                      }`}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t from-[#0B1426] via-[#0B1426]/80 to-transparent`} />
                    {/* Color accent overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${conf.gradient} transition-opacity duration-500 ${
                      isActive ? 'opacity-30' : 'opacity-10 group-hover:opacity-20'
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                    {/* Icon */}
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${conf.gradient} flex items-center justify-center mb-4 transition-all duration-500 ${
                      isActive ? 'shadow-xl scale-110' : 'group-hover:scale-105'
                    }`}
                      style={{ boxShadow: isActive ? `0 4px 20px ${conf.glowColor}` : 'none' }}
                    >
                      <span className="text-white">{conf.icon}</span>
                    </div>

                    {/* Label */}
                    <h3
                      className="text-2xl md:text-3xl font-light tracking-wide mb-1"
                      style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#FFFFFF' }}
                    >
                      {tab.label.split(' ')[0]}
                    </h3>
                    <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-2" style={{ fontFamily: '"Inter", sans-serif' }}>
                      {conf.description}
                    </p>
                    <span className="text-white/40 text-[10px] uppercase tracking-widest">
                      {tabCounts[tab.id]} types
                    </span>

                    {/* Active indicator */}
                    {isActive && (
                      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${conf.gradient}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ═══ Category Grid ═══ */}
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <p className="text-white/40 text-xs uppercase tracking-[0.2em]" style={{ fontFamily: '"Inter", sans-serif' }}>
                Choose a category
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {tabCategories.map((category) => {
                const colors = categoryColors[category.id] || defaultCatColor;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className="group relative flex flex-col items-center gap-3 p-5 md:p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px ${colors.glow}`;
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                    }}
                  >
                    {/* Icon */}
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}
                      style={{ boxShadow: `0 2px 12px ${colors.glow}` }}
                    >
                      <span className="text-white">
                        {categoryIcons[category.id] || <Star className="w-6 h-6" />}
                      </span>
                    </div>

                    {/* Label */}
                    <span
                      className="text-white/80 text-xs font-medium text-center leading-tight group-hover:text-white transition-colors line-clamp-2"
                      style={{ fontFamily: '"Inter", sans-serif' }}
                    >
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

                    {/* Count */}
                    <span className="text-white/25 text-[10px]">{category.types.length} types</span>

                    {/* Hover arrow */}
                    <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ═══ Drill-down: Types within a Category ═══ */}
      {!searchQuery.trim() && selectedCategory && (
        <div className="max-w-4xl mx-auto">
          {/* Back button + Category header */}
          {(() => {
            const cat = celebrationCategories.find(c => c.id === selectedCategory);
            const colors = categoryColors[selectedCategory] || defaultCatColor;
            if (!cat) return null;
            return (
              <div className="mb-8">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors mb-6 group"
                  style={{ fontFamily: '"Inter", sans-serif' }}
                >
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="uppercase tracking-wider text-xs">Back to categories</span>
                </button>

                <div className="flex items-center gap-5">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg`}
                    style={{ boxShadow: `0 4px 20px ${colors.glow}` }}
                  >
                    <span className="text-white">
                      {categoryIcons[selectedCategory] || <Star className="w-7 h-7" />}
                    </span>
                  </div>
                  <div>
                    <h3
                      className="text-3xl md:text-4xl font-light text-white tracking-wide"
                      style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                    >
                      {cat.name}
                    </h3>
                    <p className="text-white/40 text-sm mt-1" style={{ fontFamily: '"Inter", sans-serif' }}>
                      {cat.types.length} celebration types — tap to select
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Types grid */}
          {(() => {
            const cat = celebrationCategories.find(c => c.id === selectedCategory);
            const colors = categoryColors[selectedCategory] || defaultCatColor;
            if (!cat) return null;
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.types.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => onSelect(type)}
                    className={`group flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${colors.border}`}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)';
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${colors.glow}`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${colors.gradient} flex-shrink-0 group-hover:scale-125 transition-transform`} />
                    <span className="text-white/80 text-sm font-medium group-hover:text-white transition-colors flex-1" style={{ fontFamily: '"Inter", sans-serif' }}>
                      {type.name}
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default InlineCelebrationPicker;
