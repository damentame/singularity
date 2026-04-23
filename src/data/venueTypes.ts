// Comprehensive venue and accommodation types inspired by Airbnb categories

export interface VenueType {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'venue' | 'accommodation' | 'unique';
}

export interface AccommodationType {
  id: string;
  name: string;
  description: string;
  icon: string;
  popular: boolean;
}

// Venue subcategories for events
export const venueSubcategories: VenueType[] = [
  // Luxury & Hotels
  { id: 'luxury-hotels', name: 'Luxury Hotels', description: 'Five-star hotels with world-class service', icon: 'Crown', category: 'venue' },
  { id: 'boutique-hotels', name: 'Boutique Hotels', description: 'Intimate hotels with unique character', icon: 'Sparkles', category: 'venue' },
  { id: 'historic-hotels', name: 'Historic Hotels', description: 'Heritage properties with timeless elegance', icon: 'Landmark', category: 'venue' },
  
  // Wine & Estates
  { id: 'wine-estates', name: 'Wine Estates', description: 'Vineyards with stunning terroir', icon: 'Wine', category: 'venue' },
  { id: 'vineyards', name: 'Vineyards', description: 'Rolling vine-covered landscapes', icon: 'Grape', category: 'venue' },
  { id: 'olive-groves', name: 'Olive Groves', description: 'Mediterranean charm and tranquility', icon: 'TreeDeciduous', category: 'venue' },
  
  // Castles & Historic
  { id: 'castles', name: 'Castles', description: 'Fairytale settings with royal grandeur', icon: 'Castle', category: 'venue' },
  { id: 'chateaux', name: 'Châteaux', description: 'French elegance and sophistication', icon: 'Building2', category: 'venue' },
  { id: 'palaces', name: 'Palaces', description: 'Opulent venues fit for royalty', icon: 'Crown', category: 'venue' },
  { id: 'manor-houses', name: 'Manor Houses', description: 'Stately homes with character', icon: 'Home', category: 'venue' },
  { id: 'historic-estates', name: 'Historic Estates', description: 'Heritage properties with stories to tell', icon: 'Landmark', category: 'venue' },
  
  // Villas & Private
  { id: 'villas', name: 'Villas', description: 'Private luxury with exclusive access', icon: 'Home', category: 'venue' },
  { id: 'private-estates', name: 'Private Estates', description: 'Exclusive grounds for intimate celebrations', icon: 'Lock', category: 'venue' },
  { id: 'mansions', name: 'Mansions', description: 'Grand residences with impressive spaces', icon: 'Building', category: 'venue' },
  
  // Gardens & Outdoor
  { id: 'gardens', name: 'Gardens & Parks', description: 'Botanical beauty and natural settings', icon: 'Flower2', category: 'venue' },
  { id: 'botanical-gardens', name: 'Botanical Gardens', description: 'Curated plant collections and landscapes', icon: 'Trees', category: 'venue' },
  { id: 'conservatories', name: 'Conservatories', description: 'Glass-enclosed garden spaces', icon: 'Warehouse', category: 'venue' },
  
  // Beach & Water
  { id: 'beach-resorts', name: 'Beach Resorts', description: 'Oceanfront luxury and sandy shores', icon: 'Waves', category: 'venue' },
  { id: 'beachfront', name: 'Beachfront', description: 'Direct beach access and sea views', icon: 'Umbrella', category: 'venue' },
  { id: 'lakefront', name: 'Lakefront', description: 'Serene waterside settings', icon: 'Droplets', category: 'venue' },
  { id: 'waterfront', name: 'Waterfront', description: 'Harbor and marina views', icon: 'Anchor', category: 'venue' },
  { id: 'yachts', name: 'Yachts & Boats', description: 'Celebrations on the water', icon: 'Ship', category: 'venue' },
  { id: 'islands', name: 'Private Islands', description: 'Ultimate exclusivity and privacy', icon: 'Palmtree', category: 'venue' },
  
  // Mountain & Nature
  { id: 'mountain-resorts', name: 'Mountain Resorts', description: 'Alpine luxury with panoramic views', icon: 'Mountain', category: 'venue' },
  { id: 'ski-resorts', name: 'Ski Resorts', description: 'Winter wonderland celebrations', icon: 'Snowflake', category: 'venue' },
  { id: 'cliff-resorts', name: 'Cliff Resorts', description: 'Dramatic clifftop locations', icon: 'MountainSnow', category: 'venue' },
  { id: 'wellness-resorts', name: 'Wellness Resorts', description: 'Holistic retreats and spa destinations', icon: 'Leaf', category: 'venue' },
  
  // Rustic & Country
  { id: 'barns', name: 'Barns', description: 'Rustic charm with modern amenities', icon: 'Warehouse', category: 'venue' },
  { id: 'farms', name: 'Farms & Ranches', description: 'Country settings with pastoral views', icon: 'Tractor', category: 'venue' },
  { id: 'country-clubs', name: 'Country Clubs', description: 'Refined settings with golf courses', icon: 'Flag', category: 'venue' },
  { id: 'lodges', name: 'Lodges', description: 'Cozy retreats in natural settings', icon: 'Tent', category: 'venue' },
  
  // Urban & Modern
  { id: 'rooftops', name: 'Rooftops', description: 'City skyline views and urban chic', icon: 'Building2', category: 'venue' },
  { id: 'lofts', name: 'Lofts & Studios', description: 'Industrial spaces with creative flair', icon: 'LayoutGrid', category: 'venue' },
  { id: 'warehouses', name: 'Warehouses', description: 'Raw industrial spaces for transformation', icon: 'Factory', category: 'venue' },
  { id: 'galleries', name: 'Art Galleries', description: 'Cultural spaces surrounded by art', icon: 'Frame', category: 'venue' },
  { id: 'museums', name: 'Museums', description: 'Historic and cultural institutions', icon: 'Building', category: 'venue' },
  { id: 'theaters', name: 'Theaters', description: 'Dramatic settings with stage presence', icon: 'Drama', category: 'venue' },
  
  // Restaurants & Dining
  { id: 'restaurants', name: 'Restaurants', description: 'Culinary venues with private dining', icon: 'UtensilsCrossed', category: 'venue' },
  { id: 'private-dining', name: 'Private Dining Rooms', description: 'Intimate spaces for exclusive dinners', icon: 'Utensils', category: 'venue' },
  { id: 'wineries', name: 'Wineries', description: 'Wine cellars and tasting rooms', icon: 'Wine', category: 'venue' },
  
  // Unique & Special
  { id: 'marquees', name: 'Marquees & Tents', description: 'Flexible outdoor structures', icon: 'Tent', category: 'venue' },
  { id: 'greenhouses', name: 'Greenhouses', description: 'Glass structures with botanical beauty', icon: 'Flower', category: 'venue' },
  { id: 'observatories', name: 'Observatories', description: 'Stargazing venues under the sky', icon: 'Star', category: 'venue' },
  { id: 'libraries', name: 'Libraries', description: 'Literary settings with character', icon: 'BookOpen', category: 'venue' },
];

