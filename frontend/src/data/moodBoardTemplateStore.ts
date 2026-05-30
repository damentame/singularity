import { MoodBoardImage } from '@/components/MomentMoodBoard';

export interface MoodBoardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  images: MoodBoardImage[];
  colorPalette: string[];
  createdAt: string;
  updatedAt: string;
  isBuiltIn: boolean;
  thumbnailUrl?: string;
}

const TEMPLATE_STORAGE_KEY = 'theone_moodboard_templates_v1';

// ─── PRE-BUILT STARTER TEMPLATES ────────────────────────────────────────────

const uid = () => `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
const imgId = (prefix: string, n: number) => `${prefix}-img-${n}`;

export const STARTER_TEMPLATES: MoodBoardTemplate[] = [
  {
    id: 'builtin-elegant-wedding',
    name: 'Elegant Wedding',
    description: 'Classic romance with soft florals, crystal chandeliers, and ivory & gold tones. Perfect for timeless wedding celebrations.',
    category: 'Wedding',
    colorPalette: ['#F5F0EB', '#C9A24A', '#8B6F47', '#2C1810', '#FFFFFF'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400',
    images: [
      { id: imgId('ew', 1), url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800', caption: 'Grand ballroom with crystal chandeliers', isAiGenerated: false, sortOrder: 0 },
      { id: imgId('ew', 2), url: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800', caption: 'Romantic rose centerpiece arrangement', isAiGenerated: false, sortOrder: 1 },
      { id: imgId('ew', 3), url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800', caption: 'Elegant gold table setting', isAiGenerated: false, sortOrder: 2 },
      { id: imgId('ew', 4), url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800', caption: 'Fairy light canopy over dance floor', isAiGenerated: false, sortOrder: 3 },
      { id: imgId('ew', 5), url: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800', caption: 'Stunning floral ceremony arch', isAiGenerated: false, sortOrder: 4 },
      { id: imgId('ew', 6), url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800', caption: 'Romantic fine art portrait', isAiGenerated: false, sortOrder: 5 },
    ],
  },
  {
    id: 'builtin-corporate-gala',
    name: 'Corporate Gala',
    description: 'Sophisticated black-tie affair with dramatic lighting, sleek table designs, and a modern luxury aesthetic.',
    category: 'Corporate',
    colorPalette: ['#0B1426', '#C9A24A', '#1A1A2E', '#FFFFFF', '#333333'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400',
    images: [
      { id: imgId('cg', 1), url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', caption: 'Art Deco ballroom setting', isAiGenerated: false, sortOrder: 0 },
      { id: imgId('cg', 2), url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800', caption: 'Professional DJ & lighting setup', isAiGenerated: false, sortOrder: 1 },
      { id: imgId('cg', 3), url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', caption: 'Chef table dining experience', isAiGenerated: false, sortOrder: 2 },
      { id: imgId('cg', 4), url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', caption: 'VIP lounge seating area', isAiGenerated: false, sortOrder: 3 },
      { id: imgId('cg', 5), url: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800', caption: 'String quartet for reception', isAiGenerated: false, sortOrder: 4 },
    ],
  },
  {
    id: 'builtin-garden-party',
    name: 'Garden Party',
    description: 'Lush outdoor celebration with wildflowers, natural wood elements, and a relaxed bohemian elegance.',
    category: 'Social',
    colorPalette: ['#4A7C59', '#F5E6D3', '#8B6F47', '#FFFFFF', '#D4A574'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    thumbnailUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
    images: [
      { id: imgId('gp', 1), url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', caption: 'Garden pavilion surrounded by lush greenery', isAiGenerated: false, sortOrder: 0 },
      { id: imgId('gp', 2), url: 'https://images.unsplash.com/photo-1561128290-006dc4827214?w=800', caption: 'Wildflower centerpiece with local blooms', isAiGenerated: false, sortOrder: 1 },
      { id: imgId('gp', 3), url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800', caption: 'Rustic natural wood table styling', isAiGenerated: false, sortOrder: 2 },
      { id: imgId('gp', 4), url: 'https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?w=800', caption: 'Lush greenery garland table runner', isAiGenerated: false, sortOrder: 3 },
      { id: imgId('gp', 5), url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800', caption: 'Fresh Mediterranean-inspired cuisine', isAiGenerated: false, sortOrder: 4 },
      { id: imgId('gp', 6), url: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800', caption: 'Golden hour couple portrait', isAiGenerated: false, sortOrder: 5 },
    ],
  },
  {
    id: 'builtin-tropical-celebration',
    name: 'Tropical Celebration',
    description: 'Vibrant island-inspired event with bold florals, lush palms, and a warm sunset colour palette.',
    category: 'Destination',
    colorPalette: ['#FF6B35', '#004E64', '#F5E6D3', '#25A18E', '#FFFFFF'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=400',
    images: [
      { id: imgId('tc', 1), url: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800', caption: 'Amalfi Coast terrace venue', isAiGenerated: false, sortOrder: 0 },
      { id: imgId('tc', 2), url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', caption: 'Panoramic mountain & vineyard views', isAiGenerated: false, sortOrder: 1 },
      { id: imgId('tc', 3), url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800', caption: 'Artisan dessert display station', isAiGenerated: false, sortOrder: 2 },
      { id: imgId('tc', 4), url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', caption: 'Live band performance', isAiGenerated: false, sortOrder: 3 },
      { id: imgId('tc', 5), url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800', caption: 'Vintage car arrival', isAiGenerated: false, sortOrder: 4 },
    ],
  },
  {
    id: 'builtin-minimalist-modern',
    name: 'Minimalist Modern',
    description: 'Clean lines, monochromatic palette, and architectural elegance for the design-conscious planner.',
    category: 'Modern',
    colorPalette: ['#FFFFFF', '#F0F0F0', '#333333', '#000000', '#C9A24A'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400',
    images: [
      { id: imgId('mm', 1), url: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800', caption: 'French Château with clean architecture', isAiGenerated: false, sortOrder: 0 },
      { id: imgId('mm', 2), url: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800', caption: 'Gourmet artistic plating', isAiGenerated: false, sortOrder: 1 },
      { id: imgId('mm', 3), url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', caption: 'Warm candlelit ambiance', isAiGenerated: false, sortOrder: 2 },
      { id: imgId('mm', 4), url: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800', caption: 'Elegant calligraphy invitation suite', isAiGenerated: false, sortOrder: 3 },
      { id: imgId('mm', 5), url: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800', caption: 'Classic gold Chiavari chairs', isAiGenerated: false, sortOrder: 4 },
    ],
  },
  {
    id: 'builtin-vineyard-romance',
    name: 'Vineyard Romance',
    description: 'Wine country elegance with rustic charm, barrel accents, and a warm earth-toned palette.',
    category: 'Wedding',
    colorPalette: ['#722F37', '#F5E6D3', '#8B6F47', '#4A7C59', '#FFFFFF'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    images: [
      { id: imgId('vr', 1), url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', caption: 'Wine estate with valley views', isAiGenerated: false, sortOrder: 0 },
      { id: imgId('vr', 2), url: 'https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?w=800', caption: 'Greenery table garland', isAiGenerated: false, sortOrder: 1 },
      { id: imgId('vr', 3), url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', caption: 'Chef table wine pairing dinner', isAiGenerated: false, sortOrder: 2 },
      { id: imgId('vr', 4), url: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800', caption: 'String quartet at sunset', isAiGenerated: false, sortOrder: 3 },
      { id: imgId('vr', 5), url: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800', caption: 'Hand-lettered place cards', isAiGenerated: false, sortOrder: 4 },
      { id: imgId('vr', 6), url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800', caption: 'Luxury departure vehicle', isAiGenerated: false, sortOrder: 5 },
    ],
  },
  {
    id: 'builtin-bohemian-chic',
    name: 'Bohemian Chic',
    description: 'Free-spirited elegance with macramé, dried flowers, warm textiles, and earthy tones.',
    category: 'Social',
    colorPalette: ['#D4A574', '#F5E6D3', '#8B6F47', '#C9A24A', '#FFFFFF'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400',
    images: [
      { id: imgId('bc', 1), url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800', caption: 'Natural wood & greenery table decor', isAiGenerated: false, sortOrder: 0 },
      { id: imgId('bc', 2), url: 'https://images.unsplash.com/photo-1561128290-006dc4827214?w=800', caption: 'Wildflower boho centerpiece', isAiGenerated: false, sortOrder: 1 },
      { id: imgId('bc', 3), url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', caption: 'Comfortable lounge seating', isAiGenerated: false, sortOrder: 2 },
      { id: imgId('bc', 4), url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', caption: 'Candlelit intimate ambiance', isAiGenerated: false, sortOrder: 3 },
      { id: imgId('bc', 5), url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', caption: 'Outdoor garden setting', isAiGenerated: false, sortOrder: 4 },
    ],
  },
  {
    id: 'builtin-royal-affair',
    name: 'Royal Affair',
    description: 'Opulent grandeur with rich jewel tones, ornate details, and a regal atmosphere fit for royalty.',
    category: 'Luxury',
    colorPalette: ['#1A0A2E', '#C9A24A', '#722F37', '#FFFFFF', '#4A1942'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400',
    images: [
      { id: imgId('ra', 1), url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800', caption: 'Grand ballroom with crystal chandeliers', isAiGenerated: false, sortOrder: 0 },
      { id: imgId('ra', 2), url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', caption: 'Art Deco luxury hotel ballroom', isAiGenerated: false, sortOrder: 1 },
      { id: imgId('ra', 3), url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800', caption: 'Gold chargers & crystal glassware', isAiGenerated: false, sortOrder: 2 },
      { id: imgId('ra', 4), url: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800', caption: 'Cascading rose arrangement', isAiGenerated: false, sortOrder: 3 },
      { id: imgId('ra', 5), url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800', caption: 'Magical fairy light canopy', isAiGenerated: false, sortOrder: 4 },
      { id: imgId('ra', 6), url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800', caption: 'Classic vintage arrival car', isAiGenerated: false, sortOrder: 5 },
    ],
  },
];

// ─── STORAGE OPERATIONS ─────────────────────────────────────────────────────

const loadUserTemplates = (): MoodBoardTemplate[] => {
  try {
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

const saveUserTemplates = (templates: MoodBoardTemplate[]) => {
  localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
};

export const getAllTemplates = (): MoodBoardTemplate[] => {
  const userTemplates = loadUserTemplates();
  return [...STARTER_TEMPLATES, ...userTemplates];
};

export const getUserTemplates = (): MoodBoardTemplate[] => {
  return loadUserTemplates();
};

export const saveTemplate = (template: Omit<MoodBoardTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltIn'>): MoodBoardTemplate => {
  const newTemplate: MoodBoardTemplate = {
    ...template,
    id: uid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isBuiltIn: false,
    thumbnailUrl: template.images[0]?.url || '',
  };
  const existing = loadUserTemplates();
  existing.push(newTemplate);
  saveUserTemplates(existing);
  return newTemplate;
};

export const updateTemplate = (id: string, updates: Partial<MoodBoardTemplate>): MoodBoardTemplate | null => {
  const existing = loadUserTemplates();
  const idx = existing.findIndex(t => t.id === id);
  if (idx === -1) return null;
  existing[idx] = { ...existing[idx], ...updates, updatedAt: new Date().toISOString() };
  saveUserTemplates(existing);
  return existing[idx];
};

export const deleteTemplate = (id: string): boolean => {
  const existing = loadUserTemplates();
  const filtered = existing.filter(t => t.id !== id);
  if (filtered.length === existing.length) return false;
  saveUserTemplates(filtered);
  return true;
};

export const duplicateTemplate = (id: string): MoodBoardTemplate | null => {
  const all = getAllTemplates();
  const source = all.find(t => t.id === id);
  if (!source) return null;
  return saveTemplate({
    name: `${source.name} (Copy)`,
    description: source.description,
    category: source.category,
    images: source.images.map(img => ({ ...img, id: `${img.id}-copy-${Date.now()}` })),
    colorPalette: [...source.colorPalette],
    thumbnailUrl: source.thumbnailUrl,
  });
};

export const exportTemplates = (templateIds: string[]): string => {
  const all = getAllTemplates();
  const toExport = all.filter(t => templateIds.includes(t.id));
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), templates: toExport }, null, 2);
};

export const exportAllTemplates = (): string => {
  const userTemplates = loadUserTemplates();
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), templates: userTemplates }, null, 2);
};

export const importTemplates = (jsonString: string): { imported: number; errors: string[] } => {
  const errors: string[] = [];
  let imported = 0;
  try {
    const data = JSON.parse(jsonString);
    if (!data.templates || !Array.isArray(data.templates)) {
      errors.push('Invalid template file format');
      return { imported, errors };
    }
    const existing = loadUserTemplates();
    const existingIds = new Set(existing.map(t => t.id));
    
    for (const tpl of data.templates) {
      if (!tpl.name || !tpl.images || !Array.isArray(tpl.images)) {
        errors.push(`Skipped invalid template: ${tpl.name || 'unnamed'}`);
        continue;
      }
      const newId = uid();
      const newTemplate: MoodBoardTemplate = {
        id: newId,
        name: tpl.name,
        description: tpl.description || '',
        category: tpl.category || 'Imported',
        images: (tpl.images || []).map((img: any, i: number) => ({
          id: `${newId}-img-${i}`,
          url: img.url || '',
          caption: img.caption || '',
          isAiGenerated: img.isAiGenerated || false,
          prompt: img.prompt || '',
          sortOrder: img.sortOrder ?? i,
        })),
        colorPalette: tpl.colorPalette || ['#C9A24A', '#0B1426', '#FFFFFF', '#E8E4DD', '#2C3E50'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isBuiltIn: false,
        thumbnailUrl: tpl.thumbnailUrl || tpl.images?.[0]?.url || '',
      };
      existing.push(newTemplate);
      imported++;
    }
    saveUserTemplates(existing);
  } catch (e: any) {
    errors.push(`Parse error: ${e.message}`);
  }
  return { imported, errors };
};

export const applyTemplateToMoment = (templateId: string): MoodBoardImage[] => {
  const all = getAllTemplates();
  const template = all.find(t => t.id === templateId);
  if (!template) return [];
  // Return deep-cloned images with new IDs so they're independent
  return template.images.map((img, i) => ({
    ...img,
    id: `applied-${Date.now()}-${Math.random().toString(36).substr(2, 6)}-${i}`,
  }));
};
