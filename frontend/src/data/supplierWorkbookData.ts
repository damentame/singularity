// Supplier Workbook Data - Comprehensive costing and invoicing structure

export interface CostItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  total: number;
}

export interface CostCategory {
  id: string;
  name: string;
  items: CostItem[];
  subtotal: number;
}

export interface LogisticsItem {
  id: string;
  type: 'delivery' | 'setup' | 'collection' | 'staff';
  description: string;
  date?: string;
  time?: string;
  duration?: string;
  cost: number;
  notes?: string;
}

export interface WorkbookData {
  eventId: string;
  eventName: string;
  eventDate: string;
  clientName: string;
  clientEmail: string;
  supplierId: string;
  supplierName: string;
  supplierCategory: string;
  country: string;
  city: string;
  currency: string;
  vatRate: number;
  
  // Cost sections
  serviceCategories: CostCategory[];
  logistics: LogisticsItem[];
  
  // Totals
  subtotal1: number; // Services
  subtotal2: number; // + Logistics
  vatAmount: number;
  contingencyFee: number;
  contingencyPercentage: number;
  refundableDeposit: number;
  subtotal3: number; // Total with VAT and contingency
  
  // Additional items
  additionalItems: CostItem[];
  additionalTotal: number;
  damagesDeductions: number;
  
  // Final
  grandTotal: number;
  depositPaid: number;
  balanceDue: number;
  refundDue: number;
  
  // Client banking for refund
  clientBanking?: {
    accountHolder: string;
    bankName: string;
    accountNumber: string;
    branchCode?: string;
    swiftCode?: string;
    iban?: string;
  };
  
  // Additional invoice
  additionalInvoiceUrl?: string;
  
  // Status
  status: 'draft' | 'sent' | 'confirmed' | 'completed' | 'refund_pending' | 'closed';
  createdAt: string;
  updatedAt: string;
}

// VAT rates by country
export const vatRatesByCountry: Record<string, { rate: number; name: string }> = {
  'South Africa': { rate: 15, name: 'VAT' },
  'United Kingdom': { rate: 20, name: 'VAT' },
  'France': { rate: 20, name: 'TVA' },
  'Italy': { rate: 22, name: 'IVA' },
  'Germany': { rate: 19, name: 'MwSt' },
  'Spain': { rate: 21, name: 'IVA' },
  'Portugal': { rate: 23, name: 'IVA' },
  'Netherlands': { rate: 21, name: 'BTW' },
  'Belgium': { rate: 21, name: 'TVA/BTW' },
  'Switzerland': { rate: 7.7, name: 'MWST' },
  'Austria': { rate: 20, name: 'USt' },
  'United States': { rate: 0, name: 'Sales Tax (varies by state)' },
  'Canada': { rate: 5, name: 'GST' },
  'Australia': { rate: 10, name: 'GST' },
  'New Zealand': { rate: 15, name: 'GST' },
  'United Arab Emirates': { rate: 5, name: 'VAT' },
  'Saudi Arabia': { rate: 15, name: 'VAT' },
  'Singapore': { rate: 8, name: 'GST' },
  'Japan': { rate: 10, name: 'Consumption Tax' },
  'Indonesia': { rate: 11, name: 'PPN' },
  'Thailand': { rate: 7, name: 'VAT' },
  'India': { rate: 18, name: 'GST' },
  'Mexico': { rate: 16, name: 'IVA' },
  'Brazil': { rate: 17, name: 'ICMS' },
  'Greece': { rate: 24, name: 'FPA' },
  'Ireland': { rate: 23, name: 'VAT' },
  'Sweden': { rate: 25, name: 'Moms' },
  'Norway': { rate: 25, name: 'MVA' },
  'Denmark': { rate: 25, name: 'Moms' },
  'Finland': { rate: 24, name: 'ALV' },
};

// Currency symbols
export const currencySymbols: Record<string, string> = {
  'ZAR': 'R',
  'GBP': '£',
  'EUR': '€',
  'USD': '$',
  'AUD': 'A$',
  'NZD': 'NZ$',
  'AED': 'AED',
  'SAR': 'SAR',
  'SGD': 'S$',
  'JPY': '¥',
  'IDR': 'Rp',
  'THB': '฿',
  'INR': '₹',
  'MXN': 'MX$',
  'BRL': 'R$',
  'CHF': 'CHF',
  'SEK': 'kr',
  'NOK': 'kr',
  'DKK': 'kr',
  'CAD': 'C$',
};