// Airbnb-style accommodation types - Comprehensive list
export const accommodationTypes: AccommodationType[] = [
  // Most Popular
  { id: 'castles', name: 'Castles', description: 'Live like royalty in historic fortresses', icon: 'Castle', popular: true },
  { id: 'villas', name: 'Villas', description: 'Luxurious private homes with premium amenities', icon: 'Home', popular: true },
  { id: 'vineyards', name: 'Vineyards', description: 'Stay among the vines in wine country', icon: 'Wine', popular: true },
  { id: 'beachfront', name: 'Beachfront', description: 'Wake up to ocean views and sandy shores', icon: 'Waves', popular: true },
  { id: 'mansions', name: 'Mansions', description: 'Grand estates with impressive spaces', icon: 'Building', popular: true },
  { id: 'luxe', name: 'Luxe', description: 'Extraordinary homes with exceptional design', icon: 'Sparkles', popular: true },
  
  // Nature & Unique
  { id: 'treehouses', name: 'Treehouses', description: 'Elevated escapes among the branches', icon: 'TreePine', popular: true },
  { id: 'cabins', name: 'Cabins', description: 'Cozy retreats in natural settings', icon: 'Home', popular: true },
  { id: 'tiny-homes', name: 'Tiny Homes', description: 'Compact living with clever design', icon: 'Box', popular: false },
  { id: 'domes', name: 'Domes', description: 'Unique geodesic structures', icon: 'Circle', popular: true },
  { id: 'yurts', name: 'Yurts', description: 'Traditional circular tents with modern comfort', icon: 'Tent', popular: false },
  { id: 'caves', name: 'Caves', description: 'Underground dwellings carved from rock', icon: 'Mountain', popular: false },
  { id: 'earth-homes', name: 'Earth Homes', description: 'Sustainable homes built into the landscape', icon: 'Leaf', popular: false },
  { id: 'containers', name: 'Containers', description: 'Converted shipping containers with style', icon: 'Container', popular: false },
  { id: 'a-frames', name: 'A-Frames', description: 'Iconic triangular cabins', icon: 'Triangle', popular: true },
  { id: 'barns', name: 'Barns', description: 'Converted barns with rustic charm', icon: 'Warehouse', popular: false },
  { id: 'chalets', name: 'Chalets', description: 'Alpine-style mountain retreats', icon: 'Home', popular: true },
  
  // Water
  { id: 'houseboats', name: 'Houseboats', description: 'Floating homes on the water', icon: 'Ship', popular: true },
  { id: 'boats', name: 'Boats', description: 'Stay aboard vessels of all sizes', icon: 'Anchor', popular: false },
  { id: 'lakefront', name: 'Lakefront', description: 'Peaceful retreats by the lake', icon: 'Droplets', popular: true },
  { id: 'islands', name: 'Private Islands', description: 'Private island getaways', icon: 'Palmtree', popular: true },
  { id: 'overwater', name: 'Overwater Bungalows', description: 'Luxury stays above crystal waters', icon: 'Waves', popular: true },
  { id: 'floating-homes', name: 'Floating Homes', description: 'Permanent homes on the water', icon: 'Home', popular: false },
  
  // Rural & Country
  { id: 'farms', name: 'Farms', description: 'Working farms with authentic experiences', icon: 'Tractor', popular: true },
  { id: 'countryside', name: 'Countryside', description: 'Rural escapes with pastoral views', icon: 'Trees', popular: true },
  { id: 'ranches', name: 'Ranches', description: 'Western-style properties with land', icon: 'Fence', popular: false },
  { id: 'cottages', name: 'Cottages', description: 'Charming small homes in scenic locations', icon: 'Home', popular: true },
  { id: 'farmhouses', name: 'Farmhouses', description: 'Traditional farm dwellings', icon: 'Home', popular: true },
  { id: 'guesthouses', name: 'Guesthouses', description: 'Private guest accommodations', icon: 'Home', popular: true },
  
  // Historic & Cultural
  { id: 'historic-homes', name: 'Historic Homes', description: 'Properties with heritage and character', icon: 'Landmark', popular: false },
  { id: 'ryokans', name: 'Ryokans', description: 'Traditional Japanese inns', icon: 'Home', popular: false },
  { id: 'riads', name: 'Riads', description: 'Traditional Moroccan houses with courtyards', icon: 'Building', popular: false },
  { id: 'trulli', name: 'Trulli', description: 'Cone-roofed stone huts of Puglia', icon: 'Triangle', popular: false },
  { id: 'windmills', name: 'Windmills', description: 'Converted windmills with unique character', icon: 'Wind', popular: false },
  { id: 'towers', name: 'Towers', description: 'Historic towers and turrets', icon: 'Building2', popular: false },
  { id: 'shepherds-huts', name: "Shepherd's Huts", description: 'Charming wheeled cabins', icon: 'Home', popular: false },
  { id: 'lighthouses', name: 'Lighthouses', description: 'Coastal beacons converted to stays', icon: 'Lightbulb', popular: false },
  { id: 'monasteries', name: 'Monasteries', description: 'Historic religious buildings', icon: 'Building', popular: false },
  { id: 'haciendas', name: 'Haciendas', description: 'Spanish colonial estates', icon: 'Building', popular: false },
  
  // Adventure & Activities
  { id: 'ski-in-out', name: 'Ski-in/Ski-out', description: 'Direct access to the slopes', icon: 'Snowflake', popular: true },
  { id: 'surfing', name: 'Surfing', description: 'Near the best breaks', icon: 'Waves', popular: false },
  { id: 'tropical', name: 'Tropical', description: 'Paradise destinations with palm trees', icon: 'Palmtree', popular: true },
  { id: 'desert', name: 'Desert', description: 'Dramatic landscapes and starry skies', icon: 'Sun', popular: false },
  { id: 'arctic', name: 'Arctic', description: 'Northern adventures and aurora views', icon: 'Snowflake', popular: false },
  { id: 'safari', name: 'Safari Lodges', description: 'Wildlife experiences in luxury', icon: 'Binoculars', popular: true },
  { id: 'mountain', name: 'Mountain Retreats', description: 'High altitude escapes', icon: 'Mountain', popular: true },
  { id: 'golf', name: 'Golf Resorts', description: 'Stay and play packages', icon: 'Flag', popular: false },
  { id: 'spa-resorts', name: 'Spa Resorts', description: 'Wellness-focused retreats', icon: 'Sparkles', popular: true },
  
  // Unique Stays (OMG!)
  { id: 'omg', name: 'OMG!', description: 'Extraordinary and unexpected stays', icon: 'Zap', popular: true },
  { id: 'creative-spaces', name: 'Creative Spaces', description: 'Artistic and inspiring environments', icon: 'Palette', popular: false },
  { id: 'glamping', name: 'Glamping', description: 'Glamorous camping experiences', icon: 'Tent', popular: true },
  { id: 'pods', name: 'Pods', description: 'Compact modern sleeping pods', icon: 'Hexagon', popular: false },
  { id: 'igloos', name: 'Igloos', description: 'Glass or ice dome experiences', icon: 'Snowflake', popular: false },
  { id: 'converted-spaces', name: 'Converted Spaces', description: 'Churches, schools, and more reimagined', icon: 'RefreshCw', popular: false },
  { id: 'train-cars', name: 'Train Cars', description: 'Vintage railway carriages', icon: 'Train', popular: false },
  { id: 'airplanes', name: 'Airplanes', description: 'Converted aircraft accommodations', icon: 'Plane', popular: false },
  { id: 'buses', name: 'Converted Buses', description: 'Mobile homes on wheels', icon: 'Bus', popular: false },
  
  // Urban
  { id: 'penthouses', name: 'Penthouses', description: 'Top-floor luxury with city views', icon: 'Building2', popular: true },
  { id: 'lofts', name: 'Lofts', description: 'Open-plan urban spaces', icon: 'LayoutGrid', popular: true },
  { id: 'apartments', name: 'Apartments', description: 'City living with local flavor', icon: 'Building', popular: true },
  { id: 'townhouses', name: 'Townhouses', description: 'Multi-story urban homes', icon: 'Home', popular: true },
  { id: 'condos', name: 'Condos', description: 'Modern condominium stays', icon: 'Building', popular: true },
  
  // Bed & Breakfast
  { id: 'bed-breakfast', name: 'Bed & Breakfast', description: 'Homestyle stays with morning meals', icon: 'Coffee', popular: true },
  { id: 'boutique-hotels', name: 'Boutique Hotels', description: 'Unique small hotels with character', icon: 'Hotel', popular: true },
  { id: 'hostels', name: 'Hostels', description: 'Social stays for travelers', icon: 'Users', popular: false },
  { id: 'inns', name: 'Inns', description: 'Traditional roadside lodging', icon: 'Home', popular: false },
];


