import React, { useState, useRef, useCallback } from 'react';
import { 
  Building2, Flower2, UtensilsCrossed, Camera, Lightbulb, Palette, 
  Music, FileText, Armchair, Wine, Car, Shirt, X, Plus, GripVertical,
  Download, Save, Trash2, Edit2, Check, ChevronDown, ChevronUp,
  Image as ImageIcon, Search, Filter, Eye, EyeOff, Printer, Share2,
  PartyPopper, DoorOpen, Heart, Sparkles, FolderOpen, Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  MoodBoard, MoodBoardImage, MoodBoardCategory, EventSectionType,
  categoryConfig, eventSectionConfig, supplierGalleryImages, createEmptyMoodBoard 
} from '@/data/moodBoardData';

interface MoodBoardBuilderProps {
  eventId?: string;
  eventName?: string;
  onClose?: () => void;
  onSave?: (moodBoard: MoodBoard) => void;
}

const categoryIcons: Record<MoodBoardCategory, React.ReactNode> = {
  venue: <Building2 className="w-4 h-4" />,
  floral: <Flower2 className="w-4 h-4" />,
  catering: <UtensilsCrossed className="w-4 h-4" />,
  photography: <Camera className="w-4 h-4" />,
  lighting: <Lightbulb className="w-4 h-4" />,
  decor: <Palette className="w-4 h-4" />,
  entertainment: <Music className="w-4 h-4" />,
  stationery: <FileText className="w-4 h-4" />,
  furniture: <Armchair className="w-4 h-4" />,
  tableware: <Wine className="w-4 h-4" />,
  fashion: <Shirt className="w-4 h-4" />,
  transport: <Car className="w-4 h-4" />,
};

const sectionIcons: Record<EventSectionType, React.ReactNode> = {
  reception: <PartyPopper className="w-5 h-5" />,
  entrance: <DoorOpen className="w-5 h-5" />,
  ceremony: <Heart className="w-5 h-5" />,
  'after-party': <Music className="w-5 h-5" />,
  general: <Sparkles className="w-5 h-5" />,
};

