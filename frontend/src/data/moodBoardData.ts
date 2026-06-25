// Mood Board Data Types and Sample Data

export interface MoodBoardImage {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  category: MoodBoardCategory;
  supplierId?: string;
  supplierName?: string;
  tags: string[];
  addedAt: string;
}

export interface MoodBoardSection {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  items: MoodBoardImage[];
}

export type MoodBoardCategory = 
  | 'venue'
  | 'floral'
  | 'catering'
  | 'photography'
  | 'lighting'
  | 'decor'
  | 'entertainment'
  | 'stationery'
  | 'furniture'
  | 'tableware'
  | 'fashion'
  | 'transport';

export type EventSectionType = 'reception' | 'entrance' | 'ceremony' | 'after-party' | 'general';

export interface MoodBoard {
  id: string;
  name: string;
  eventId?: string;
  createdAt: string;
  updatedAt: string;
  sections: {
    reception: MoodBoardImage[];
    entrance: MoodBoardImage[];
    ceremony: MoodBoardImage[];
    'after-party': MoodBoardImage[];
    general: MoodBoardImage[];
  };
  colorPalette: string[];
  notes: string;
}

export const categoryConfig: Record<MoodBoardCategory, { label: string; icon: string; color: string }> = {
  venue: { label: 'Venue', icon: 'Building2', color: '#6366F1' },
  floral: { label: 'Floral', icon: 'Flower2', color: '#EC4899' },
  catering: { label: 'Catering', icon: 'UtensilsCrossed', color: '#F59E0B' },
  photography: { label: 'Photography', icon: 'Camera', color: '#8B5CF6' },
  lighting: { label: 'Lighting', icon: 'Lightbulb', color: '#FBBF24' },
  decor: { label: 'Decor', icon: 'Palette', color: '#14B8A6' },
  entertainment: { label: 'Entertainment', icon: 'Music', color: '#EF4444' },
  stationery: { label: 'Stationery', icon: 'FileText', color: '#64748B' },
  furniture: { label: 'Furniture', icon: 'Armchair', color: '#A78BFA' },
  tableware: { label: 'Tableware', icon: 'Wine', color: '#F472B6' },
  fashion: { label: 'Fashion', icon: 'Shirt', color: '#C084FC' },
  transport: { label: 'Transport', icon: 'Car', color: '#22D3EE' },
};

export const eventSectionConfig: Record<EventSectionType, { label: string; description: string; color: string; icon: string }> = {
  reception: { 
    label: 'Reception', 
    description: 'Main event space, dining, and celebration area',
    color: '#B8956A',
    icon: 'PartyPopper'
  },
  entrance: { 
    label: 'Entrance', 
    description: 'Welcome area and first impressions',
    color: '#6366F1',
    icon: 'DoorOpen'
  },
  ceremony: { 
    label: 'Ceremony', 
    description: 'Formal ceremony and vows space',
    color: '#EC4899',
    icon: 'Heart'
  },
  'after-party': { 
    label: 'After Party', 
    description: 'Late night celebration and dancing',
    color: '#8B5CF6',
    icon: 'Music'
  },
  general: { 
    label: 'General', 
    description: 'Overall event styling and inspiration',
    color: '#14B8A6',
    icon: 'Sparkles'
  },
};

