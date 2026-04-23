// Service Provider Categories and Subcategories Data

export interface ServiceSubcategory {
  id: string;
  name: string;
  fields: ServiceField[];
}

export interface ServiceField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'range' | 'textarea';
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  subcategories: ServiceSubcategory[];
}

export interface EventTypeCategory {
  id: string;
  name: string;
  description: string;
  categories: ServiceCategory[];
}

export const businessTypes = [
  'Sole Trader',
  'Partnership',
  'Private Company (Pty Ltd)',
  'Public Company',
  'Trust',
  'Non-Profit Organization',
  'Franchise',
  'Other'
];

export const countries = [
  { name: 'Australia', code: 'AU', currency: 'AUD', taxName: 'ABN', dialCode: '+61' },
  { name: 'South Africa', code: 'ZA', currency: 'ZAR', taxName: 'Company Registration', dialCode: '+27' },
  { name: 'United States', code: 'US', currency: 'USD', taxName: 'EIN', dialCode: '+1' },
  { name: 'United Kingdom', code: 'GB', currency: 'GBP', taxName: 'Company Number', dialCode: '+44' },
  { name: 'New Zealand', code: 'NZ', currency: 'NZD', taxName: 'NZBN', dialCode: '+64' },
  { name: 'Canada', code: 'CA', currency: 'CAD', taxName: 'BN', dialCode: '+1' },
  { name: 'Ireland', code: 'IE', currency: 'EUR', taxName: 'CRO Number', dialCode: '+353' },
  { name: 'Singapore', code: 'SG', currency: 'SGD', taxName: 'UEN', dialCode: '+65' },
  { name: 'United Arab Emirates', code: 'AE', currency: 'AED', taxName: 'Trade License', dialCode: '+971' },
  { name: 'India', code: 'IN', currency: 'INR', taxName: 'GSTIN', dialCode: '+91' },
  { name: 'France', code: 'FR', currency: 'EUR', taxName: 'SIRET', dialCode: '+33' },
  { name: 'Germany', code: 'DE', currency: 'EUR', taxName: 'Handelsregister', dialCode: '+49' },
  { name: 'Italy', code: 'IT', currency: 'EUR', taxName: 'Partita IVA', dialCode: '+39' },
  { name: 'Spain', code: 'ES', currency: 'EUR', taxName: 'NIF', dialCode: '+34' },
  { name: 'Netherlands', code: 'NL', currency: 'EUR', taxName: 'KvK Number', dialCode: '+31' },
  { name: 'Portugal', code: 'PT', currency: 'EUR', taxName: 'NIF', dialCode: '+351' },
  { name: 'Greece', code: 'GR', currency: 'EUR', taxName: 'AFM', dialCode: '+30' },
  { name: 'Switzerland', code: 'CH', currency: 'CHF', taxName: 'UID', dialCode: '+41' },
  { name: 'Austria', code: 'AT', currency: 'EUR', taxName: 'UID', dialCode: '+43' },
  { name: 'Belgium', code: 'BE', currency: 'EUR', taxName: 'Enterprise Number', dialCode: '+32' },
  { name: 'Sweden', code: 'SE', currency: 'SEK', taxName: 'Organisationsnummer', dialCode: '+46' },
  { name: 'Norway', code: 'NO', currency: 'NOK', taxName: 'Organisasjonsnummer', dialCode: '+47' },
  { name: 'Denmark', code: 'DK', currency: 'DKK', taxName: 'CVR', dialCode: '+45' },
  { name: 'Finland', code: 'FI', currency: 'EUR', taxName: 'Y-tunnus', dialCode: '+358' },
  { name: 'Japan', code: 'JP', currency: 'JPY', taxName: 'Corporate Number', dialCode: '+81' },
  { name: 'Hong Kong', code: 'HK', currency: 'HKD', taxName: 'BR Number', dialCode: '+852' },
  { name: 'Malaysia', code: 'MY', currency: 'MYR', taxName: 'SSM Number', dialCode: '+60' },
  { name: 'Thailand', code: 'TH', currency: 'THB', taxName: 'Tax ID', dialCode: '+66' },
  { name: 'Indonesia', code: 'ID', currency: 'IDR', taxName: 'NPWP', dialCode: '+62' },
  { name: 'Philippines', code: 'PH', currency: 'PHP', taxName: 'TIN', dialCode: '+63' },
  { name: 'Vietnam', code: 'VN', currency: 'VND', taxName: 'Tax Code', dialCode: '+84' },
  { name: 'Brazil', code: 'BR', currency: 'BRL', taxName: 'CNPJ', dialCode: '+55' },
  { name: 'Mexico', code: 'MX', currency: 'MXN', taxName: 'RFC', dialCode: '+52' },
  { name: 'Argentina', code: 'AR', currency: 'ARS', taxName: 'CUIT', dialCode: '+54' },
  { name: 'Chile', code: 'CL', currency: 'CLP', taxName: 'RUT', dialCode: '+56' },
  { name: 'Colombia', code: 'CO', currency: 'COP', taxName: 'NIT', dialCode: '+57' },
  { name: 'Peru', code: 'PE', currency: 'PEN', taxName: 'RUC', dialCode: '+51' },
  { name: 'Kenya', code: 'KE', currency: 'KES', taxName: 'PIN', dialCode: '+254' },
  { name: 'Nigeria', code: 'NG', currency: 'NGN', taxName: 'TIN', dialCode: '+234' },
  { name: 'Ghana', code: 'GH', currency: 'GHS', taxName: 'TIN', dialCode: '+233' },
  { name: 'Egypt', code: 'EG', currency: 'EGP', taxName: 'Tax Card', dialCode: '+20' },
  { name: 'Morocco', code: 'MA', currency: 'MAD', taxName: 'ICE', dialCode: '+212' },
  { name: 'Israel', code: 'IL', currency: 'ILS', taxName: 'Company Number', dialCode: '+972' },
  { name: 'Saudi Arabia', code: 'SA', currency: 'SAR', taxName: 'CR Number', dialCode: '+966' },
  { name: 'Qatar', code: 'QA', currency: 'QAR', taxName: 'CR Number', dialCode: '+974' },
  { name: 'Kuwait', code: 'KW', currency: 'KWD', taxName: 'CR Number', dialCode: '+965' },
  { name: 'Bahrain', code: 'BH', currency: 'BHD', taxName: 'CR Number', dialCode: '+973' },
  { name: 'Oman', code: 'OM', currency: 'OMR', taxName: 'CR Number', dialCode: '+968' },
  { name: 'Jordan', code: 'JO', currency: 'JOD', taxName: 'Tax Number', dialCode: '+962' },
  { name: 'Lebanon', code: 'LB', currency: 'LBP', taxName: 'Tax Number', dialCode: '+961' },
  { name: 'Turkey', code: 'TR', currency: 'TRY', taxName: 'Vergi Kimlik', dialCode: '+90' },
  { name: 'Russia', code: 'RU', currency: 'RUB', taxName: 'INN', dialCode: '+7' },
  { name: 'Poland', code: 'PL', currency: 'PLN', taxName: 'NIP', dialCode: '+48' },
  { name: 'Czech Republic', code: 'CZ', currency: 'CZK', taxName: 'ICO', dialCode: '+420' },
  { name: 'Hungary', code: 'HU', currency: 'HUF', taxName: 'Tax Number', dialCode: '+36' },
  { name: 'Romania', code: 'RO', currency: 'RON', taxName: 'CUI', dialCode: '+40' },
  { name: 'Bulgaria', code: 'BG', currency: 'BGN', taxName: 'EIK', dialCode: '+359' },
  { name: 'Croatia', code: 'HR', currency: 'EUR', taxName: 'OIB', dialCode: '+385' },
  { name: 'Slovenia', code: 'SI', currency: 'EUR', taxName: 'Tax Number', dialCode: '+386' },
  { name: 'Slovakia', code: 'SK', currency: 'EUR', taxName: 'ICO', dialCode: '+421' },
  { name: 'Lithuania', code: 'LT', currency: 'EUR', taxName: 'Company Code', dialCode: '+370' },
  { name: 'Latvia', code: 'LV', currency: 'EUR', taxName: 'Registration Number', dialCode: '+371' },
  { name: 'Estonia', code: 'EE', currency: 'EUR', taxName: 'Registry Code', dialCode: '+372' },
  { name: 'Cyprus', code: 'CY', currency: 'EUR', taxName: 'Registration Number', dialCode: '+357' },
  { name: 'Malta', code: 'MT', currency: 'EUR', taxName: 'Registration Number', dialCode: '+356' },
  { name: 'Luxembourg', code: 'LU', currency: 'EUR', taxName: 'RCS Number', dialCode: '+352' },
  { name: 'Iceland', code: 'IS', currency: 'ISK', taxName: 'Kennitala', dialCode: '+354' },
  { name: 'Mauritius', code: 'MU', currency: 'MUR', taxName: 'BRN', dialCode: '+230' },
  { name: 'Seychelles', code: 'SC', currency: 'SCR', taxName: 'Business Number', dialCode: '+248' },
  { name: 'Maldives', code: 'MV', currency: 'MVR', taxName: 'Business Number', dialCode: '+960' },
  { name: 'Sri Lanka', code: 'LK', currency: 'LKR', taxName: 'BRN', dialCode: '+94' },
  { name: 'Bangladesh', code: 'BD', currency: 'BDT', taxName: 'TIN', dialCode: '+880' },
  { name: 'Pakistan', code: 'PK', currency: 'PKR', taxName: 'NTN', dialCode: '+92' },
  { name: 'Nepal', code: 'NP', currency: 'NPR', taxName: 'PAN', dialCode: '+977' },
  { name: 'Myanmar', code: 'MM', currency: 'MMK', taxName: 'Tax ID', dialCode: '+95' },
  { name: 'Cambodia', code: 'KH', currency: 'KHR', taxName: 'Tax ID', dialCode: '+855' },
  { name: 'Laos', code: 'LA', currency: 'LAK', taxName: 'Tax ID', dialCode: '+856' },
  { name: 'Brunei', code: 'BN', currency: 'BND', taxName: 'Business Number', dialCode: '+673' },
  { name: 'Taiwan', code: 'TW', currency: 'TWD', taxName: 'Tax ID', dialCode: '+886' },
  { name: 'South Korea', code: 'KR', currency: 'KRW', taxName: 'Business Number', dialCode: '+82' },
  { name: 'China', code: 'CN', currency: 'CNY', taxName: 'USCC', dialCode: '+86' },
  { name: 'Mongolia', code: 'MN', currency: 'MNT', taxName: 'Registration Number', dialCode: '+976' },
  { name: 'Kazakhstan', code: 'KZ', currency: 'KZT', taxName: 'BIN', dialCode: '+7' },
  { name: 'Uzbekistan', code: 'UZ', currency: 'UZS', taxName: 'INN', dialCode: '+998' },
  { name: 'Azerbaijan', code: 'AZ', currency: 'AZN', taxName: 'TIN', dialCode: '+994' },
  { name: 'Georgia', code: 'GE', currency: 'GEL', taxName: 'Identification Code', dialCode: '+995' },
  { name: 'Armenia', code: 'AM', currency: 'AMD', taxName: 'TIN', dialCode: '+374' },
  { name: 'Ukraine', code: 'UA', currency: 'UAH', taxName: 'EDRPOU', dialCode: '+380' },
  { name: 'Belarus', code: 'BY', currency: 'BYN', taxName: 'UNP', dialCode: '+375' },
  { name: 'Moldova', code: 'MD', currency: 'MDL', taxName: 'IDNO', dialCode: '+373' },
  { name: 'Serbia', code: 'RS', currency: 'RSD', taxName: 'PIB', dialCode: '+381' },
  { name: 'Bosnia and Herzegovina', code: 'BA', currency: 'BAM', taxName: 'ID Number', dialCode: '+387' },
  { name: 'North Macedonia', code: 'MK', currency: 'MKD', taxName: 'EMBS', dialCode: '+389' },
  { name: 'Albania', code: 'AL', currency: 'ALL', taxName: 'NIPT', dialCode: '+355' },
  { name: 'Montenegro', code: 'ME', currency: 'EUR', taxName: 'PIB', dialCode: '+382' },
  { name: 'Kosovo', code: 'XK', currency: 'EUR', taxName: 'Business Number', dialCode: '+383' },
  { name: 'Tanzania', code: 'TZ', currency: 'TZS', taxName: 'TIN', dialCode: '+255' },
  { name: 'Uganda', code: 'UG', currency: 'UGX', taxName: 'TIN', dialCode: '+256' },
  { name: 'Rwanda', code: 'RW', currency: 'RWF', taxName: 'TIN', dialCode: '+250' },
  { name: 'Ethiopia', code: 'ET', currency: 'ETB', taxName: 'TIN', dialCode: '+251' },
  { name: 'Botswana', code: 'BW', currency: 'BWP', taxName: 'Company Number', dialCode: '+267' },
  { name: 'Namibia', code: 'NA', currency: 'NAD', taxName: 'Registration Number', dialCode: '+264' },
  { name: 'Zimbabwe', code: 'ZW', currency: 'ZWL', taxName: 'BP Number', dialCode: '+263' },
  { name: 'Zambia', code: 'ZM', currency: 'ZMW', taxName: 'TPIN', dialCode: '+260' },
  { name: 'Mozambique', code: 'MZ', currency: 'MZN', taxName: 'NUIT', dialCode: '+258' },
  { name: 'Angola', code: 'AO', currency: 'AOA', taxName: 'NIF', dialCode: '+244' },
  { name: 'Senegal', code: 'SN', currency: 'XOF', taxName: 'NINEA', dialCode: '+221' },
  { name: 'Ivory Coast', code: 'CI', currency: 'XOF', taxName: 'Registration Number', dialCode: '+225' },
  { name: 'Cameroon', code: 'CM', currency: 'XAF', taxName: 'NIU', dialCode: '+237' },
  { name: 'Democratic Republic of Congo', code: 'CD', currency: 'CDF', taxName: 'NIF', dialCode: '+243' },
  { name: 'Tunisia', code: 'TN', currency: 'TND', taxName: 'Tax ID', dialCode: '+216' },
  { name: 'Algeria', code: 'DZ', currency: 'DZD', taxName: 'NIF', dialCode: '+213' },
  { name: 'Libya', code: 'LY', currency: 'LYD', taxName: 'Tax Number', dialCode: '+218' },
  { name: 'Sudan', code: 'SD', currency: 'SDG', taxName: 'Tax Number', dialCode: '+249' },
  { name: 'Jamaica', code: 'JM', currency: 'JMD', taxName: 'TRN', dialCode: '+1876' },
  { name: 'Trinidad and Tobago', code: 'TT', currency: 'TTD', taxName: 'BIR Number', dialCode: '+1868' },
  { name: 'Barbados', code: 'BB', currency: 'BBD', taxName: 'Registration Number', dialCode: '+1246' },
  { name: 'Bahamas', code: 'BS', currency: 'BSD', taxName: 'Business License', dialCode: '+1242' },
  { name: 'Bermuda', code: 'BM', currency: 'BMD', taxName: 'Registration Number', dialCode: '+1441' },
  { name: 'Cayman Islands', code: 'KY', currency: 'KYD', taxName: 'Registration Number', dialCode: '+1345' },
  { name: 'British Virgin Islands', code: 'VG', currency: 'USD', taxName: 'Registration Number', dialCode: '+1284' },
  { name: 'Puerto Rico', code: 'PR', currency: 'USD', taxName: 'EIN', dialCode: '+1787' },
  { name: 'Dominican Republic', code: 'DO', currency: 'DOP', taxName: 'RNC', dialCode: '+1809' },
  { name: 'Costa Rica', code: 'CR', currency: 'CRC', taxName: 'Cedula Juridica', dialCode: '+506' },
  { name: 'Panama', code: 'PA', currency: 'PAB', taxName: 'RUC', dialCode: '+507' },
  { name: 'Guatemala', code: 'GT', currency: 'GTQ', taxName: 'NIT', dialCode: '+502' },
  { name: 'Honduras', code: 'HN', currency: 'HNL', taxName: 'RTN', dialCode: '+504' },
  { name: 'El Salvador', code: 'SV', currency: 'USD', taxName: 'NIT', dialCode: '+503' },
  { name: 'Nicaragua', code: 'NI', currency: 'NIO', taxName: 'RUC', dialCode: '+505' },
  { name: 'Ecuador', code: 'EC', currency: 'USD', taxName: 'RUC', dialCode: '+593' },
  { name: 'Bolivia', code: 'BO', currency: 'BOB', taxName: 'NIT', dialCode: '+591' },
  { name: 'Paraguay', code: 'PY', currency: 'PYG', taxName: 'RUC', dialCode: '+595' },
  { name: 'Uruguay', code: 'UY', currency: 'UYU', taxName: 'RUT', dialCode: '+598' },
  { name: 'Venezuela', code: 'VE', currency: 'VES', taxName: 'RIF', dialCode: '+58' },
  { name: 'Fiji', code: 'FJ', currency: 'FJD', taxName: 'TIN', dialCode: '+679' },
  { name: 'Papua New Guinea', code: 'PG', currency: 'PGK', taxName: 'TIN', dialCode: '+675' },
  { name: 'Samoa', code: 'WS', currency: 'WST', taxName: 'TIN', dialCode: '+685' },
  { name: 'Tonga', code: 'TO', currency: 'TOP', taxName: 'TIN', dialCode: '+676' },
  { name: 'Vanuatu', code: 'VU', currency: 'VUV', taxName: 'TIN', dialCode: '+678' },
  { name: 'Solomon Islands', code: 'SB', currency: 'SBD', taxName: 'TIN', dialCode: '+677' },
  { name: 'New Caledonia', code: 'NC', currency: 'XPF', taxName: 'RIDET', dialCode: '+687' },
  { name: 'French Polynesia', code: 'PF', currency: 'XPF', taxName: 'TAHITI', dialCode: '+689' },
  { name: 'Guam', code: 'GU', currency: 'USD', taxName: 'EIN', dialCode: '+1671' },
  { name: 'Other', code: 'XX', currency: 'USD', taxName: 'Business Registration', dialCode: '+1' },
];