// Service categories by supplier type
export const serviceCategoriesBySupplierType: Record<string, string[]> = {
  'Venues': [
    'Venue Hire',
    'Ceremony Space',
    'Reception Space',
    'Cocktail Area',
    'Bridal Suite',
    'Accommodation',
    'Parking',
    'Security',
    'Cleaning',
    'Corkage',
    'Overtime Charges',
  ],
  'Florals': [
    'Bridal Bouquet',
    'Bridesmaid Bouquets',
    'Buttonholes',
    'Corsages',
    'Ceremony Arrangements',
    'Reception Centerpieces',
    'Top Table Arrangements',
    'Cake Flowers',
    'Arch/Chuppah Flowers',
    'Aisle Decorations',
    'Hanging Installations',
    'Flower Wall',
    'Loose Petals',
    'Candles & Votives',
    'Vases & Containers',
  ],
  'Catering': [
    'Canapés',
    'Starter Course',
    'Main Course',
    'Dessert',
    'Cheese Course',
    'Late Night Snacks',
    'Children\'s Menu',
    'Vendor Meals',
    'Beverages Package',
    'Champagne Toast',
    'Wine Selection',
    'Bar Tab',
    'Cocktail Service',
    'Coffee & Tea Service',
    'Wedding Cake',
    'Dessert Table',
    'Dietary Requirements',
  ],
  'Photography': [
    'Full Day Coverage',
    'Second Photographer',
    'Engagement Session',
    'Bridal Portraits',
    'Album Design',
    'Digital Gallery',
    'Prints Package',
    'Drone Photography',
    'Photo Booth',
    'Instant Prints',
    'Travel Expenses',
  ],
  'Videography': [
    'Full Day Coverage',
    'Second Videographer',
    'Highlight Film',
    'Full Documentary',
    'Drone Footage',
    'Same Day Edit',
    'Raw Footage',
    'Social Media Clips',
    'Travel Expenses',
  ],
  'Entertainment': [
    'Ceremony Music',
    'Cocktail Hour',
    'Reception Entertainment',
    'DJ Services',
    'Live Band',
    'String Quartet',
    'Solo Artist',
    'MC Services',
    'Sound System',
    'Lighting',
    'Dance Floor',
    'Special Effects',
    'Fireworks',
  ],
  'Lighting': [
    'Ambient Lighting',
    'Uplighting',
    'Fairy Lights',
    'Chandeliers',
    'Festoon Lights',
    'Pin Spots',
    'Gobo Projection',
    'Dance Floor Lighting',
    'Outdoor Lighting',
    'Candles & Lanterns',
    'LED Installations',
    'Neon Signs',
  ],
  'Transport': [
    'Bridal Car',
    'Groom\'s Car',
    'Wedding Party Transport',
    'Guest Shuttles',
    'Vintage Car Hire',
    'Limousine',
    'Horse & Carriage',
    'Helicopter',
    'Boat Transfer',
    'Driver/Chauffeur',
    'Decoration',
  ],
  'Planners': [
    'Full Planning Service',
    'Partial Planning',
    'Day-of Coordination',
    'Design & Styling',
    'Vendor Management',
    'Budget Management',
    'Timeline Creation',
    'Rehearsal Coordination',
    'Guest Management',
    'Travel Coordination',
  ],
  'Stationery': [
    'Save the Dates',
    'Invitations',
    'RSVP Cards',
    'Information Cards',
    'Menus',
    'Place Cards',
    'Table Numbers',
    'Programs',
    'Signage',
    'Thank You Cards',
    'Calligraphy',
    'Printing',
    'Postage',
  ],
  'Beauty': [
    'Bridal Hair',
    'Bridal Makeup',
    'Trial Session',
    'Bridesmaid Hair',
    'Bridesmaid Makeup',
    'Mother of Bride/Groom',
    'Touch-ups',
    'Lashes',
    'Nails',
    'Spray Tan',
    'Travel Expenses',
  ],
  'Marquee': [
    'Marquee Hire',
    'Flooring',
    'Lining',
    'Heating/Cooling',
    'Furniture',
    'Tables',
    'Chairs',
    'Lounge Furniture',
    'Bar Setup',
    'Stage',
    'Dance Floor',
    'Generator',
    'Toilets',
  ],
};

// Collection timing options
export const collectionTimingOptions = [
  { id: 'same-day', label: 'Same Day (After Event)', description: 'Collection immediately after event ends' },
  { id: 'next-morning', label: 'Next Morning', description: 'Collection the morning after the event' },
  { id: 'next-day', label: 'Next Day (Afternoon)', description: 'Collection the afternoon after the event' },
  { id: '48-hours', label: 'Within 48 Hours', description: 'Collection within 2 days of the event' },
  { id: 'week', label: 'Within 1 Week', description: 'Collection within 7 days of the event' },
  { id: 'custom', label: 'Custom Arrangement', description: 'Specify custom collection timing' },
];

// Default contingency percentages by event size
export const contingencyPercentages = [
  { minGuests: 0, maxGuests: 50, percentage: 5 },
  { minGuests: 51, maxGuests: 100, percentage: 7.5 },
  { minGuests: 101, maxGuests: 200, percentage: 10 },
  { minGuests: 201, maxGuests: 500, percentage: 12.5 },
  { minGuests: 501, maxGuests: Infinity, percentage: 15 },
];

// Supplier questionnaire template for email
export const supplierQuestionnaireTemplate = {
  general: [
    'Business name and registration details',
    'Years in operation',
    'Service areas covered',
    'Event types catered for (Corporate, Weddings, Celebrations)',
    'Insurance and liability coverage',
    'Cancellation and refund policy',
  ],
  availability: [
    'Available dates for the event',
    'Lead time required for booking',
    'Backup arrangements in case of emergency',
  ],
  pricing: [
    'Base package pricing',
    'Additional services and costs',
    'Payment terms and schedule',
    'Deposit requirements',
    'Overtime rates',
  ],
  logistics: [
    'Delivery/arrival time requirements',
    'Setup duration needed',
    'Breakdown/collection timing',
    'Staff requirements',
    'Equipment/power requirements',
  ],
  portfolio: [
    'Recent work samples',
    'Client testimonials',
    'Floor plans (if venue)',
    'Menu samples (if catering)',
    'Equipment list',
  ],
};