// Supplier categories with subcategories
export const supplierCategories = [
  {
    id: 'venues',
    name: 'Venues',
    icon: 'Building2',
    subcategories: [
      'Luxury Hotels',
      'Boutique Hotels',
      'Wine Estates',
      'Vineyards',
      'Castles',
      'Châteaux',
      'Villas',
      'Private Estates',
      'Gardens & Parks',
      'Beach Resorts',
      'Mountain Resorts',
      'Wellness Resorts',
      'Cliff Resorts',
      'Island Resorts',
      'Barns',
      'Farms & Ranches',
      'Rooftops',
      'Lofts & Studios',
      'Art Galleries',
      'Museums',
      'Restaurants',
      'Yachts & Boats',
      'Marquees & Tents',
    ],
  },
  {
    id: 'accommodation',
    name: 'Accommodation',
    icon: 'Bed',
    subcategories: [
      'Castles',
      'Villas',
      'Vineyards',
      'Beachfront',
      'Mansions',
      'Treehouses',
      'Cabins',
      'Domes',
      'Houseboats',
      'Farms',
      'Safari Lodges',
      'Glamping',
      'Ski-in/Ski-out',
      'Tropical',
      'Islands',
      'Lakefront',
      'Ryokans',
      'Riads',
    ],
  },
  {
    id: 'photography',
    name: 'Photography',
    icon: 'Camera',
    subcategories: ['Wedding Photography', 'Fine Art', 'Documentary', 'Drone Photography', 'Portrait'],
  },
  {
    id: 'videography',
    name: 'Videography',
    icon: 'Video',
    subcategories: ['Cinematic Films', 'Documentary', 'Highlight Reels', 'Drone Footage', 'Live Streaming'],
  },
  {
    id: 'catering',
    name: 'Catering',
    icon: 'UtensilsCrossed',
    subcategories: ['Fine Dining', 'Farm-to-Table', 'International', 'Vegan & Plant-Based', 'BBQ & Grill', 'Desserts'],
  },
  {
    id: 'florals',
    name: 'Florals',
    icon: 'Flower2',
    subcategories: ['Luxury Florals', 'Sustainable', 'Tropical', 'Garden Style', 'Modern Minimalist', 'Dried Flowers'],
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'Music',
    subcategories: ['Live Bands', 'DJs', 'String Quartets', 'Jazz Ensembles', 'Solo Artists', 'Dance Performers'],
  },
  {
    id: 'lighting',
    name: 'Lighting & Decor',
    icon: 'Lightbulb',
    subcategories: ['Ambient Lighting', 'LED & Neon', 'Chandeliers', 'Fairy Lights', 'Projection Mapping', 'Draping'],
  },
  {
    id: 'planners',
    name: 'Planners',
    icon: 'ClipboardList',
    subcategories: ['Full Service', 'Partial Planning', 'Day-of Coordination', 'Destination Specialists', 'Luxury Events'],
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: 'Car',
    subcategories: ['Classic Cars', 'Luxury Vehicles', 'Helicopters', 'Boats & Yachts', 'Horse & Carriage', 'Party Buses'],
  },
  {
    id: 'beauty',
    name: 'Beauty & Styling',
    icon: 'Sparkles',
    subcategories: ['Hair Styling', 'Makeup Artists', 'Bridal Styling', 'On-site Spa', 'Grooming'],
  },
  {
    id: 'stationery',
    name: 'Stationery',
    icon: 'PenTool',
    subcategories: ['Luxury Invitations', 'Calligraphy', 'Digital Design', 'Signage', 'Menus & Programs'],
  },
];