const MoodBoardBuilder: React.FC<MoodBoardBuilderProps> = ({
  eventId,
  eventName = 'My Event',
  onClose,
  onSave,
}) => {
  const [moodBoard, setMoodBoard] = useState<MoodBoard>(() => 
    createEmptyMoodBoard(`${eventName} Mood Board`)
  );
  const [activeSection, setActiveSection] = useState<EventSectionType>('reception');
  const [selectedCategory, setSelectedCategory] = useState<MoodBoardCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGallery, setShowGallery] = useState(true);
  const [draggedItem, setDraggedItem] = useState<MoodBoardImage | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<EventSectionType>>(new Set());
  const [showPricing, setShowPricing] = useState(true);
  const [previewImage, setPreviewImage] = useState<MoodBoardImage | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Filter gallery images
  const filteredGalleryImages = supplierGalleryImages.filter(img => {
    const matchesCategory = selectedCategory === 'all' || img.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (img.supplierName && img.supplierName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: MoodBoardImage) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent, section: EventSectionType) => {
    e.preventDefault();
    if (draggedItem) {
      // Check if item already exists in this section
      const exists = moodBoard.sections[section].some(item => item.id === draggedItem.id);
      if (!exists) {
        const newItem = { ...draggedItem, id: `${draggedItem.id}-${Date.now()}` };
        setMoodBoard(prev => ({
          ...prev,
          sections: {
            ...prev.sections,
            [section]: [...prev.sections[section], newItem],
          },
          updatedAt: new Date().toISOString(),
        }));
      }
    }
    setDraggedItem(null);
  };

  const handleRemoveItem = (section: EventSectionType, itemId: string) => {
    setMoodBoard(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: prev.sections[section].filter(item => item.id !== itemId),
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleUpdateDescription = (section: EventSectionType, itemId: string, description: string) => {
    setMoodBoard(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: prev.sections[section].map(item =>
          item.id === itemId ? { ...item, description } : item
        ),
      },
      updatedAt: new Date().toISOString(),
    }));
    setEditingItem(null);
  };

  const toggleSectionCollapse = (section: EventSectionType) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Export to PDF
  const handleExportPDF = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const sections = Object.entries(moodBoard.sections)
      .filter(([_, items]) => items.length > 0)
      .map(([sectionKey, items]) => {
        const section = eventSectionConfig[sectionKey as EventSectionType];
        return `
          <div class="section" style="page-break-inside: avoid; margin-bottom: 40px;">
            <h2 style="color: ${section.color}; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid ${section.color}; padding-bottom: 10px;">
              ${section.label}
            </h2>
            <p style="color: #666; margin-bottom: 20px;">${section.description}</p>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
              ${items.map(item => `
                <div style="break-inside: avoid;">
                  <img src="${item.imageUrl}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" />
                  <h4 style="margin: 10px 0 5px; font-size: 14px;">${item.title}</h4>
                  <p style="font-size: 12px; color: #666; margin: 0;">${item.description}</p>
                  ${item.supplierName ? `<p style="font-size: 11px; color: #B8956A; margin-top: 5px;">Supplier: ${item.supplierName}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('');

    const colorPaletteHtml = moodBoard.colorPalette.map(color => 
      `<div style="width: 60px; height: 60px; background: ${color}; border-radius: 8px; border: 1px solid #ddd;"></div>`
    ).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${moodBoard.name} - Mood Board</title>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .section { page-break-inside: avoid; }
            }
            body {
              font-family: 'Georgia', serif;
              max-width: 1200px;
              margin: 0 auto;
              padding: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 60px;
              padding-bottom: 30px;
              border-bottom: 3px solid #B8956A;
            }
            .header h1 {
              font-size: 36px;
              color: #0B1426;
              margin-bottom: 10px;
            }
            .header p {
              color: #666;
              font-size: 16px;
            }
            .color-palette {
              display: flex;
              gap: 15px;
              justify-content: center;
              margin: 30px 0;
            }
            .notes {
              background: #f9f9f9;
              padding: 20px;
              border-radius: 8px;
              margin-top: 40px;
            }
            .footer {
              text-align: center;
              margin-top: 60px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #999;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${moodBoard.name}</h1>
            <p>${eventName} | Created: ${new Date(moodBoard.createdAt).toLocaleDateString()}</p>
            <div class="color-palette">
              ${colorPaletteHtml}
            </div>
          </div>
          ${sections}
          ${moodBoard.notes ? `
            <div class="notes">
              <h3 style="margin-bottom: 10px;">Notes</h3>
              <p>${moodBoard.notes}</p>
            </div>
          ` : ''}
          <div class="footer">
            <p>Generated by Event Planning Platform</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }, [moodBoard, eventName]);

  const handleSave = () => {
    if (onSave) {
      onSave(moodBoard);
    }
    // Also save to localStorage
    localStorage.setItem(`moodboard-${moodBoard.id}`, JSON.stringify(moodBoard));
  };

  const totalItems = Object.values(moodBoard.sections).reduce((acc, items) => acc + items.length, 0);

  return (
    <div className="min-h-screen pt-20" style={{ backgroundColor: '#0B1426' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'rgba(184, 149, 106, 0.2)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.6)' }} />
              </button>
              <div>
                <h1 className="text-2xl font-display" style={{ color: '#B8956A' }}>
                  {moodBoard.name}
                </h1>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {totalItems} items across {Object.values(moodBoard.sections).filter(s => s.length > 0).length} sections
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPricing(!showPricing)}
                className="border-amber-600/30 text-amber-200 hover:bg-amber-600/20"
              >
                {showPricing ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                {showPricing ? 'Hide Pricing' : 'Show Pricing'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                className="border-amber-600/30 text-amber-200 hover:bg-amber-600/20"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button
                size="sm"
                onClick={handleExportPDF}
                style={{ backgroundColor: '#B8956A' }}
                className="text-white hover:opacity-90"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Supplier Gallery */}
          <div 
            className={`transition-all duration-300 ${showGallery ? 'w-80' : 'w-12'}`}
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(184, 149, 106, 0.2)',
            }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                {showGallery && (
                  <h3 className="font-semibold" style={{ color: '#B8956A' }}>
                    Supplier Gallery
                  </h3>
                )}
                <button
                  onClick={() => setShowGallery(!showGallery)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <FolderOpen className="w-5 h-5" style={{ color: '#B8956A' }} />
                </button>
              </div>

              {showGallery && (
                <>
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search images..."
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedCategory === 'all'
                          ? 'bg-amber-600 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      All
                    </button>
                    {Object.entries(categoryConfig).slice(0, 6).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedCategory(key as MoodBoardCategory)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                          selectedCategory === key
                            ? 'text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                        style={selectedCategory === key ? { backgroundColor: config.color } : {}}
                      >
                        {categoryIcons[key as MoodBoardCategory]}
                        {config.label}
                      </button>
                    ))}
                  </div>

                  {/* More Categories Dropdown */}
                  <details className="mb-4">
                    <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60 mb-2">
                      More categories...
                    </summary>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(categoryConfig).slice(6).map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => setSelectedCategory(key as MoodBoardCategory)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                            selectedCategory === key
                              ? 'text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                          style={selectedCategory === key ? { backgroundColor: config.color } : {}}
                        >
                          {categoryIcons[key as MoodBoardCategory]}
                          {config.label}
                        </button>
                      ))}
                    </div>
                  </details>

                  {/* Image Grid */}
                  <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredGalleryImages.map((image) => (
                      <div
                        key={image.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, image)}
                        className="group relative rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        <img
                          src={image.imageUrl}
                          alt={image.title}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-white text-sm font-medium truncate">{image.title}</p>
                            {image.supplierName && (
                              <p className="text-xs" style={{ color: '#B8956A' }}>{image.supplierName}</p>
                            )}
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-5 h-5 text-white/80" />
                        </div>
                        <Badge 
                          className="absolute top-2 left-2 text-xs"
                          style={{ backgroundColor: categoryConfig[image.category].color }}
                        >
                          {categoryConfig[image.category].label}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Main Content - Mood Board Sections */}
          <div className="flex-1" ref={printRef}>
            {/* Section Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {(Object.keys(eventSectionConfig) as EventSectionType[]).map((section) => {
                const config = eventSectionConfig[section];
                const itemCount = moodBoard.sections[section].length;
                return (
                  <button
                    key={section}
                    onClick={() => setActiveSection(section)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                      activeSection === section
                        ? 'text-white shadow-lg'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                    style={activeSection === section ? { backgroundColor: config.color } : {}}
                  >
                    {sectionIcons[section]}
                    {config.label}
                    {itemCount > 0 && (
                      <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/20">
                        {itemCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Section Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, activeSection)}
              className="min-h-[400px] rounded-xl p-6 transition-all"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: draggedItem 
                  ? `2px dashed ${eventSectionConfig[activeSection].color}` 
                  : '1px solid rgba(184, 149, 106, 0.2)',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-display" style={{ color: eventSectionConfig[activeSection].color }}>
                    {eventSectionConfig[activeSection].label}
                  </h2>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {eventSectionConfig[activeSection].description}
                  </p>
                </div>
              </div>

              {moodBoard.sections[activeSection].length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'rgba(184, 149, 106, 0.1)' }}
                  >
                    <ImageIcon className="w-10 h-10" style={{ color: 'rgba(184, 149, 106, 0.5)' }} />
                  </div>
                  <p className="text-lg font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Drag images here
                  </p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Drop images from the supplier gallery to build your mood board
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {moodBoard.sections[activeSection].map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-lg overflow-hidden"
                      style={{ 
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <div className="relative">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-40 object-cover cursor-pointer"
                          onClick={() => setPreviewImage(item)}
                        />
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setPreviewImage(item)}
                            className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
                          >
                            <Maximize2 className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(activeSection, item.id)}
                            className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <Badge 
                          className="absolute top-2 left-2 text-xs"
                          style={{ backgroundColor: categoryConfig[item.category].color }}
                        >
                          {categoryConfig[item.category].label}
                        </Badge>
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-medium text-white truncate">{item.title}</h4>
                        {editingItem === item.id ? (
                          <div className="mt-2">
                            <Textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              placeholder="Add description..."
                              className="text-xs bg-white/5 border-white/10 text-white min-h-[60px]"
                            />
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateDescription(activeSection, item.id, editDescription)}
                                className="flex-1 h-7 text-xs"
                                style={{ backgroundColor: '#B8956A' }}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingItem(null)}
                                className="h-7 text-xs border-white/20 text-white/60"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p 
                              className="text-xs mt-1 line-clamp-2 cursor-pointer hover:text-white/80"
                              style={{ color: 'rgba(255,255,255,0.5)' }}
                              onClick={() => {
                                setEditingItem(item.id);
                                setEditDescription(item.description);
                              }}
                            >
                              {item.description || 'Click to add description...'}
                            </p>
                            {item.supplierName && (
                              <p className="text-xs mt-2" style={{ color: '#B8956A' }}>
                                {item.supplierName}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All Sections Overview */}
            <div className="mt-8">
              <h3 className="text-lg font-display mb-4" style={{ color: '#B8956A' }}>
                All Sections Overview
              </h3>
              <div className="space-y-4">
                {(Object.keys(eventSectionConfig) as EventSectionType[]).map((section) => {
                  const config = eventSectionConfig[section];
                  const items = moodBoard.sections[section];
                  const isCollapsed = collapsedSections.has(section);

                  if (items.length === 0) return null;

                  return (
                    <div
                      key={section}
                      className="rounded-xl overflow-hidden"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(184, 149, 106, 0.2)',
                      }}
                    >
                      <button
                        onClick={() => toggleSectionCollapse(section)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${config.color}20` }}
                          >
                            <span style={{ color: config.color }}>{sectionIcons[section]}</span>
                          </div>
                          <div className="text-left">
                            <h4 className="font-medium text-white">{config.label}</h4>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                              {items.length} items
                            </p>
                          </div>
                        </div>
                        {isCollapsed ? (
                          <ChevronDown className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.5)' }} />
                        ) : (
                          <ChevronUp className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.5)' }} />
                        )}
                      </button>
                      {!isCollapsed && (
                        <div className="p-4 pt-0">
                          <div className="flex gap-3 overflow-x-auto pb-2">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="flex-shrink-0 w-32 rounded-lg overflow-hidden cursor-pointer hover:ring-2 transition-all"
                                style={{ 
                                  backgroundColor: 'rgba(255,255,255,0.05)',
                                  ringColor: config.color,
                                }}
                                onClick={() => {
                                  setActiveSection(section);
                                  setPreviewImage(item);
                                }}
                              >
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
                                  className="w-full h-20 object-cover"
                                />
                                <p className="text-xs p-2 truncate text-white/70">{item.title}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Color Palette */}
            <div className="mt-8">
              <h3 className="text-lg font-display mb-4" style={{ color: '#B8956A' }}>
                Color Palette
              </h3>
              <div className="flex gap-4">
                {moodBoard.colorPalette.map((color, index) => (
                  <div key={index} className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg shadow-lg"
                      style={{ backgroundColor: color, border: '2px solid rgba(255,255,255,0.1)' }}
                    />
                    <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {color}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-8">
              <h3 className="text-lg font-display mb-4" style={{ color: '#B8956A' }}>
                Notes
              </h3>
              <Textarea
                value={moodBoard.notes}
                onChange={(e) => setMoodBoard(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add notes about your mood board..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <img
              src={previewImage.imageUrl}
              alt={previewImage.title}
              className="w-full max-h-[70vh] object-contain"
            />
            <div className="p-6" style={{ backgroundColor: '#0B1426' }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-display text-white">{previewImage.title}</h3>
                  <p className="mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {previewImage.description}
                  </p>
                  {previewImage.supplierName && (
                    <p className="mt-2" style={{ color: '#B8956A' }}>
                      Supplier: {previewImage.supplierName}
                    </p>
                  )}
                </div>
                <Badge style={{ backgroundColor: categoryConfig[previewImage.category].color }}>
                  {categoryConfig[previewImage.category].label}
                </Badge>
              </div>
              <div className="flex gap-2 mt-4">
                {previewImage.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-full text-xs"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(184, 149, 106, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(184, 149, 106, 0.5);
        }
      `}</style>
    </div>
  );
};

export default MoodBoardBuilder;