// Wedding Service Categories with detailed subcategories
export const weddingCategories: ServiceCategory[] = [
  {
    id: 'venues',
    name: 'Venues',
    icon: 'building',
    subcategories: [
      {
        id: 'venue-details',
        name: 'Venue Details',
        fields: [
          { id: 'capacity', label: 'Capacity Range', type: 'select', options: ['10-50', '50-100', '100-200', '200-500', '500+'], required: true },
          { id: 'venueType', label: 'Venue Type', type: 'select', options: ['Indoor', 'Outdoor', 'Both'], required: true },
          { id: 'onsiteAccommodation', label: 'Onsite Accommodation', type: 'boolean' },
          { id: 'accommodationCapacity', label: 'Accommodation Guest Capacity', type: 'number' },
          { id: 'exclusiveUse', label: 'Exclusive Use Available', type: 'boolean' },
          { id: 'wetWeather', label: 'Wet Weather Contingency', type: 'boolean' },
          { id: 'accessibility', label: 'Accessibility Features', type: 'multiselect', options: ['Wheelchair Access', 'Elevator', 'Accessible Restrooms', 'Hearing Loop', 'Braille Signage'] },
          { id: 'parkingCapacity', label: 'Parking Capacity', type: 'number' },
          { id: 'kitchenFacilities', label: 'Kitchen Facilities', type: 'select', options: ['Full Commercial Kitchen', 'Prep Kitchen', 'Warming Kitchen', 'None'] },
          { id: 'liquorLicense', label: 'Liquor License Status', type: 'select', options: ['Full License', 'BYO', 'Corkage Fee', 'No Alcohol'] },
        ]
      }
    ]
  },
  {
    id: 'catering',
    name: 'Catering & Beverage',
    icon: 'utensils',
    subcategories: [
      {
        id: 'catering-details',
        name: 'Catering Services',
        fields: [
          { id: 'serviceStyle', label: 'Service Style', type: 'multiselect', options: ['Plated', 'Buffet', 'Cocktail', 'Family Style', 'Food Stations', 'Food Trucks'], required: true },
          { id: 'cuisineSpecialties', label: 'Cuisine Specialties', type: 'multiselect', options: ['French', 'Italian', 'Asian Fusion', 'Mediterranean', 'Modern Australian', 'Indian', 'Mexican', 'Japanese', 'Thai', 'Middle Eastern', 'African', 'American BBQ', 'Seafood', 'Farm-to-Table'] },
          { id: 'dietaryAccommodations', label: 'Dietary Accommodations', type: 'multiselect', options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Kosher', 'Halal', 'Nut-Free', 'Dairy-Free', 'Low FODMAP', 'Keto', 'Paleo'], required: true },
          { id: 'minGuests', label: 'Minimum Guests', type: 'number', required: true },
          { id: 'maxGuests', label: 'Maximum Guests', type: 'number', required: true },
          { id: 'staffIncluded', label: 'Service Staff Included', type: 'boolean' },
          { id: 'staffRatio', label: 'Staff to Guest Ratio', type: 'select', options: ['1:10', '1:15', '1:20', '1:25', '1:30'] },
          { id: 'equipmentIncluded', label: 'Equipment Included', type: 'multiselect', options: ['Tables', 'Chairs', 'Linen', 'Glassware', 'Cutlery', 'Crockery', 'Serving Equipment'] },
          { id: 'barServices', label: 'Bar Services', type: 'multiselect', options: ['Full Bar', 'Beer & Wine Only', 'Mobile Bar', 'Dry Hire', 'Cocktail Service', 'Mocktail Service'] },
          { id: 'cakeServices', label: 'Cake Services', type: 'multiselect', options: ['Design', 'Baking', 'Delivery', 'Setup', 'Cutting Service'] },
        ]
      }
    ]
  },
  {
    id: 'celebrants',
    name: 'Celebrants & Officiants',
    icon: 'heart',
    subcategories: [
      {
        id: 'celebrant-details',
        name: 'Celebrant Services',
        fields: [
          { id: 'certificationType', label: 'Certification Type', type: 'text', required: true },
          { id: 'ceremonyTypes', label: 'Ceremony Types', type: 'multiselect', options: ['Civil', 'Religious', 'Spiritual', 'Themed', 'Elopement', 'Vow Renewal', 'Commitment Ceremony', 'Same-Sex', 'Interfaith'], required: true },
          { id: 'travelRadius', label: 'Travel Radius (km)', type: 'number', required: true },
          { id: 'rehearsalIncluded', label: 'Rehearsal Included', type: 'boolean' },
          { id: 'paSystemIncluded', label: 'Microphone/PA System Included', type: 'boolean' },
          { id: 'vowWritingAssistance', label: 'Vow Writing Assistance', type: 'boolean' },
          { id: 'customizationLevel', label: 'Ceremony Customization Level', type: 'select', options: ['Fully Customized', 'Semi-Customized', 'Template-Based'] },
          { id: 'languages', label: 'Languages Spoken', type: 'multiselect', options: ['English', 'Spanish', 'French', 'Italian', 'German', 'Mandarin', 'Cantonese', 'Japanese', 'Korean', 'Hindi', 'Arabic', 'Portuguese', 'Russian', 'Other'] },
        ]
      }
    ]
  },
  {
    id: 'photography',
    name: 'Photography & Videography',
    icon: 'camera',
    subcategories: [
      {
        id: 'photo-video-details',
        name: 'Photo & Video Services',
        fields: [
          { id: 'serviceType', label: 'Service Type', type: 'multiselect', options: ['Photography', 'Videography', 'Both'], required: true },
          { id: 'hoursAvailable', label: 'Hours Available', type: 'multiselect', options: ['4 Hours', '6 Hours', '8 Hours', '10 Hours', '12 Hours', 'Full Day'], required: true },
          { id: 'secondShooter', label: 'Second Shooter Included', type: 'boolean' },
          { id: 'editedPhotosQty', label: 'Edited Photos Quantity', type: 'select', options: ['100-200', '200-400', '400-600', '600-800', '800+'] },
          { id: 'turnaroundTime', label: 'Turnaround Time (weeks)', type: 'select', options: ['2-4 weeks', '4-6 weeks', '6-8 weeks', '8-12 weeks', '12+ weeks'] },
          { id: 'printPackages', label: 'Print Packages Available', type: 'boolean' },
          { id: 'albumDesign', label: 'Album Design & Printing', type: 'boolean' },
          { id: 'droneFootage', label: 'Drone Footage Available', type: 'boolean' },
          { id: 'rawFilesIncluded', label: 'Raw Files Included', type: 'boolean' },
          { id: 'engagementShoot', label: 'Engagement/Pre-Wedding Shoot Included', type: 'boolean' },
          { id: 'videoLength', label: 'Video Length', type: 'select', options: ['3-5 min highlight', '10-15 min feature', '20-30 min documentary', 'Full ceremony', 'Full day'] },
          { id: 'highlightReel', label: 'Highlight Reel Included', type: 'boolean' },
          { id: 'style', label: 'Photography Style', type: 'multiselect', options: ['Documentary', 'Fine Art', 'Editorial', 'Traditional', 'Photojournalistic', 'Moody', 'Light & Airy', 'Bold & Colorful'] },
        ]
      }
    ]
  },
  {
    id: 'floristry',
    name: 'Floristry & Styling',
    icon: 'flower',
    subcategories: [
      {
        id: 'floristry-details',
        name: 'Floristry Services',
        fields: [
          { id: 'designAesthetic', label: 'Design Aesthetic', type: 'multiselect', options: ['Classic', 'Modern', 'Bohemian', 'Rustic', 'Luxury', 'Minimalist', 'Romantic', 'Tropical', 'Garden', 'Wild/Organic', 'Vintage'], required: true },
          { id: 'services', label: 'Services Offered', type: 'multiselect', options: ['Bridal Bouquet', 'Bridesmaid Bouquets', 'Buttonholes/Boutonnieres', 'Corsages', 'Ceremony Flowers', 'Reception Centerpieces', 'Large Installations', 'Archways/Arbors', 'Aisle Decorations', 'Cake Flowers', 'Hair Flowers'], required: true },
          { id: 'seasonalSpecialist', label: 'Seasonal Flower Specialist', type: 'boolean' },
          { id: 'deliverySetup', label: 'Delivery & Setup Included', type: 'boolean' },
          { id: 'hireItems', label: 'Hire Items Available', type: 'multiselect', options: ['Vases', 'Stands', 'Arches', 'Backdrops', 'Candles', 'Lanterns', 'Plinths'] },
          { id: 'breakdownService', label: 'Breakdown Service Included', type: 'boolean' },
          { id: 'preservationService', label: 'Bouquet Preservation Service', type: 'boolean' },
        ]
      }
    ]
  },
  {
    id: 'entertainment',
    name: 'Entertainment & Music',
    icon: 'music',
    subcategories: [
      {
        id: 'entertainment-details',
        name: 'Entertainment Services',
        fields: [
          { id: 'entertainmentType', label: 'Entertainment Type', type: 'multiselect', options: ['DJ', 'Live Band', 'Solo Artist', 'String Quartet', 'Jazz Ensemble', 'MC/Host', 'Acoustic Duo', 'Harpist', 'Pianist', 'Saxophonist', 'Choir', 'Cultural Performers'], required: true },
          { id: 'equipmentIncluded', label: 'Equipment Included', type: 'multiselect', options: ['Sound System', 'Lighting', 'Microphones', 'DJ Booth', 'Stage', 'Dance Floor Lighting'] },
          { id: 'hoursAvailable', label: 'Hours Available', type: 'multiselect', options: ['2 Hours', '3 Hours', '4 Hours', '5 Hours', '6 Hours', '8 Hours', 'Full Day'] },
          { id: 'genreSpecialization', label: 'Music Genre Specialization', type: 'multiselect', options: ['Top 40', 'R&B/Soul', 'Jazz', 'Classical', 'Rock', 'Country', 'Latin', 'Electronic/House', 'Motown', 'Indie', '80s/90s', 'Cultural/Traditional'] },
          { id: 'ceremonyMusic', label: 'Ceremony Music Available', type: 'boolean' },
          { id: 'playlistCustomization', label: 'Playlist Customization', type: 'boolean' },
          { id: 'backupEquipment', label: 'Backup Equipment Available', type: 'boolean' },
          { id: 'mcServices', label: 'MC Services Included', type: 'boolean' },
        ]
      }
    ]
  },
  {
    id: 'av-lighting',
    name: 'Audio Visual & Lighting',
    icon: 'lightbulb',
    subcategories: [
      {
        id: 'av-details',
        name: 'AV & Lighting Services',
        fields: [
          { id: 'paSystem', label: 'PA System Specifications', type: 'textarea' },
          { id: 'lightingTypes', label: 'Lighting Types', type: 'multiselect', options: ['Uplighting', 'Pin Spotting', 'Festoon/String Lights', 'Fairy Lights', 'Gobo Projection', 'Intelligent/Moving Lights', 'LED Wash', 'Chandeliers', 'Neon Signs', 'Canopy Lighting'], required: true },
          { id: 'avForPresentations', label: 'AV for Presentations', type: 'boolean' },
          { id: 'microphoneTypes', label: 'Microphone Types', type: 'multiselect', options: ['Handheld', 'Lapel/Lavalier', 'Lectern', 'Headset', 'Wireless'] },
          { id: 'projectorScreen', label: 'Projector & Screen Available', type: 'boolean' },
          { id: 'ledWalls', label: 'LED Walls/Screens Available', type: 'boolean' },
          { id: 'technicianIncluded', label: 'Technician Included', type: 'boolean' },
          { id: 'setupTime', label: 'Setup/Pack Down Time Required', type: 'select', options: ['1-2 hours', '2-4 hours', '4-6 hours', '6-8 hours', 'Full day'] },
        ]
      }
    ]
  },
  {
    id: 'hair-makeup',
    name: 'Hair & Makeup',
    icon: 'sparkles',
    subcategories: [
      {
        id: 'beauty-details',
        name: 'Beauty Services',
        fields: [
          { id: 'services', label: 'Services Offered', type: 'multiselect', options: ['Bridal Hair', 'Bridal Makeup', 'Bridesmaid Hair', 'Bridesmaid Makeup', 'Groom Grooming', 'Mother of Bride/Groom', 'Guest Services', 'Flower Girl'], required: true },
          { id: 'travelToVenue', label: 'Travel to Venue', type: 'boolean' },
          { id: 'travelRadius', label: 'Travel Radius (km)', type: 'number' },
          { id: 'trialIncluded', label: 'Trial Session Included', type: 'boolean' },
          { id: 'artistsAvailable', label: 'Number of Artists Available', type: 'select', options: ['1', '2', '3', '4', '5+'] },
          { id: 'hoursOnsite', label: 'Hours On-Site', type: 'select', options: ['2-3 hours', '3-4 hours', '4-6 hours', '6-8 hours', 'Full day'] },
          { id: 'touchUpServices', label: 'Touch-Up Services Available', type: 'boolean' },
          { id: 'airbrushAvailable', label: 'Airbrush Makeup Available', type: 'boolean' },
          { id: 'hairExtensions', label: 'Hair Extension Application', type: 'boolean' },
          { id: 'falseLashes', label: 'False Lash Application', type: 'boolean' },
        ]
      }
    ]
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: 'car',
    subcategories: [
      {
        id: 'transport-details',
        name: 'Transport Services',
        fields: [
          { id: 'vehicleType', label: 'Vehicle Type', type: 'multiselect', options: ['Vintage Car', 'Classic Car', 'Luxury Sedan', 'Limousine', 'Stretch Limo', 'Party Bus', 'Mini Bus', 'Coach', 'Boat/Yacht', 'Horse & Carriage', 'Helicopter', 'Convertible', 'Sports Car', 'Rolls Royce', 'Bentley', 'Mercedes', 'Kombi Van'], required: true },
          { id: 'passengerCapacity', label: 'Passenger Capacity', type: 'number', required: true },
          { id: 'chauffeurIncluded', label: 'Chauffeur Included', type: 'boolean' },
          { id: 'hoursIncluded', label: 'Hours Included', type: 'select', options: ['2 hours', '3 hours', '4 hours', '5 hours', '6 hours', '8 hours', 'Full day'] },
          { id: 'decorationsIncluded', label: 'Decorations Included', type: 'boolean' },
          { id: 'multiplePickups', label: 'Multiple Pick-Up Locations', type: 'boolean' },
          { id: 'redCarpetService', label: 'Red Carpet Service', type: 'boolean' },
          { id: 'refreshments', label: 'Refreshments Provided', type: 'boolean' },
        ]
      }
    ]
  },
  {
    id: 'stationery',
    name: 'Stationery & Signage',
    icon: 'pen',
    subcategories: [
      {
        id: 'stationery-details',
        name: 'Stationery Services',
        fields: [
          { id: 'invitationType', label: 'Invitation Type', type: 'multiselect', options: ['Digital', 'Printed', 'Both'], required: true },
          { id: 'products', label: 'Products Offered', type: 'multiselect', options: ['Save the Dates', 'Invitations', 'RSVP Cards', 'Programs', 'Menus', 'Place Cards', 'Table Numbers', 'Welcome Signs', 'Seating Charts', 'Directional Signs', 'Bar Menus', 'Thank You Cards', 'Favor Tags'], required: true },
          { id: 'designRevisions', label: 'Design Revisions Included', type: 'select', options: ['1', '2', '3', 'Unlimited'] },
          { id: 'printingDelivery', label: 'Printing & Delivery Included', type: 'boolean' },
          { id: 'calligraphyServices', label: 'Calligraphy Services', type: 'boolean' },
          { id: 'customIllustration', label: 'Custom Illustration Available', type: 'boolean' },
          { id: 'foilStamping', label: 'Foil Stamping Available', type: 'boolean' },
          { id: 'letterpress', label: 'Letterpress Available', type: 'boolean' },
        ]
      }
    ]
  },
  {
    id: 'cake-desserts',
    name: 'Wedding Cake & Desserts',
    icon: 'cake',
    subcategories: [
      {
        id: 'cake-details',
        name: 'Cake & Dessert Services',
        fields: [
          { id: 'cakeTiers', label: 'Cake Tiers Available', type: 'multiselect', options: ['1 Tier', '2 Tiers', '3 Tiers', '4 Tiers', '5 Tiers', '6+ Tiers'], required: true },
          { id: 'minServings', label: 'Minimum Servings', type: 'number' },
          { id: 'maxServings', label: 'Maximum Servings', type: 'number' },
          { id: 'flavorsAvailable', label: 'Flavors Available', type: 'multiselect', options: ['Vanilla', 'Chocolate', 'Red Velvet', 'Lemon', 'Carrot', 'Fruit', 'Salted Caramel', 'Coffee', 'Almond', 'Coconut', 'Champagne', 'Custom'] },
          { id: 'dietaryOptions', label: 'Dietary Options', type: 'multiselect', options: ['Gluten-Free', 'Vegan', 'Dairy-Free', 'Nut-Free', 'Sugar-Free', 'Keto'] },
          { id: 'tastingIncluded', label: 'Tasting Session Included', type: 'boolean' },
          { id: 'deliverySetup', label: 'Delivery & Setup Included', type: 'boolean' },
          { id: 'cakeStandHire', label: 'Cake Stand Hire Available', type: 'boolean' },
          { id: 'dessertTables', label: 'Dessert Tables/Bars', type: 'multiselect', options: ['Cupcakes', 'Macarons', 'Donuts', 'Cookies', 'Brownies', 'Cheesecake', 'Fruit', 'Chocolate Fountain', 'Ice Cream', 'Pastries'] },
          { id: 'favorBoxes', label: 'Favor Boxes Available', type: 'boolean' },
        ]
      }
    ]
  },
  {
    id: 'furniture-hire',
    name: 'Furniture & Equipment Hire',
    icon: 'sofa',
    subcategories: [
      {
        id: 'hire-details',
        name: 'Hire Services',
        fields: [
          { id: 'chairTypes', label: 'Chair Types', type: 'multiselect', options: ['Chiavari', 'Cross-Back', 'Ghost/Clear', 'Tiffany', 'Bentwood', 'Folding', 'Banquet', 'Lounge', 'Bar Stools'], required: true },
          { id: 'tableTypes', label: 'Table Types', type: 'multiselect', options: ['Round', 'Rectangle/Banquet', 'Square', 'Cocktail/High', 'Trestle', 'Sweetheart', 'Harvest/Farm'] },
          { id: 'linenOptions', label: 'Linen Options', type: 'multiselect', options: ['Tablecloths', 'Napkins', 'Table Runners', 'Chair Sashes', 'Chair Covers', 'Overlays'] },
          { id: 'glasswareCrockery', label: 'Glassware & Crockery', type: 'multiselect', options: ['Wine Glasses', 'Champagne Flutes', 'Tumblers', 'Dinner Plates', 'Side Plates', 'Bowls', 'Charger Plates'] },
          { id: 'cutlery', label: 'Cutlery Available', type: 'boolean' },
          { id: 'marqueesTents', label: 'Marquees/Tents', type: 'multiselect', options: ['Clear Marquee', 'White Marquee', 'Sailcloth Tent', 'Stretch Tent', 'Tipi/Teepee', 'Pagoda'] },
          { id: 'danceFloors', label: 'Dance Floors Available', type: 'boolean' },
          { id: 'stagingPlatforms', label: 'Staging/Platforms Available', type: 'boolean' },
          { id: 'deliverySetupBreakdown', label: 'Delivery/Setup/Breakdown Included', type: 'boolean' },
        ]
      }
    ]
  },
  {
    id: 'attire',
    name: 'Attire & Accessories',
    icon: 'shirt',
    subcategories: [
      {
        id: 'attire-details',
        name: 'Attire Services',
        fields: [
          { id: 'products', label: 'Products Offered', type: 'multiselect', options: ['Bridal Gowns', 'Bridesmaid Dresses', 'Suits', 'Tuxedos', 'Groomsmen Attire', 'Mother of Bride/Groom', 'Flower Girl Dresses', 'Page Boy Suits'], required: true },
          { id: 'serviceType', label: 'Service Type', type: 'multiselect', options: ['Purchase', 'Hire/Rental', 'Custom Design', 'Made-to-Measure'] },
          { id: 'alterationsIncluded', label: 'Alterations Included', type: 'boolean' },
          { id: 'accessories', label: 'Accessories Available', type: 'multiselect', options: ['Veils', 'Headpieces', 'Jewelry', 'Shoes', 'Ties', 'Bow Ties', 'Cufflinks', 'Suspenders', 'Belts'] },
          { id: 'dryCleaningIncluded', label: 'Dry Cleaning Included', type: 'boolean' },
          { id: 'fittingAppointments', label: 'Fitting Appointments Included', type: 'select', options: ['1', '2', '3', 'Unlimited'] },
        ]
      }
    ]
  },
  {
    id: 'planning',
    name: 'Wedding Planning & Coordination',
    icon: 'clipboard',
    subcategories: [
      {
        id: 'planning-details',
        name: 'Planning Services',
        fields: [
          { id: 'serviceLevel', label: 'Service Level', type: 'multiselect', options: ['Full Planning', 'Partial Planning', 'Month-Of Coordination', 'Day-Of Coordination', 'Destination Wedding Planning', 'Elopement Planning'], required: true },
          { id: 'consultationHours', label: 'Initial Consultation Hours', type: 'select', options: ['1 hour', '2 hours', '3 hours', 'Unlimited'] },
          { id: 'vendorSourcing', label: 'Vendor Sourcing & Management', type: 'boolean' },
          { id: 'budgetManagement', label: 'Budget Management Tools', type: 'boolean' },
          { id: 'designConcept', label: 'Design Concept Development', type: 'boolean' },
          { id: 'timelineCreation', label: 'Timeline Creation', type: 'boolean' },
          { id: 'rehearsalCoordination', label: 'Rehearsal Coordination', type: 'boolean' },
          { id: 'dayOfHours', label: 'Day-Of Coordinator Hours', type: 'select', options: ['8 hours', '10 hours', '12 hours', '14 hours', 'Unlimited'] },
          { id: 'assistantCoordinators', label: 'Assistant Coordinators Included', type: 'select', options: ['0', '1', '2', '3+'] },
        ]
      }
    ]
  },
];

// Corporate Event Categories
export const corporateCategories: ServiceCategory[] = [
  {
    id: 'conference-venues',
    name: 'Conference & Meeting Venues',
    icon: 'building',
    subcategories: [
      {
        id: 'conference-details',
        name: 'Conference Venue Details',
        fields: [
          { id: 'capacity', label: 'Capacity Range', type: 'select', options: ['10-50', '50-100', '100-250', '250-500', '500-1000', '1000+'], required: true },
          { id: 'roomTypes', label: 'Room Types', type: 'multiselect', options: ['Boardroom', 'Theater Style', 'Classroom', 'U-Shape', 'Banquet', 'Exhibition Hall', 'Breakout Rooms'] },
          { id: 'avEquipment', label: 'AV Equipment Included', type: 'multiselect', options: ['Projector', 'Screen', 'Microphones', 'Video Conferencing', 'Live Streaming', 'Recording'] },
          { id: 'cateringOnsite', label: 'Onsite Catering Available', type: 'boolean' },
          { id: 'wifi', label: 'High-Speed WiFi', type: 'boolean' },
          { id: 'accessibility', label: 'Accessibility Features', type: 'multiselect', options: ['Wheelchair Access', 'Hearing Loop', 'Accessible Restrooms'] },
        ]
      }
    ]
  },
  {
    id: 'av-production',
    name: 'AV & Production',
    icon: 'monitor',
    subcategories: [
      {
        id: 'production-details',
        name: 'Production Services',
        fields: [
          { id: 'services', label: 'Services Offered', type: 'multiselect', options: ['Staging', 'LED Walls', 'Live Streaming', 'Video Production', 'Lighting Design', 'Sound Engineering', 'Projection Mapping', 'Virtual Event Production'], required: true },
          { id: 'equipmentOwned', label: 'Equipment Owned', type: 'boolean' },
          { id: 'technicianIncluded', label: 'Technicians Included', type: 'boolean' },
          { id: 'setupTime', label: 'Setup Time Required', type: 'select', options: ['Half Day', 'Full Day', '2 Days', '3+ Days'] },
        ]
      }
    ]
  },
  {
    id: 'corporate-catering',
    name: 'Corporate Catering',
    icon: 'utensils',
    subcategories: [
      {
        id: 'corp-catering-details',
        name: 'Corporate Catering Services',
        fields: [
          { id: 'mealTypes', label: 'Meal Types', type: 'multiselect', options: ['Breakfast', 'Morning Tea', 'Lunch', 'Afternoon Tea', 'Dinner', 'Canapes', 'Cocktail', 'Working Lunch', 'Gala Dinner'], required: true },
          { id: 'minGuests', label: 'Minimum Guests', type: 'number' },
          { id: 'maxGuests', label: 'Maximum Guests', type: 'number' },
          { id: 'dietaryOptions', label: 'Dietary Options', type: 'multiselect', options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Nut-Free'] },
          { id: 'serviceStaff', label: 'Service Staff Included', type: 'boolean' },
        ]
      }
    ]
  },
  {
    id: 'event-technology',
    name: 'Event Technology',
    icon: 'smartphone',
    subcategories: [
      {
        id: 'tech-details',
        name: 'Technology Services',
        fields: [
          { id: 'services', label: 'Services Offered', type: 'multiselect', options: ['Registration Apps', 'Event Apps', 'Live Polling', 'Q&A Platforms', 'Translation Services', 'Badge Printing', 'Lead Retrieval', 'Virtual Event Platforms', 'Hybrid Event Solutions'], required: true },
          { id: 'customBranding', label: 'Custom Branding Available', type: 'boolean' },
          { id: 'analytics', label: 'Analytics & Reporting', type: 'boolean' },
          { id: 'support', label: 'On-Site Support', type: 'boolean' },
        ]
      }
    ]
  },
  {
    id: 'corporate-entertainment',
    name: 'Corporate Entertainment',
    icon: 'music',
    subcategories: [
      {
        id: 'corp-entertainment-details',
        name: 'Entertainment Services',
        fields: [
          { id: 'entertainmentTypes', label: 'Entertainment Types', type: 'multiselect', options: ['Keynote Speakers', 'MC/Host', 'Live Band', 'DJ', 'Comedians', 'Magicians', 'Team Building Activities', 'Photo Booths', 'Roving Entertainment', 'Award Show Production'], required: true },
          { id: 'equipmentIncluded', label: 'Equipment Included', type: 'boolean' },
          { id: 'customContent', label: 'Custom Content Creation', type: 'boolean' },
        ]
      }
    ]
  },
];

// Social Event Categories
export const socialCategories: ServiceCategory[] = [
  {
    id: 'party-venues',
    name: 'Party Venues',
    icon: 'party',
    subcategories: [
      {
        id: 'party-venue-details',
        name: 'Party Venue Details',
        fields: [
          { id: 'capacity', label: 'Capacity Range', type: 'select', options: ['10-30', '30-50', '50-100', '100-200', '200+'], required: true },
          { id: 'venueType', label: 'Venue Type', type: 'multiselect', options: ['Restaurant', 'Bar', 'Club', 'Private Residence', 'Rooftop', 'Garden', 'Beach', 'Boat', 'Warehouse'] },
          { id: 'cateringOptions', label: 'Catering Options', type: 'multiselect', options: ['In-House Catering', 'BYO Catering', 'External Caterers Allowed'] },
          { id: 'barOptions', label: 'Bar Options', type: 'multiselect', options: ['Full Bar', 'BYO', 'Cash Bar', 'Tab'] },
        ]
      }
    ]
  },
  {
    id: 'party-services',
    name: 'Party Services',
    icon: 'sparkles',
    subcategories: [
      {
        id: 'party-services-details',
        name: 'Party Service Details',
        fields: [
          { id: 'services', label: 'Services Offered', type: 'multiselect', options: ['Party Planning', 'Decorations', 'Balloons', 'Photo Booth', 'Face Painting', 'Kids Entertainment', 'Character Appearances', 'Party Games', 'Pinatas', 'Party Favors'], required: true },
          { id: 'eventTypes', label: 'Event Types', type: 'multiselect', options: ['Birthday Parties', 'Baby Showers', 'Engagement Parties', 'Graduation Parties', 'Anniversary Parties', 'Retirement Parties', 'Holiday Parties', 'Theme Parties'] },
          { id: 'ageGroups', label: 'Age Groups Served', type: 'multiselect', options: ['Toddlers (1-3)', 'Kids (4-12)', 'Teens (13-17)', 'Adults (18+)', 'Seniors'] },
        ]
      }
    ]
  },
];

// All event types with their categories
export const eventTypeCategories: EventTypeCategory[] = [
  {
    id: 'weddings',
    name: 'Weddings',
    description: 'Everything you need for your perfect wedding day',
    categories: weddingCategories,
  },
  {
    id: 'corporate',
    name: 'Corporate Events',
    description: 'Professional services for business events and conferences',
    categories: corporateCategories,
  },
  {
    id: 'social',
    name: 'Social Events',
    description: 'Services for parties, celebrations, and gatherings',
    categories: socialCategories,
  },
];

// Insurance types
export const insuranceTypes = [
  'Public Liability',
  'Professional Indemnity',
  'Product Liability',
  'Workers Compensation',
  'Equipment Insurance',
  'Event Cancellation',
];

// Service radius options
export const serviceRadiusOptions = [
  { value: '25', label: '25 km' },
  { value: '50', label: '50 km' },
  { value: '100', label: '100 km' },
  { value: '200', label: '200 km' },
  { value: '500', label: '500 km' },
  { value: 'national', label: 'Nationwide' },
  { value: 'international', label: 'International' },
];

// Years in operation options
export const yearsInOperationOptions = [
  'Less than 1 year',
  '1-2 years',
  '3-5 years',
  '5-10 years',
  '10-20 years',
  '20+ years',
];