// Sample supplier images that can be pulled into the mood board
export const supplierGalleryImages: MoodBoardImage[] = [
  // Venue Images
  {
    id: 'sg-1',
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
    title: 'Grand Ballroom Setup',
    description: 'Elegant ballroom with crystal chandeliers and gold accents',
    category: 'venue',
    supplierId: 'sa-001',
    supplierName: 'The Mount Nelson',
    tags: ['luxury', 'classic', 'gold', 'ballroom'],
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sg-2',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    title: 'Garden Pavilion',
    description: 'Outdoor pavilion surrounded by lush gardens',
    category: 'venue',
    supplierId: 'sa-001',
    supplierName: 'The Mount Nelson',
    tags: ['outdoor', 'garden', 'romantic'],
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sg-3',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    title: 'Wine Estate Views',
    description: 'Panoramic views of Stellenbosch Valley',
    category: 'venue',
    supplierId: 'sa-002',
    supplierName: 'Delaire Graff Estate',
    tags: ['vineyard', 'views', 'mountains'],
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sg-4',
    imageUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800',
    title: 'French Château',
    description: 'Magnificent château with world-renowned art collection',
    category: 'venue',
    supplierId: 'fr-001',
    supplierName: 'Château de Chantilly',
    tags: ['historic', 'elegant', 'french'],
    addedAt: new Date().toISOString(),
  },
  // Floral Images
  {
    id: 'sg-5',
    imageUrl: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800',
    title: 'Romantic Rose Arrangement',
    description: 'Cascading roses with greenery accents',
    category: 'floral',
    supplierId: 'sa-005',
    supplierName: 'Bloom & Wild Florals',
    tags: ['roses', 'romantic', 'pink'],
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sg-6',
    imageUrl: 'https://images.unsplash.com/photo-1561128290-006dc4827214?w=800',
    title: 'Wildflower Centerpiece',
    description: 'Natural wildflower arrangement with local blooms',
    category: 'floral',
    supplierId: 'sa-005',
    supplierName: 'Bloom & Wild Florals',
    tags: ['wildflowers', 'natural', 'rustic'],
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sg-7',
    imageUrl: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800',
    title: 'Floral Arch',
    description: 'Stunning ceremony arch with cascading flowers',
    category: 'floral',
    tags: ['arch', 'ceremony', 'statement'],
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sg-8',
    imageUrl: 'https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?w=800',
    title: 'Table Garland',
    description: 'Lush greenery garland running down table',
    category: 'floral',
    tags: ['greenery', 'table', 'elegant'],
    addedAt: new Date().toISOString(),
  },
  // Catering Images
  {
    id: 'sg-9',
    imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800',
    title: 'Gourmet Plating',
    description: 'Fine dining presentation with artistic plating',
    category: 'catering',
    supplierId: 'cat-001',
    supplierName: "Reuben's Restaurant & Bar",
    tags: ['gourmet', 'elegant', 'fine-dining'],
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sg-10',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    title: 'Chef Table Experience',
    description: 'Interactive chef table dining experience',
    category: 'catering',
    supplierId: 'cat-001',
    supplierName: "Reuben's Restaurant & Bar",
    tags: ['interactive', 'chef', 'experience'],
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sg-11',
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800',
    title: 'Mediterranean Spread',
    description: 'Vibrant Middle Eastern-inspired cuisine',
    category: 'catering',
    supplierId: 'cat-002',
    supplierName: 'Ottolenghi Events',
    tags: ['mediterranean', 'colorful', 'fresh'],
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sg-12',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    title: 'Dessert Display',
    description: 'Stunning dessert station with artisan treats',
    category: 'catering',
    tags: ['dessert', 'sweet', 'display'],
    addedAt: new Date().toISOString(),
  },
  // Lighting Images
  {
    id: 'sg-13',
    imageUrl: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800',
    title: 'Fairy Light Canopy',
    description: 'Magical fairy light canopy over dance floor',
    category: 'lighting',
    supplierId: 'light-001',
    supplierName: 'Lumière Events',
    tags: ['fairy-lights', 'romantic', 'magical'],
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sg-14',
    imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    title: 'DJ Lighting Setup',
    description: 'Professional DJ booth with LED lighting',
    category: 'lighting',
    supplierId: 'light-001',
    supplierName: 'Lumière Events',
    tags: ['party', 'DJ', 'LED'],
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sg-15',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    title: 'Candlelit Ambiance',
    description: 'Warm candlelight creating intimate atmosphere',
    category: 'lighting',
    tags: ['candles', 'romantic', 'warm'],
    addedAt: new Date().toISOString(),
  },
  // Tableware & Decor
  {
    id: 'sg-16',
    imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
    title: 'Gold Table Setting',
    description: 'Elegant table setting with gold cutlery and chargers',
    category: 'tableware',
    tags: ['gold', 'elegant', 'formal'],
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sg-17',
    imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800',
    title: 'Rustic Table Decor',
    description: 'Natural wood and greenery table styling',
    category: 'decor',
    tags: ['rustic', 'natural', 'wood'],
    addedAt: new Date().toISOString(),
  },
  // Photography
  {
    id: 'sg-18',
    imageUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800',
    title: 'Romantic Portrait',
    description: 'Fine art wedding photography style',
    category: 'photography',
    supplierId: 'sa-004',
    supplierName: 'Jenni Elizabeth Photography',
    tags: ['portrait', 'romantic', 'fine-art'],
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sg-19',
    imageUrl: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800',
    title: 'Golden Hour Shot',
    description: 'Stunning golden hour couple portrait',
    category: 'photography',
    supplierId: 'sa-004',
    supplierName: 'Jenni Elizabeth Photography',
    tags: ['golden-hour', 'sunset', 'couple'],
    addedAt: new Date().toISOString(),
  },
  // Entertainment
  {
    id: 'sg-20',
    imageUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800',
    title: 'String Quartet',
    description: 'Elegant classical ensemble for ceremonies',
    category: 'entertainment',
    supplierId: 'ent-001',
    supplierName: 'The Muses String Quartet',
    tags: ['classical', 'elegant', 'ceremony'],
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sg-21',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    title: 'Live Band',
    description: 'High-energy live band performance',
    category: 'entertainment',
    tags: ['band', 'live-music', 'party'],
    addedAt: new Date().toISOString(),
  },
  // Transport
  {
    id: 'sg-22',
    imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800',
    title: 'Vintage Car',
    description: 'Classic vintage car for elegant arrivals',
    category: 'transport',
    supplierId: 'trans-001',
    supplierName: 'Classic Car Hire',
    tags: ['vintage', 'classic', 'elegant'],
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sg-23',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
    title: 'Luxury Sports Car',
    description: 'Modern luxury vehicle for stylish departures',
    category: 'transport',
    tags: ['luxury', 'modern', 'sports'],
    addedAt: new Date().toISOString(),
  },
  // Additional Venue Images
  {
    id: 'sg-24',
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
    title: 'Art Deco Ballroom',
    description: 'Legendary Art Deco hotel ballroom',
    category: 'venue',
    supplierId: 'uk-001',
    supplierName: "Claridge's",
    tags: ['art-deco', 'luxury', 'london'],
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sg-25',
    imageUrl: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800',
    title: 'Amalfi Coast Terrace',
    description: 'Historic villa terrace overlooking the coast',
    category: 'venue',
    supplierId: 'it-001',
    supplierName: 'Villa Cimbrone',
    tags: ['italy', 'coast', 'terrace'],
    addedAt: new Date().toISOString(),
  },
  // Furniture
  {
    id: 'sg-26',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    title: 'Lounge Seating',
    description: 'Comfortable lounge area for cocktail hour',
    category: 'furniture',
    tags: ['lounge', 'comfortable', 'cocktail'],
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sg-27',
    imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800',
    title: 'Chiavari Chairs',
    description: 'Classic gold Chiavari chairs for ceremony',
    category: 'furniture',
    tags: ['chairs', 'gold', 'classic'],
    addedAt: new Date().toISOString(),
  },
  // Stationery
  {
    id: 'sg-28',
    imageUrl: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800',
    title: 'Invitation Suite',
    description: 'Elegant calligraphy invitation suite',
    category: 'stationery',
    tags: ['invitations', 'calligraphy', 'elegant'],
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sg-29',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800',
    title: 'Place Cards',
    description: 'Hand-lettered place cards with gold accents',
    category: 'stationery',
    tags: ['place-cards', 'gold', 'hand-lettered'],
    addedAt: new Date().toISOString(),
  },
  // More Decor
  {
    id: 'sg-30',
    imageUrl: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800',
    title: 'Ceremony Backdrop',
    description: 'Stunning floral ceremony backdrop',
    category: 'decor',
    tags: ['backdrop', 'ceremony', 'floral'],
    addedAt: new Date().toISOString(),
  },
];

// Default empty mood board
export const createEmptyMoodBoard = (name: string = 'My Mood Board'): MoodBoard => ({
  id: `mb-${Date.now()}`,
  name,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sections: {
    reception: [],
    entrance: [],
    ceremony: [],
    'after-party': [],
    general: [],
  },
  colorPalette: ['#B8956A', '#0B1426', '#FFFFFF', '#E8E4DD', '#2C3E50'],
  notes: '',
});
