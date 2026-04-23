// Supplier Details Data Types and Default Values

export interface CompanyDetails {
  companyName: string;
  tradingName?: string;
  registrationNumber?: string;
  vatNumber?: string;
  vatRegistered: boolean;
  physicalAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  postalAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  sameAsPhysical: boolean;
}

export interface ContactPerson {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  mobile?: string;
  isPrimary: boolean;
  department?: string;
}

export interface BankingDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  swiftCode?: string;
  iban?: string;
  accountType: 'current' | 'savings' | 'business';
}

export interface SupplierTodo {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface SupplierComment {
  id: string;
  text: string;
  author: string;
  authorRole: 'host' | 'coordinator' | 'supplier';
  createdAt: string;
  isPrivate: boolean;
}

export interface SupplierDocument {
  id: string;
  name: string;
  type: 'contract' | 'invoice' | 'quote' | 'certificate' | 'insurance' | 'other';
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface MoodBoardItem {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  category: string;
  supplierName?: string;
  supplierId?: string;
  eventSection: 'reception' | 'entrance' | 'ceremony' | 'after-party' | 'general';
  tags: string[];
}

export interface SupplierFullDetails {
  id: string;
  companyDetails: CompanyDetails;
  contacts: ContactPerson[];
  bankingDetails?: BankingDetails;
  todos: SupplierTodo[];
  comments: SupplierComment[];
  documents: SupplierDocument[];
  servicesOffered: {
    corporate: boolean;
    weddings: boolean;
    celebrations: boolean;
    other: string[];
  };
  visibilitySettings: {
    showPricing: boolean;
    showBankingDetails: boolean;
    showPhysicalAddress: boolean;
    showVatNumber: boolean;
    showRegistrationNumber: boolean;
    showContactDetails: boolean;
  };
}

export const defaultVisibilitySettings = {
  showPricing: true,
  showBankingDetails: false,
  showPhysicalAddress: true,
  showVatNumber: true,
  showRegistrationNumber: true,
  showContactDetails: true,
};

export const eventSections = [
  { id: 'reception', label: 'Reception', description: 'Main event space and dining area' },
  { id: 'entrance', label: 'Entrance', description: 'Welcome area and arrival experience' },
  { id: 'ceremony', label: 'Ceremony', description: 'Formal ceremony space' },
  { id: 'after-party', label: 'After Party', description: 'Late night celebration area' },
  { id: 'general', label: 'General', description: 'Overall event styling' },
];

export const moodBoardCategories = [
  { id: 'venue', label: 'Venue', icon: 'Building2' },
  { id: 'floral', label: 'Floral', icon: 'Flower2' },
  { id: 'catering', label: 'Catering', icon: 'UtensilsCrossed' },
  { id: 'photography', label: 'Photography', icon: 'Camera' },
  { id: 'lighting', label: 'Lighting', icon: 'Lightbulb' },
  { id: 'decor', label: 'Decor', icon: 'Palette' },
  { id: 'entertainment', label: 'Entertainment', icon: 'Music' },
  { id: 'stationery', label: 'Stationery', icon: 'FileText' },
  { id: 'furniture', label: 'Furniture', icon: 'Armchair' },
  { id: 'tableware', label: 'Tableware', icon: 'Wine' },
];

export const supplierDetailSections = [
  { id: 'company', label: 'Company Information', icon: 'Building2' },
  { id: 'contacts', label: 'Contact Persons', icon: 'Users' },
  { id: 'banking', label: 'Banking Details', icon: 'CreditCard' },
  { id: 'documents', label: 'Documents & Files', icon: 'FolderOpen' },
  { id: 'services', label: 'Services Offered', icon: 'Briefcase' },
  { id: 'todos', label: 'To-Do List', icon: 'CheckSquare' },
  { id: 'comments', label: 'Comments & Notes', icon: 'MessageSquare' },
];

export const saveOptions = [
  { id: 'local', label: 'Save Locally', description: 'Save to your device', icon: 'HardDrive' },
  { id: 'cloud', label: 'Save to Cloud', description: 'Sync across devices', icon: 'Cloud' },
  { id: 'export', label: 'Export Data', description: 'Download as file', icon: 'Download' },
];

// Sample mood board items for demonstration
export const sampleMoodBoardItems: MoodBoardItem[] = [
  {
    id: 'mb-1',
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400',
    title: 'Elegant Ballroom Setup',
    description: 'Grand ballroom with crystal chandeliers and gold accents',
    category: 'venue',
    eventSection: 'reception',
    tags: ['luxury', 'classic', 'gold'],
  },
  {
    id: 'mb-2',
    imageUrl: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400',
    title: 'Romantic Floral Arch',
    description: 'Cascading roses and greenery entrance arch',
    category: 'floral',
    eventSection: 'entrance',
    tags: ['romantic', 'roses', 'greenery'],
  },
  {
    id: 'mb-3',
    imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400',
    title: 'Gourmet Plating',
    description: 'Fine dining presentation with artistic plating',
    category: 'catering',
    eventSection: 'reception',
    tags: ['gourmet', 'elegant', 'fine-dining'],
  },
  {
    id: 'mb-4',
    imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400',
    title: 'DJ Setup',
    description: 'Professional DJ booth with LED lighting',
    category: 'entertainment',
    eventSection: 'after-party',
    tags: ['party', 'music', 'lighting'],
  },
  {
    id: 'mb-5',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    title: 'Candlelit Ambiance',
    description: 'Warm candlelight creating intimate atmosphere',
    category: 'lighting',
    eventSection: 'ceremony',
    tags: ['romantic', 'candles', 'warm'],
  },
  {
    id: 'mb-6',
    imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400',
    title: 'Table Setting',
    description: 'Elegant table setting with gold cutlery',
    category: 'tableware',
    eventSection: 'reception',
    tags: ['gold', 'elegant', 'formal'],
  },
];
