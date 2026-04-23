// Country codes with dial codes
export interface CountryCode {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export const countryCodes: CountryCode[] = [
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', flag: '🇨🇿' },
  { code: 'HU', name: 'Hungary', dialCode: '+36', flag: '🇭🇺' },
  { code: 'RO', name: 'Romania', dialCode: '+40', flag: '🇷🇴' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  { code: 'MA', name: 'Morocco', dialCode: '+212', flag: '🇲🇦' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿' },
];

// Map country names to country codes for auto-detection
export const countryNameToCode: Record<string, string> = {
  'South Africa': 'ZA',
  'United Kingdom': 'GB',
  'United States': 'US',
  'France': 'FR',
  'Italy': 'IT',
  'Spain': 'ES',
  'Germany': 'DE',
  'United Arab Emirates': 'AE',
  'Australia': 'AU',
  'New Zealand': 'NZ',
  'Indonesia': 'ID',
  'Thailand': 'TH',
  'Japan': 'JP',
  'China': 'CN',
  'India': 'IN',
  'Brazil': 'BR',
  'Mexico': 'MX',
  'Canada': 'CA',
  'Portugal': 'PT',
  'Greece': 'GR',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Ireland': 'IE',
  'Singapore': 'SG',
  'Hong Kong': 'HK',
  'South Korea': 'KR',
  'Philippines': 'PH',
  'Malaysia': 'MY',
  'Russia': 'RU',
  'Poland': 'PL',
  'Czech Republic': 'CZ',
  'Hungary': 'HU',
  'Romania': 'RO',
  'Turkey': 'TR',
  'Israel': 'IL',
  'Saudi Arabia': 'SA',
  'Qatar': 'QA',
  'Kuwait': 'KW',
  'Egypt': 'EG',
  'Morocco': 'MA',
  'Nigeria': 'NG',
  'Kenya': 'KE',
  'Ghana': 'GH',
  'Tanzania': 'TZ',
};

// Event types
export interface EventType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const eventTypes: EventType[] = [
  { id: 'wedding', name: 'Wedding', description: 'Traditional or modern wedding celebration', icon: 'Heart' },
  { id: 'engagement', name: 'Engagement Party', description: 'Celebrate the announcement of your engagement', icon: 'Ring' },
  { id: 'anniversary', name: 'Anniversary', description: 'Celebrate years of love and commitment', icon: 'Calendar' },
  { id: 'birthday', name: 'Birthday Party', description: 'Milestone or special birthday celebration', icon: 'Cake' },
  { id: 'corporate', name: 'Corporate Event', description: 'Business meetings, conferences, or team events', icon: 'Briefcase' },
  { id: 'gala', name: 'Gala / Charity Event', description: 'Formal fundraising or charity events', icon: 'Star' },
  { id: 'graduation', name: 'Graduation Party', description: 'Celebrate academic achievements', icon: 'GraduationCap' },
  { id: 'baby-shower', name: 'Baby Shower', description: 'Celebrate the upcoming arrival of a baby', icon: 'Baby' },
  { id: 'bridal-shower', name: 'Bridal Shower', description: 'Pre-wedding celebration for the bride', icon: 'Gift' },
  { id: 'bachelor-party', name: 'Bachelor/Bachelorette Party', description: 'Pre-wedding celebration for the couple', icon: 'PartyPopper' },
  { id: 'reunion', name: 'Family Reunion', description: 'Bring the family together', icon: 'Users' },
  { id: 'retirement', name: 'Retirement Party', description: 'Celebrate a career milestone', icon: 'Award' },
  { id: 'holiday', name: 'Holiday Party', description: 'Seasonal or holiday celebrations', icon: 'Snowflake' },
  { id: 'launch', name: 'Product Launch', description: 'Introduce a new product or service', icon: 'Rocket' },
  { id: 'networking', name: 'Networking Event', description: 'Professional networking opportunities', icon: 'Network' },
  { id: 'awards', name: 'Awards Ceremony', description: 'Recognition and awards events', icon: 'Trophy' },
  { id: 'memorial', name: 'Memorial / Celebration of Life', description: 'Honor and remember loved ones', icon: 'Flower' },
  { id: 'religious', name: 'Religious Ceremony', description: 'Bar/Bat Mitzvah, Christening, etc.', icon: 'Church' },
  { id: 'cultural', name: 'Cultural Celebration', description: 'Traditional or cultural events', icon: 'Globe' },
  { id: 'other', name: 'Other', description: 'Custom or unique event type', icon: 'MoreHorizontal' },
];

// Style descriptions
export interface StyleDescription {
  id: string;
  label: string;
  keywords: string[];
}

export const styleDescriptions: StyleDescription[] = [
  { id: 'elegant', label: 'Elegant & Sophisticated', keywords: ['elegant', 'sophisticated', 'refined', 'classy', 'graceful'] },
  { id: 'rustic', label: 'Rustic & Natural', keywords: ['rustic', 'natural', 'organic', 'earthy', 'countryside'] },
  { id: 'modern', label: 'Modern & Minimalist', keywords: ['modern', 'minimalist', 'clean', 'sleek', 'contemporary'] },
  { id: 'romantic', label: 'Romantic & Dreamy', keywords: ['romantic', 'dreamy', 'whimsical', 'soft', 'ethereal'] },
  { id: 'glamorous', label: 'Glamorous & Luxurious', keywords: ['glamorous', 'luxurious', 'opulent', 'lavish', 'extravagant'] },
  { id: 'bohemian', label: 'Bohemian & Free-spirited', keywords: ['bohemian', 'boho', 'free-spirited', 'eclectic', 'artistic'] },
  { id: 'vintage', label: 'Vintage & Retro', keywords: ['vintage', 'retro', 'classic', 'timeless', 'antique'] },
  { id: 'tropical', label: 'Tropical & Exotic', keywords: ['tropical', 'exotic', 'vibrant', 'island', 'paradise'] },
  { id: 'industrial', label: 'Industrial & Urban', keywords: ['industrial', 'urban', 'edgy', 'raw', 'warehouse'] },
  { id: 'garden', label: 'Garden & Botanical', keywords: ['garden', 'botanical', 'floral', 'lush', 'greenery'] },
];

// Color palette
export interface ColorOption {
  id: string;
  name: string;
  hex: string;
  category: string;
}

export const colorPalette: ColorOption[] = [
  // Reds
  { id: 'red-50', name: 'Rose', hex: '#FFF1F2', category: 'Red' },
  { id: 'red-100', name: 'Blush Pink', hex: '#FFE4E6', category: 'Red' },
  { id: 'red-200', name: 'Light Coral', hex: '#FECDD3', category: 'Red' },
  { id: 'red-300', name: 'Coral', hex: '#FDA4AF', category: 'Red' },
  { id: 'red-400', name: 'Salmon', hex: '#FB7185', category: 'Red' },
  { id: 'red-500', name: 'Red', hex: '#EF4444', category: 'Red' },
  { id: 'red-600', name: 'Crimson', hex: '#DC2626', category: 'Red' },
  { id: 'red-700', name: 'Dark Red', hex: '#B91C1C', category: 'Red' },
  { id: 'red-800', name: 'Maroon', hex: '#991B1B', category: 'Red' },
  { id: 'red-900', name: 'Burgundy', hex: '#7F1D1D', category: 'Red' },
  
  // Oranges
  { id: 'orange-50', name: 'Peach', hex: '#FFF7ED', category: 'Orange' },
  { id: 'orange-100', name: 'Light Peach', hex: '#FFEDD5', category: 'Orange' },
  { id: 'orange-200', name: 'Apricot', hex: '#FED7AA', category: 'Orange' },
  { id: 'orange-300', name: 'Light Orange', hex: '#FDBA74', category: 'Orange' },
  { id: 'orange-400', name: 'Orange', hex: '#FB923C', category: 'Orange' },
  { id: 'orange-500', name: 'Tangerine', hex: '#F97316', category: 'Orange' },
  { id: 'orange-600', name: 'Burnt Orange', hex: '#EA580C', category: 'Orange' },
  { id: 'orange-700', name: 'Rust', hex: '#C2410C', category: 'Orange' },
  { id: 'orange-800', name: 'Terracotta', hex: '#9A3412', category: 'Orange' },
  
  // Yellows
  { id: 'yellow-50', name: 'Cream', hex: '#FEFCE8', category: 'Yellow' },
  { id: 'yellow-100', name: 'Light Yellow', hex: '#FEF9C3', category: 'Yellow' },
  { id: 'yellow-200', name: 'Buttercup', hex: '#FEF08A', category: 'Yellow' },
  { id: 'yellow-300', name: 'Lemon', hex: '#FDE047', category: 'Yellow' },
  { id: 'yellow-400', name: 'Yellow', hex: '#FACC15', category: 'Yellow' },
  { id: 'yellow-500', name: 'Gold', hex: '#EAB308', category: 'Yellow' },
  { id: 'yellow-600', name: 'Amber', hex: '#CA8A04', category: 'Yellow' },
  { id: 'yellow-700', name: 'Mustard', hex: '#A16207', category: 'Yellow' },
  
  // Greens
  { id: 'green-50', name: 'Mint', hex: '#F0FDF4', category: 'Green' },
  { id: 'green-100', name: 'Light Mint', hex: '#DCFCE7', category: 'Green' },
  { id: 'green-200', name: 'Seafoam', hex: '#BBF7D0', category: 'Green' },
  { id: 'green-300', name: 'Light Green', hex: '#86EFAC', category: 'Green' },
  { id: 'green-400', name: 'Green', hex: '#4ADE80', category: 'Green' },
  { id: 'green-500', name: 'Emerald', hex: '#22C55E', category: 'Green' },
  { id: 'green-600', name: 'Forest', hex: '#16A34A', category: 'Green' },
  { id: 'green-700', name: 'Hunter Green', hex: '#15803D', category: 'Green' },
  { id: 'green-800', name: 'Dark Green', hex: '#166534', category: 'Green' },
  { id: 'green-900', name: 'Olive', hex: '#14532D', category: 'Green' },
  
  // Teals
  { id: 'teal-50', name: 'Light Teal', hex: '#F0FDFA', category: 'Teal' },
  { id: 'teal-200', name: 'Aqua', hex: '#99F6E4', category: 'Teal' },
  { id: 'teal-400', name: 'Teal', hex: '#2DD4BF', category: 'Teal' },
  { id: 'teal-600', name: 'Dark Teal', hex: '#0D9488', category: 'Teal' },
  { id: 'teal-800', name: 'Deep Teal', hex: '#115E59', category: 'Teal' },
  
  // Blues
  { id: 'blue-50', name: 'Ice Blue', hex: '#EFF6FF', category: 'Blue' },
  { id: 'blue-100', name: 'Powder Blue', hex: '#DBEAFE', category: 'Blue' },
  { id: 'blue-200', name: 'Light Blue', hex: '#BFDBFE', category: 'Blue' },
  { id: 'blue-300', name: 'Sky Blue', hex: '#93C5FD', category: 'Blue' },
  { id: 'blue-400', name: 'Cornflower', hex: '#60A5FA', category: 'Blue' },
  { id: 'blue-500', name: 'Blue', hex: '#3B82F6', category: 'Blue' },
  { id: 'blue-600', name: 'Royal Blue', hex: '#2563EB', category: 'Blue' },
  { id: 'blue-700', name: 'Cobalt', hex: '#1D4ED8', category: 'Blue' },
  { id: 'blue-800', name: 'Navy', hex: '#1E40AF', category: 'Blue' },
  { id: 'blue-900', name: 'Dark Navy', hex: '#1E3A8A', category: 'Blue' },
  
  // Purples
  { id: 'purple-50', name: 'Lavender', hex: '#FAF5FF', category: 'Purple' },
  { id: 'purple-100', name: 'Light Lavender', hex: '#F3E8FF', category: 'Purple' },
  { id: 'purple-200', name: 'Lilac', hex: '#E9D5FF', category: 'Purple' },
  { id: 'purple-300', name: 'Orchid', hex: '#D8B4FE', category: 'Purple' },
  { id: 'purple-400', name: 'Violet', hex: '#C084FC', category: 'Purple' },
  { id: 'purple-500', name: 'Purple', hex: '#A855F7', category: 'Purple' },
  { id: 'purple-600', name: 'Amethyst', hex: '#9333EA', category: 'Purple' },
  { id: 'purple-700', name: 'Grape', hex: '#7E22CE', category: 'Purple' },
  { id: 'purple-800', name: 'Plum', hex: '#6B21A8', category: 'Purple' },
  { id: 'purple-900', name: 'Eggplant', hex: '#581C87', category: 'Purple' },
  
  // Pinks
  { id: 'pink-50', name: 'Pale Pink', hex: '#FDF2F8', category: 'Pink' },
  { id: 'pink-100', name: 'Light Pink', hex: '#FCE7F3', category: 'Pink' },
  { id: 'pink-200', name: 'Baby Pink', hex: '#FBCFE8', category: 'Pink' },
  { id: 'pink-300', name: 'Pink', hex: '#F9A8D4', category: 'Pink' },
  { id: 'pink-400', name: 'Hot Pink', hex: '#F472B6', category: 'Pink' },
  { id: 'pink-500', name: 'Fuchsia', hex: '#EC4899', category: 'Pink' },
  { id: 'pink-600', name: 'Magenta', hex: '#DB2777', category: 'Pink' },
  { id: 'pink-700', name: 'Deep Pink', hex: '#BE185D', category: 'Pink' },
  { id: 'pink-800', name: 'Raspberry', hex: '#9D174D', category: 'Pink' },
  
  // Neutrals
  { id: 'white', name: 'White', hex: '#FFFFFF', category: 'Neutral' },
  { id: 'ivory', name: 'Ivory', hex: '#FFFFF0', category: 'Neutral' },
  { id: 'champagne', name: 'Champagne', hex: '#F7E7CE', category: 'Neutral' },
  { id: 'beige', name: 'Beige', hex: '#F5F5DC', category: 'Neutral' },
  { id: 'taupe', name: 'Taupe', hex: '#D4C4A8', category: 'Neutral' },
  { id: 'gray-100', name: 'Light Gray', hex: '#F3F4F6', category: 'Neutral' },
  { id: 'gray-300', name: 'Silver', hex: '#D1D5DB', category: 'Neutral' },
  { id: 'gray-500', name: 'Gray', hex: '#6B7280', category: 'Neutral' },
  { id: 'gray-700', name: 'Charcoal', hex: '#374151', category: 'Neutral' },
  { id: 'gray-900', name: 'Dark Gray', hex: '#111827', category: 'Neutral' },
  { id: 'black', name: 'Black', hex: '#000000', category: 'Neutral' },
  
  // Metallics
  { id: 'gold-metallic', name: 'Gold', hex: '#FFD700', category: 'Metallic' },
  { id: 'rose-gold', name: 'Rose Gold', hex: '#B76E79', category: 'Metallic' },
  { id: 'silver-metallic', name: 'Silver', hex: '#C0C0C0', category: 'Metallic' },
  { id: 'bronze', name: 'Bronze', hex: '#CD7F32', category: 'Metallic' },
  { id: 'copper', name: 'Copper', hex: '#B87333', category: 'Metallic' },
];

// Vendor categories for required/not required
export const vendorCategories = [
  'Venues',
  'Photography',
  'Videography',
  'Catering',
  'Florals',
  'Entertainment',
  'Lighting',
  'Planners',
  'Transport',
  'Cake & Desserts',
  'Hair & Makeup',
  'Stationery',
  'Rentals & Decor',
  'Officiant',
  'Security',
  'Valet Parking',
  'Accommodation',
  'Honeymoon Planning',
];

// Questionnaire form data interface
export interface QuestionnaireData {
  // Client Information
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhoneCountry: string;
  clientPhone: string;
  clientAddress: string;
  clientCity: string;
  clientCountry: string;
  
  // Secondary Contact
  secondaryContactName: string;
  secondaryContactEmail: string;
  secondaryContactPhoneCountry: string;
  secondaryContactPhone: string;
  secondaryContactRelation: string;
  
  // Event Details
  eventType: string;
  eventTypeComments: string;
  eventDate: string;
  eventEndDate: string;
  guestCount: number;
  eventBudget: string;
  
  // Venue
  venueCountry: string;
  venueCity: string;
  venueName: string;
  venueAddress: string;
  
  // Vendors
  vendorsRequired: string[];
  vendorsNotRequired: string[];
  vendorComments: string;
  
  // Style
  selectedStyles: string[];
  styleComments: string;
  
  // Colors
  selectedColors: string[];
  colorComments: string;
  
  // Additional
  additionalNotes: string;
  specialRequirements: string;
  dietaryRestrictions: string;
}

export const defaultQuestionnaireData: QuestionnaireData = {
  clientFirstName: '',
  clientLastName: '',
  clientEmail: '',
  clientPhoneCountry: 'ZA',
  clientPhone: '',
  clientAddress: '',
  clientCity: '',
  clientCountry: '',
  
  secondaryContactName: '',
  secondaryContactEmail: '',
  secondaryContactPhoneCountry: 'ZA',
  secondaryContactPhone: '',
  secondaryContactRelation: '',
  
  eventType: '',
  eventTypeComments: '',
  eventDate: '',
  eventEndDate: '',
  guestCount: 0,
  eventBudget: '',
  
  venueCountry: '',
  venueCity: '',
  venueName: '',
  venueAddress: '',
  
  vendorsRequired: [],
  vendorsNotRequired: [],
  vendorComments: '',
  
  selectedStyles: [],
  styleComments: '',
  
  selectedColors: [],
  colorComments: '',
  
  additionalNotes: '',
  specialRequirements: '',
  dietaryRestrictions: '',
};