// Media types that suppliers can upload
export const mediaTypes = [
  { id: 'image', name: 'Photos', description: 'High-quality images of your work', icon: 'Image' },
  { id: 'floorplan', name: 'Floor Plans', description: 'Venue layouts and space configurations', icon: 'LayoutGrid' },
  { id: 'capacity_chart', name: 'Capacity Charts', description: 'Seating and standing capacities', icon: 'Users' },
  { id: 'hotel_room', name: 'Hotel Rooms', description: 'Accommodation room photos', icon: 'Bed' },
  { id: 'video', name: 'Videos', description: 'Video tours and highlights', icon: 'Video' },
  { id: 'virtual_tour', name: 'Virtual Tours', description: '360° virtual experiences', icon: 'View' },
  { id: '360_photo', name: '360° Photos', description: 'Immersive panoramic images', icon: 'Globe' },
];

// Media categories for organization
export const mediaCategories = [
  { id: 'venue', name: 'Venue Spaces', description: 'Main venue areas and rooms' },
  { id: 'work_sample', name: 'Work Samples', description: 'Examples of your work' },
  { id: 'team', name: 'Team', description: 'Photos of your team' },
  { id: 'equipment', name: 'Equipment', description: 'Tools and equipment' },
  { id: 'accommodation', name: 'Accommodation', description: 'Guest rooms and suites' },
  { id: 'amenities', name: 'Amenities', description: 'Pools, spas, and facilities' },
  { id: 'dining', name: 'Dining', description: 'Restaurants and dining areas' },
  { id: 'outdoor', name: 'Outdoor', description: 'Gardens, terraces, and grounds' },
  { id: 'ceremony', name: 'Ceremony', description: 'Ceremony locations' },
  { id: 'reception', name: 'Reception', description: 'Reception areas' },
];
