// Event Area Types for different sub-events
export interface EventArea {
  id: string;
  name: string;
  description: string;
  icon: string;
  typicalDuration: string;
  suggestedFor: string[];
}

export const eventAreas: EventArea[] = [
  { id: 'welcome-drinks', name: 'Welcome Drinks / Arrival', description: 'Initial guest reception with beverages', icon: 'Wine', typicalDuration: '30-60 min', suggestedFor: ['wedding', 'corporate', 'gala'] },
  { id: 'ceremony', name: 'Ceremony', description: 'Main ceremony or formal proceedings', icon: 'Heart', typicalDuration: '30-90 min', suggestedFor: ['wedding', 'religious', 'graduation'] },
  { id: 'cocktail-hour', name: 'Cocktail Hour', description: 'Post-ceremony mingling with canapés', icon: 'GlassWater', typicalDuration: '60-90 min', suggestedFor: ['wedding', 'corporate', 'gala'] },
  { id: 'reception', name: 'Reception / Gala', description: 'Main dining and celebration', icon: 'UtensilsCrossed', typicalDuration: '3-5 hours', suggestedFor: ['wedding', 'corporate', 'gala', 'birthday'] },
  { id: 'afterparty', name: 'Afterparty', description: 'Late-night celebration continuation', icon: 'PartyPopper', typicalDuration: '2-4 hours', suggestedFor: ['wedding', 'birthday', 'corporate'] },
  { id: 'breakfast', name: 'Breakfast / Brunch', description: 'Morning meal service', icon: 'Coffee', typicalDuration: '1-2 hours', suggestedFor: ['wedding', 'corporate', 'retreat'] },
  { id: 'lunch', name: 'Lunch', description: 'Midday meal service', icon: 'Sandwich', typicalDuration: '1-2 hours', suggestedFor: ['corporate', 'wedding', 'retreat'] },
  { id: 'dinner', name: 'Dinner', description: 'Evening meal service', icon: 'UtensilsCrossed', typicalDuration: '2-3 hours', suggestedFor: ['wedding', 'corporate', 'gala'] },
  { id: 'conference', name: 'Conference / Meeting', description: 'Business presentations and discussions', icon: 'Presentation', typicalDuration: '2-8 hours', suggestedFor: ['corporate'] },
  { id: 'workshop', name: 'Workshop / Training', description: 'Interactive learning session', icon: 'GraduationCap', typicalDuration: '2-4 hours', suggestedFor: ['corporate', 'educational'] },
  { id: 'team-building', name: 'Team Building Activity', description: 'Group bonding exercises', icon: 'Users', typicalDuration: '2-4 hours', suggestedFor: ['corporate'] },
  { id: 'networking', name: 'Networking Session', description: 'Professional mingling opportunity', icon: 'Handshake', typicalDuration: '1-2 hours', suggestedFor: ['corporate'] },
  { id: 'photo-session', name: 'Photo Session', description: 'Dedicated photography time', icon: 'Camera', typicalDuration: '1-2 hours', suggestedFor: ['wedding', 'corporate'] },
  { id: 'entertainment', name: 'Entertainment / Show', description: 'Performance or entertainment segment', icon: 'Music', typicalDuration: '1-3 hours', suggestedFor: ['wedding', 'corporate', 'gala'] },
  { id: 'games', name: 'Games / Activities', description: 'Interactive games and activities', icon: 'Gamepad2', typicalDuration: '1-3 hours', suggestedFor: ['birthday', 'kids', 'corporate'] },
  { id: 'spa-wellness', name: 'Spa / Wellness', description: 'Relaxation and wellness activities', icon: 'Sparkles', typicalDuration: '2-4 hours', suggestedFor: ['retreat', 'bachelorette'] },
  { id: 'excursion', name: 'Excursion / Tour', description: 'Off-site activity or tour', icon: 'Map', typicalDuration: '2-6 hours', suggestedFor: ['destination', 'corporate'] },
  { id: 'religious', name: 'Religious Ceremony', description: 'Faith-based ceremony or blessing', icon: 'Church', typicalDuration: '30-90 min', suggestedFor: ['wedding', 'religious'] },
  { id: 'cultural', name: 'Cultural Ceremony', description: 'Traditional cultural proceedings', icon: 'Globe', typicalDuration: '1-3 hours', suggestedFor: ['wedding', 'cultural'] },
  { id: 'mehndi', name: 'Mehndi / Henna', description: 'Henna application ceremony', icon: 'Palette', typicalDuration: '3-5 hours', suggestedFor: ['indian-wedding'] },
  { id: 'sangeet', name: 'Sangeet / Music Night', description: 'Musical celebration and dancing', icon: 'Music2', typicalDuration: '4-6 hours', suggestedFor: ['indian-wedding'] },
  { id: 'haldi', name: 'Haldi / Turmeric Ceremony', description: 'Traditional turmeric ceremony', icon: 'Sun', typicalDuration: '2-3 hours', suggestedFor: ['indian-wedding'] },
  { id: 'rehearsal-dinner', name: 'Rehearsal Dinner', description: 'Pre-wedding dinner gathering', icon: 'Users', typicalDuration: '2-3 hours', suggestedFor: ['wedding'] },
  { id: 'farewell-brunch', name: 'Farewell Brunch', description: 'Post-event goodbye gathering', icon: 'Coffee', typicalDuration: '2-3 hours', suggestedFor: ['wedding', 'destination'] },
];

// Flower Types with Seasonal Information
export interface FlowerType {
  id: string;
  name: string;
  category: string;
  colors: string[];
  seasons: ('spring' | 'summer' | 'fall' | 'winter' | 'year-round')[];
  priceRange: 'budget' | 'moderate' | 'premium' | 'luxury';
  importRequired?: boolean;
  importRegions?: string[];
  allergyRisk: 'low' | 'medium' | 'high';
  description: string;
}

export const flowerTypes: FlowerType[] = [
  // Year-round flowers
  { id: 'roses', name: 'Roses', category: 'Classic', colors: ['red', 'white', 'pink', 'yellow', 'peach', 'burgundy', 'lavender'], seasons: ['year-round'], priceRange: 'moderate', allergyRisk: 'low', description: 'Timeless romantic classic' },
  { id: 'carnations', name: 'Carnations', category: 'Classic', colors: ['red', 'white', 'pink', 'purple', 'yellow'], seasons: ['year-round'], priceRange: 'budget', allergyRisk: 'low', description: 'Long-lasting and affordable' },
  { id: 'chrysanthemums', name: 'Chrysanthemums', category: 'Classic', colors: ['white', 'yellow', 'pink', 'red', 'purple'], seasons: ['year-round'], priceRange: 'budget', allergyRisk: 'medium', description: 'Versatile and abundant' },
  { id: 'gerbera-daisies', name: 'Gerbera Daisies', category: 'Modern', colors: ['pink', 'orange', 'yellow', 'red', 'white'], seasons: ['year-round'], priceRange: 'budget', allergyRisk: 'low', description: 'Cheerful and vibrant' },
  { id: 'orchids', name: 'Orchids', category: 'Exotic', colors: ['white', 'purple', 'pink', 'yellow', 'green'], seasons: ['year-round'], priceRange: 'premium', allergyRisk: 'low', description: 'Elegant and sophisticated' },
  { id: 'calla-lilies', name: 'Calla Lilies', category: 'Elegant', colors: ['white', 'pink', 'purple', 'yellow', 'orange'], seasons: ['year-round'], priceRange: 'moderate', allergyRisk: 'low', description: 'Sleek and modern' },
  { id: 'baby-breath', name: "Baby's Breath", category: 'Filler', colors: ['white', 'pink'], seasons: ['year-round'], priceRange: 'budget', allergyRisk: 'low', description: 'Delicate filler flower' },
  { id: 'eucalyptus', name: 'Eucalyptus', category: 'Greenery', colors: ['green', 'silver'], seasons: ['year-round'], priceRange: 'budget', allergyRisk: 'low', description: 'Aromatic greenery' },
  
  // Spring flowers
  { id: 'tulips', name: 'Tulips', category: 'Spring', colors: ['red', 'pink', 'yellow', 'white', 'purple', 'orange'], seasons: ['spring'], priceRange: 'moderate', allergyRisk: 'low', description: 'Classic spring bloom' },
  { id: 'peonies', name: 'Peonies', category: 'Romantic', colors: ['pink', 'white', 'coral', 'burgundy'], seasons: ['spring'], priceRange: 'luxury', importRequired: true, importRegions: ['Netherlands', 'New Zealand'], allergyRisk: 'low', description: 'Lush romantic favorite' },
  { id: 'ranunculus', name: 'Ranunculus', category: 'Romantic', colors: ['pink', 'white', 'yellow', 'orange', 'red'], seasons: ['spring'], priceRange: 'premium', allergyRisk: 'low', description: 'Delicate layered petals' },
  { id: 'hyacinths', name: 'Hyacinths', category: 'Fragrant', colors: ['purple', 'pink', 'white', 'blue'], seasons: ['spring'], priceRange: 'moderate', allergyRisk: 'high', description: 'Intensely fragrant' },
  { id: 'daffodils', name: 'Daffodils', category: 'Spring', colors: ['yellow', 'white', 'orange'], seasons: ['spring'], priceRange: 'budget', allergyRisk: 'medium', description: 'Cheerful spring herald' },
  { id: 'lilacs', name: 'Lilacs', category: 'Fragrant', colors: ['purple', 'white', 'pink'], seasons: ['spring'], priceRange: 'premium', allergyRisk: 'medium', description: 'Romantic and fragrant' },
  { id: 'sweet-peas', name: 'Sweet Peas', category: 'Delicate', colors: ['pink', 'purple', 'white', 'coral'], seasons: ['spring'], priceRange: 'premium', allergyRisk: 'low', description: 'Delicate and fragrant' },
  { id: 'anemones', name: 'Anemones', category: 'Modern', colors: ['white', 'red', 'purple', 'pink'], seasons: ['spring'], priceRange: 'premium', allergyRisk: 'low', description: 'Bold center contrast' },
  
  // Summer flowers
  { id: 'sunflowers', name: 'Sunflowers', category: 'Rustic', colors: ['yellow', 'orange', 'red'], seasons: ['summer'], priceRange: 'budget', allergyRisk: 'medium', description: 'Bright and cheerful' },
  { id: 'dahlias', name: 'Dahlias', category: 'Statement', colors: ['pink', 'red', 'orange', 'purple', 'white', 'yellow'], seasons: ['summer', 'fall'], priceRange: 'premium', allergyRisk: 'low', description: 'Dramatic and bold' },
  { id: 'zinnias', name: 'Zinnias', category: 'Garden', colors: ['pink', 'orange', 'red', 'yellow', 'purple'], seasons: ['summer'], priceRange: 'budget', allergyRisk: 'low', description: 'Colorful garden charm' },
  { id: 'hydrangeas', name: 'Hydrangeas', category: 'Lush', colors: ['blue', 'pink', 'white', 'purple', 'green'], seasons: ['summer'], priceRange: 'moderate', allergyRisk: 'low', description: 'Full and romantic' },
  { id: 'gardenias', name: 'Gardenias', category: 'Fragrant', colors: ['white', 'cream'], seasons: ['summer'], priceRange: 'luxury', allergyRisk: 'medium', description: 'Intensely fragrant' },
  { id: 'lisianthus', name: 'Lisianthus', category: 'Elegant', colors: ['white', 'pink', 'purple', 'cream'], seasons: ['summer'], priceRange: 'premium', allergyRisk: 'low', description: 'Rose-like elegance' },
  { id: 'delphinium', name: 'Delphinium', category: 'Tall', colors: ['blue', 'purple', 'pink', 'white'], seasons: ['summer'], priceRange: 'moderate', allergyRisk: 'low', description: 'Tall spiky blooms' },
  { id: 'lavender', name: 'Lavender', category: 'Fragrant', colors: ['purple', 'blue', 'white'], seasons: ['summer'], priceRange: 'moderate', allergyRisk: 'medium', description: 'Calming and aromatic' },
  { id: 'poppies', name: 'Poppies', category: 'Delicate', colors: ['red', 'orange', 'pink', 'white'], seasons: ['summer'], priceRange: 'moderate', allergyRisk: 'low', description: 'Delicate paper-like petals' },
  
  // Fall flowers
  { id: 'marigolds', name: 'Marigolds', category: 'Fall', colors: ['orange', 'yellow', 'red'], seasons: ['fall'], priceRange: 'budget', allergyRisk: 'medium', description: 'Warm autumn tones' },
  { id: 'asters', name: 'Asters', category: 'Fall', colors: ['purple', 'pink', 'white', 'blue'], seasons: ['fall'], priceRange: 'budget', allergyRisk: 'medium', description: 'Star-shaped fall bloom' },
  { id: 'celosia', name: 'Celosia', category: 'Textured', colors: ['red', 'orange', 'pink', 'yellow'], seasons: ['fall'], priceRange: 'moderate', allergyRisk: 'low', description: 'Unique velvet texture' },
  
  // Winter flowers
  { id: 'amaryllis', name: 'Amaryllis', category: 'Statement', colors: ['red', 'white', 'pink', 'orange'], seasons: ['winter'], priceRange: 'premium', allergyRisk: 'low', description: 'Bold winter statement' },
  { id: 'poinsettias', name: 'Poinsettias', category: 'Holiday', colors: ['red', 'white', 'pink'], seasons: ['winter'], priceRange: 'budget', allergyRisk: 'medium', description: 'Classic holiday flower' },
  { id: 'hellebores', name: 'Hellebores', category: 'Winter', colors: ['white', 'pink', 'purple', 'green'], seasons: ['winter'], priceRange: 'premium', allergyRisk: 'low', description: 'Winter rose' },
  { id: 'camellias', name: 'Camellias', category: 'Elegant', colors: ['pink', 'red', 'white'], seasons: ['winter'], priceRange: 'premium', allergyRisk: 'low', description: 'Elegant winter bloom' },
  
  // Exotic/Import flowers
  { id: 'protea', name: 'Protea', category: 'Exotic', colors: ['pink', 'white', 'red'], seasons: ['year-round'], priceRange: 'luxury', importRequired: true, importRegions: ['South Africa', 'Australia'], allergyRisk: 'low', description: 'Dramatic statement flower' },
  { id: 'king-protea', name: 'King Protea', category: 'Exotic', colors: ['pink', 'white'], seasons: ['year-round'], priceRange: 'luxury', importRequired: true, importRegions: ['South Africa'], allergyRisk: 'low', description: 'South African national flower' },
  { id: 'bird-of-paradise', name: 'Bird of Paradise', category: 'Tropical', colors: ['orange', 'blue'], seasons: ['year-round'], priceRange: 'premium', importRequired: true, importRegions: ['Hawaii', 'South Africa'], allergyRisk: 'low', description: 'Exotic tropical statement' },
  { id: 'anthuriums', name: 'Anthuriums', category: 'Tropical', colors: ['red', 'pink', 'white', 'green'], seasons: ['year-round'], priceRange: 'premium', importRequired: true, importRegions: ['Hawaii', 'Netherlands'], allergyRisk: 'low', description: 'Heart-shaped tropical' },
  { id: 'lotus', name: 'Lotus', category: 'Exotic', colors: ['pink', 'white'], seasons: ['summer'], priceRange: 'luxury', importRequired: true, importRegions: ['Asia'], allergyRisk: 'low', description: 'Sacred Asian flower' },
  { id: 'plumeria', name: 'Plumeria / Frangipani', category: 'Tropical', colors: ['white', 'yellow', 'pink'], seasons: ['summer'], priceRange: 'premium', importRequired: true, importRegions: ['Hawaii', 'Thailand'], allergyRisk: 'low', description: 'Fragrant tropical' },
];

// Dietary Requirements
export interface DietaryRequirement {
  id: string;
  name: string;
  category: 'allergy' | 'intolerance' | 'lifestyle' | 'religious' | 'medical';
  description: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  commonAllergens?: string[];
}

export const dietaryRequirements: DietaryRequirement[] = [
  // Allergies
  { id: 'peanut', name: 'Peanut Allergy', category: 'allergy', description: 'Allergic to peanuts and peanut products', severity: 'life-threatening', commonAllergens: ['peanuts', 'peanut oil', 'peanut butter'] },
  { id: 'tree-nut', name: 'Tree Nut Allergy', category: 'allergy', description: 'Allergic to tree nuts (almonds, cashews, walnuts, etc.)', severity: 'life-threatening', commonAllergens: ['almonds', 'cashews', 'walnuts', 'pecans', 'pistachios'] },
  { id: 'shellfish', name: 'Shellfish Allergy', category: 'allergy', description: 'Allergic to shellfish (shrimp, crab, lobster, etc.)', severity: 'life-threatening', commonAllergens: ['shrimp', 'crab', 'lobster', 'mussels', 'clams'] },
  { id: 'fish', name: 'Fish Allergy', category: 'allergy', description: 'Allergic to fish', severity: 'severe', commonAllergens: ['fish', 'fish sauce', 'fish oil'] },
  { id: 'egg', name: 'Egg Allergy', category: 'allergy', description: 'Allergic to eggs and egg products', severity: 'moderate', commonAllergens: ['eggs', 'mayonnaise', 'meringue'] },
  { id: 'milk', name: 'Milk/Dairy Allergy', category: 'allergy', description: 'Allergic to milk and dairy products', severity: 'moderate', commonAllergens: ['milk', 'cheese', 'butter', 'cream', 'yogurt'] },
  { id: 'wheat', name: 'Wheat Allergy', category: 'allergy', description: 'Allergic to wheat', severity: 'moderate', commonAllergens: ['wheat', 'bread', 'pasta', 'flour'] },
  { id: 'soy', name: 'Soy Allergy', category: 'allergy', description: 'Allergic to soy and soy products', severity: 'moderate', commonAllergens: ['soy', 'tofu', 'soy sauce', 'edamame'] },
  { id: 'sesame', name: 'Sesame Allergy', category: 'allergy', description: 'Allergic to sesame seeds and oil', severity: 'severe', commonAllergens: ['sesame seeds', 'sesame oil', 'tahini', 'hummus'] },
  { id: 'mustard', name: 'Mustard Allergy', category: 'allergy', description: 'Allergic to mustard', severity: 'moderate', commonAllergens: ['mustard', 'mustard seeds', 'mustard oil'] },
  { id: 'celery', name: 'Celery Allergy', category: 'allergy', description: 'Allergic to celery', severity: 'moderate', commonAllergens: ['celery', 'celeriac', 'celery salt'] },
  { id: 'lupin', name: 'Lupin Allergy', category: 'allergy', description: 'Allergic to lupin beans and flour', severity: 'moderate', commonAllergens: ['lupin flour', 'lupin seeds'] },
  { id: 'mollusc', name: 'Mollusc Allergy', category: 'allergy', description: 'Allergic to molluscs (squid, octopus, snails)', severity: 'moderate', commonAllergens: ['squid', 'octopus', 'snails', 'oysters'] },
  { id: 'sulphites', name: 'Sulphite Sensitivity', category: 'allergy', description: 'Sensitive to sulphites', severity: 'moderate', commonAllergens: ['wine', 'dried fruits', 'preserved foods'] },
  
  // Intolerances
  { id: 'lactose', name: 'Lactose Intolerance', category: 'intolerance', description: 'Cannot digest lactose in dairy products', severity: 'moderate' },
  { id: 'gluten', name: 'Gluten Intolerance', category: 'intolerance', description: 'Sensitive to gluten (non-celiac)', severity: 'moderate' },
  { id: 'celiac', name: 'Celiac Disease', category: 'intolerance', description: 'Autoimmune reaction to gluten', severity: 'severe' },
  { id: 'fructose', name: 'Fructose Intolerance', category: 'intolerance', description: 'Cannot properly digest fructose', severity: 'moderate' },
  { id: 'fodmap', name: 'Low FODMAP', category: 'intolerance', description: 'Requires low FODMAP diet for IBS', severity: 'moderate' },
  { id: 'histamine', name: 'Histamine Intolerance', category: 'intolerance', description: 'Sensitive to histamine-rich foods', severity: 'moderate' },
  
  // Lifestyle choices
  { id: 'vegetarian', name: 'Vegetarian', category: 'lifestyle', description: 'No meat or fish' },
  { id: 'vegan', name: 'Vegan', category: 'lifestyle', description: 'No animal products whatsoever' },
  { id: 'pescatarian', name: 'Pescatarian', category: 'lifestyle', description: 'Vegetarian but eats fish' },
  { id: 'flexitarian', name: 'Flexitarian', category: 'lifestyle', description: 'Primarily vegetarian, occasionally eats meat' },
  { id: 'raw-food', name: 'Raw Food', category: 'lifestyle', description: 'Only uncooked, unprocessed foods' },
  { id: 'paleo', name: 'Paleo', category: 'lifestyle', description: 'Paleolithic diet - no grains, legumes, dairy' },
  { id: 'keto', name: 'Keto/Low Carb', category: 'lifestyle', description: 'Very low carbohydrate diet' },
  { id: 'whole30', name: 'Whole30', category: 'lifestyle', description: 'No sugar, alcohol, grains, legumes, dairy' },
  { id: 'organic', name: 'Organic Only', category: 'lifestyle', description: 'Prefers organic ingredients' },
  { id: 'no-alcohol', name: 'No Alcohol', category: 'lifestyle', description: 'Does not consume alcohol' },
  
  // Religious dietary laws
  { id: 'halal', name: 'Halal', category: 'religious', description: 'Islamic dietary laws - no pork, halal meat only' },
  { id: 'kosher', name: 'Kosher', category: 'religious', description: 'Jewish dietary laws - no pork/shellfish, meat/dairy separation' },
  { id: 'hindu-vegetarian', name: 'Hindu Vegetarian', category: 'religious', description: 'No meat, fish, or eggs' },
  { id: 'jain', name: 'Jain', category: 'religious', description: 'Strict vegetarian, no root vegetables' },
  { id: 'buddhist', name: 'Buddhist Vegetarian', category: 'religious', description: 'No meat, some avoid garlic/onion' },
  { id: 'no-beef', name: 'No Beef', category: 'religious', description: 'Does not eat beef' },
  { id: 'no-pork', name: 'No Pork', category: 'religious', description: 'Does not eat pork' },
  
  // Medical
  { id: 'diabetic', name: 'Diabetic', category: 'medical', description: 'Requires low sugar, controlled carbohydrates' },
  { id: 'low-sodium', name: 'Low Sodium', category: 'medical', description: 'Requires reduced salt intake' },
  { id: 'low-fat', name: 'Low Fat', category: 'medical', description: 'Requires reduced fat intake' },
  { id: 'renal', name: 'Renal Diet', category: 'medical', description: 'Kidney-friendly diet restrictions' },
  { id: 'gerd', name: 'GERD/Acid Reflux', category: 'medical', description: 'Avoids acidic and spicy foods' },
  { id: 'soft-food', name: 'Soft Food Only', category: 'medical', description: 'Requires soft or pureed foods' },
];

// Flower Allergies
export interface FlowerAllergy {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  symptoms: string[];
  flowersToAvoid: string[];
}

export const flowerAllergies: FlowerAllergy[] = [
  { id: 'pollen-general', name: 'General Pollen Allergy', severity: 'moderate', symptoms: ['sneezing', 'runny nose', 'itchy eyes'], flowersToAvoid: ['daisies', 'sunflowers', 'chrysanthemums', 'chamomile'] },
  { id: 'lily-allergy', name: 'Lily Allergy', severity: 'moderate', symptoms: ['skin irritation', 'respiratory issues'], flowersToAvoid: ['lilies', 'stargazer lilies', 'asiatic lilies'] },
  { id: 'ragweed', name: 'Ragweed Allergy', severity: 'severe', symptoms: ['severe sneezing', 'congestion', 'asthma'], flowersToAvoid: ['sunflowers', 'daisies', 'chamomile', 'chrysanthemums'] },
  { id: 'fragrance-sensitivity', name: 'Fragrance Sensitivity', severity: 'mild', symptoms: ['headaches', 'nausea', 'respiratory irritation'], flowersToAvoid: ['gardenias', 'jasmine', 'hyacinths', 'lilies', 'tuberose'] },
  { id: 'latex-fruit', name: 'Latex-Fruit Syndrome', severity: 'moderate', symptoms: ['skin rash', 'swelling'], flowersToAvoid: ['poinsettias', 'ficus', 'rubber plants'] },
  { id: 'contact-dermatitis', name: 'Contact Dermatitis', severity: 'mild', symptoms: ['skin rash', 'itching', 'blisters'], flowersToAvoid: ['chrysanthemums', 'daisies', 'marigolds', 'sunflowers'] },
];

// Color Palette Options
export interface ColorOption {
  id: string;
  name: string;
  hex: string;
  category: string;
}

export const colorPalette: ColorOption[] = [
  // Whites & Neutrals
  { id: 'white', name: 'Pure White', hex: '#FFFFFF', category: 'Neutrals' },
  { id: 'ivory', name: 'Ivory', hex: '#FFFFF0', category: 'Neutrals' },
  { id: 'cream', name: 'Cream', hex: '#FFFDD0', category: 'Neutrals' },
  { id: 'champagne', name: 'Champagne', hex: '#F7E7CE', category: 'Neutrals' },
  { id: 'beige', name: 'Beige', hex: '#F5F5DC', category: 'Neutrals' },
  { id: 'taupe', name: 'Taupe', hex: '#483C32', category: 'Neutrals' },
  { id: 'charcoal', name: 'Charcoal', hex: '#36454F', category: 'Neutrals' },
  { id: 'black', name: 'Black', hex: '#000000', category: 'Neutrals' },
  
  // Pinks
  { id: 'blush', name: 'Blush Pink', hex: '#FFB6C1', category: 'Pinks' },
  { id: 'dusty-rose', name: 'Dusty Rose', hex: '#DCAE96', category: 'Pinks' },
  { id: 'rose-gold', name: 'Rose Gold', hex: '#B76E79', category: 'Pinks' },
  { id: 'coral', name: 'Coral', hex: '#FF7F50', category: 'Pinks' },
  { id: 'salmon', name: 'Salmon', hex: '#FA8072', category: 'Pinks' },
  { id: 'hot-pink', name: 'Hot Pink', hex: '#FF69B4', category: 'Pinks' },
  { id: 'fuchsia', name: 'Fuchsia', hex: '#FF00FF', category: 'Pinks' },
  { id: 'magenta', name: 'Magenta', hex: '#FF0090', category: 'Pinks' },
  { id: 'mauve', name: 'Mauve', hex: '#E0B0FF', category: 'Pinks' },
  
  // Reds
  { id: 'red', name: 'Classic Red', hex: '#FF0000', category: 'Reds' },
  { id: 'burgundy', name: 'Burgundy', hex: '#800020', category: 'Reds' },
  { id: 'wine', name: 'Wine', hex: '#722F37', category: 'Reds' },
  { id: 'maroon', name: 'Maroon', hex: '#800000', category: 'Reds' },
  { id: 'crimson', name: 'Crimson', hex: '#DC143C', category: 'Reds' },
  { id: 'scarlet', name: 'Scarlet', hex: '#FF2400', category: 'Reds' },
  { id: 'terracotta', name: 'Terracotta', hex: '#E2725B', category: 'Reds' },
  { id: 'rust', name: 'Rust', hex: '#B7410E', category: 'Reds' },
  
  // Oranges
  { id: 'orange', name: 'Orange', hex: '#FFA500', category: 'Oranges' },
  { id: 'peach', name: 'Peach', hex: '#FFCBA4', category: 'Oranges' },
  { id: 'apricot', name: 'Apricot', hex: '#FBCEB1', category: 'Oranges' },
  { id: 'tangerine', name: 'Tangerine', hex: '#FF9966', category: 'Oranges' },
  { id: 'burnt-orange', name: 'Burnt Orange', hex: '#CC5500', category: 'Oranges' },
  { id: 'copper', name: 'Copper', hex: '#B87333', category: 'Oranges' },
  
  // Yellows
  { id: 'yellow', name: 'Yellow', hex: '#FFFF00', category: 'Yellows' },
  { id: 'gold', name: 'Gold', hex: '#FFD700', category: 'Yellows' },
  { id: 'mustard', name: 'Mustard', hex: '#FFDB58', category: 'Yellows' },
  { id: 'lemon', name: 'Lemon', hex: '#FFF44F', category: 'Yellows' },
  { id: 'buttercup', name: 'Buttercup', hex: '#F9E915', category: 'Yellows' },
  { id: 'sunflower', name: 'Sunflower', hex: '#FFDA03', category: 'Yellows' },
  
  // Greens
  { id: 'sage', name: 'Sage', hex: '#9DC183', category: 'Greens' },
  { id: 'eucalyptus', name: 'Eucalyptus', hex: '#5F8575', category: 'Greens' },
  { id: 'olive', name: 'Olive', hex: '#808000', category: 'Greens' },
  { id: 'forest', name: 'Forest Green', hex: '#228B22', category: 'Greens' },
  { id: 'emerald', name: 'Emerald', hex: '#50C878', category: 'Greens' },
  { id: 'mint', name: 'Mint', hex: '#98FF98', category: 'Greens' },
  { id: 'seafoam', name: 'Seafoam', hex: '#93E9BE', category: 'Greens' },
  { id: 'hunter', name: 'Hunter Green', hex: '#355E3B', category: 'Greens' },
  
  // Blues
  { id: 'navy', name: 'Navy', hex: '#000080', category: 'Blues' },
  { id: 'royal-blue', name: 'Royal Blue', hex: '#4169E1', category: 'Blues' },
  { id: 'sky-blue', name: 'Sky Blue', hex: '#87CEEB', category: 'Blues' },
  { id: 'baby-blue', name: 'Baby Blue', hex: '#89CFF0', category: 'Blues' },
  { id: 'powder-blue', name: 'Powder Blue', hex: '#B0E0E6', category: 'Blues' },
  { id: 'teal', name: 'Teal', hex: '#008080', category: 'Blues' },
  { id: 'turquoise', name: 'Turquoise', hex: '#40E0D0', category: 'Blues' },
  { id: 'cobalt', name: 'Cobalt', hex: '#0047AB', category: 'Blues' },
  { id: 'slate', name: 'Slate Blue', hex: '#6A5ACD', category: 'Blues' },
  
  // Purples
  { id: 'lavender', name: 'Lavender', hex: '#E6E6FA', category: 'Purples' },
  { id: 'lilac', name: 'Lilac', hex: '#C8A2C8', category: 'Purples' },
  { id: 'violet', name: 'Violet', hex: '#EE82EE', category: 'Purples' },
  { id: 'purple', name: 'Purple', hex: '#800080', category: 'Purples' },
  { id: 'plum', name: 'Plum', hex: '#DDA0DD', category: 'Purples' },
  { id: 'eggplant', name: 'Eggplant', hex: '#614051', category: 'Purples' },
  { id: 'amethyst', name: 'Amethyst', hex: '#9966CC', category: 'Purples' },
  { id: 'orchid', name: 'Orchid', hex: '#DA70D6', category: 'Purples' },
  
  // Metallics
  { id: 'silver', name: 'Silver', hex: '#C0C0C0', category: 'Metallics' },
  { id: 'gold-metallic', name: 'Gold Metallic', hex: '#D4AF37', category: 'Metallics' },
  { id: 'bronze', name: 'Bronze', hex: '#CD7F32', category: 'Metallics' },
  { id: 'rose-gold-metallic', name: 'Rose Gold Metallic', hex: '#B76E79', category: 'Metallics' },
  { id: 'copper-metallic', name: 'Copper Metallic', hex: '#B87333', category: 'Metallics' },
];

// Service Provider Categories with specific options
export interface ServiceProviderOptions {
  id: string;
  name: string;
  icon: string;
  hasLookbook: boolean;
  hasAllergies: boolean;
  hasDietary: boolean;
  specificOptions: {
    id: string;
    name: string;
    type: 'select' | 'multiselect' | 'text' | 'textarea' | 'number';
    options?: string[];
    placeholder?: string;
  }[];
}

export const serviceProviderOptions: ServiceProviderOptions[] = [
  {
    id: 'venues',
    name: 'Venues',
    icon: 'Building2',
    hasLookbook: true,
    hasAllergies: false,
    hasDietary: false,
    specificOptions: [
      { id: 'venue-style', name: 'Venue Style', type: 'multiselect', options: ['Indoor', 'Outdoor', 'Garden', 'Beach', 'Rooftop', 'Ballroom', 'Barn/Rustic', 'Historic', 'Modern', 'Industrial', 'Vineyard', 'Waterfront', 'Mountain', 'Desert', 'Tropical'] },
      { id: 'venue-capacity', name: 'Required Capacity', type: 'number', placeholder: 'Number of guests' },
      { id: 'venue-amenities', name: 'Required Amenities', type: 'multiselect', options: ['Parking', 'Catering Kitchen', 'Bridal Suite', 'AV Equipment', 'Dance Floor', 'Outdoor Space', 'Accommodation', 'Wheelchair Access', 'Pet Friendly'] },
      { id: 'venue-notes', name: 'Special Requirements', type: 'textarea', placeholder: 'Any specific venue requirements...' },
    ],
  },
  {
    id: 'catering',
    name: 'Catering',
    icon: 'UtensilsCrossed',
    hasLookbook: true,
    hasAllergies: true,
    hasDietary: true,
    specificOptions: [
      { id: 'service-style', name: 'Service Style', type: 'multiselect', options: ['Plated', 'Buffet', 'Family Style', 'Food Stations', 'Cocktail/Canapés', 'BBQ', 'Food Trucks', 'Chef\'s Table'] },
      { id: 'cuisine-type', name: 'Cuisine Preferences', type: 'multiselect', options: ['Continental', 'Mediterranean', 'Asian Fusion', 'Indian', 'Italian', 'French', 'Mexican', 'Middle Eastern', 'African', 'American', 'Seafood', 'Farm-to-Table', 'International'] },
      { id: 'meal-courses', name: 'Courses Required', type: 'multiselect', options: ['Canapés', 'Starter', 'Soup', 'Salad', 'Main Course', 'Dessert', 'Cheese Course', 'Coffee & Petit Fours'] },
      { id: 'bar-service', name: 'Bar Service', type: 'multiselect', options: ['Open Bar', 'Cash Bar', 'Limited Bar', 'Wine Only', 'Beer & Wine', 'Signature Cocktails', 'Mocktails', 'No Alcohol'] },
      { id: 'catering-notes', name: 'Menu Notes', type: 'textarea', placeholder: 'Any specific menu requests or restrictions...' },
    ],
  },
  {
    id: 'florals',
    name: 'Florals & Decor',
    icon: 'Flower2',
    hasLookbook: true,
    hasAllergies: true,
    hasDietary: false,
    specificOptions: [
      { id: 'floral-style', name: 'Floral Style', type: 'multiselect', options: ['Romantic', 'Modern/Minimalist', 'Bohemian', 'Classic/Traditional', 'Rustic', 'Tropical', 'Garden', 'Wild/Organic', 'Luxurious', 'Vintage'] },
      { id: 'floral-items', name: 'Items Required', type: 'multiselect', options: ['Bridal Bouquet', 'Bridesmaid Bouquets', 'Boutonnieres', 'Corsages', 'Ceremony Arch', 'Aisle Decor', 'Centerpieces', 'Head Table Arrangement', 'Cake Flowers', 'Venue Entrance', 'Hanging Installations', 'Flower Wall'] },
      { id: 'flower-preferences', name: 'Flower Preferences', type: 'multiselect', options: flowerTypes.map(f => f.name) },
      { id: 'floral-notes', name: 'Floral Notes', type: 'textarea', placeholder: 'Any specific floral requests, colors, or flowers to avoid...' },
    ],
  },
  {
    id: 'photography',
    name: 'Photography',
    icon: 'Camera',
    hasLookbook: true,
    hasAllergies: false,
    hasDietary: false,
    specificOptions: [
      { id: 'photo-style', name: 'Photography Style', type: 'multiselect', options: ['Documentary/Photojournalistic', 'Traditional/Classic', 'Fine Art', 'Editorial/Fashion', 'Moody/Dark', 'Light & Airy', 'Bold & Colorful', 'Black & White', 'Film'] },
      { id: 'coverage-hours', name: 'Hours of Coverage', type: 'select', options: ['4 hours', '6 hours', '8 hours', '10 hours', '12+ hours', 'Multi-day'] },
      { id: 'photo-deliverables', name: 'Deliverables Required', type: 'multiselect', options: ['Digital Files', 'Online Gallery', 'Prints', 'Album', 'Engagement Session', 'Second Photographer', 'Photo Booth', 'Same-Day Edit'] },
      { id: 'photo-notes', name: 'Photography Notes', type: 'textarea', placeholder: 'Any specific shots or moments you want captured...' },
    ],
  },
  {
    id: 'videography',
    name: 'Videography',
    icon: 'Video',
    hasLookbook: true,
    hasAllergies: false,
    hasDietary: false,
    specificOptions: [
      { id: 'video-style', name: 'Video Style', type: 'multiselect', options: ['Cinematic', 'Documentary', 'Traditional', 'Storytelling', 'Music Video', 'Drone Footage', 'Same-Day Edit'] },
      { id: 'video-coverage', name: 'Coverage Hours', type: 'select', options: ['4 hours', '6 hours', '8 hours', '10 hours', '12+ hours', 'Multi-day'] },
      { id: 'video-deliverables', name: 'Deliverables', type: 'multiselect', options: ['Highlight Film', 'Full Ceremony', 'Full Reception', 'Raw Footage', 'Social Media Clips', 'Drone Footage', 'Live Streaming'] },
      { id: 'video-notes', name: 'Video Notes', type: 'textarea', placeholder: 'Any specific moments or style preferences...' },
    ],
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'Music',
    hasLookbook: true,
    hasAllergies: false,
    hasDietary: false,
    specificOptions: [
      { id: 'entertainment-type', name: 'Entertainment Type', type: 'multiselect', options: ['DJ', 'Live Band', 'String Quartet', 'Solo Musician', 'Acoustic', 'Jazz Band', 'Orchestra', 'Cultural Performers', 'Dancers', 'Magician', 'Photo Booth', 'Fireworks'] },
      { id: 'music-genre', name: 'Music Preferences', type: 'multiselect', options: ['Pop', 'Rock', 'R&B/Soul', 'Jazz', 'Classical', 'Country', 'Latin', 'EDM/Electronic', 'Bollywood', 'African', 'Reggae', 'Hip Hop', 'Oldies', 'Mixed'] },
      { id: 'entertainment-hours', name: 'Hours Required', type: 'select', options: ['2 hours', '3 hours', '4 hours', '5 hours', '6+ hours'] },
      { id: 'entertainment-notes', name: 'Entertainment Notes', type: 'textarea', placeholder: 'Any specific songs, performances, or requirements...' },
    ],
  },
  {
    id: 'cake',
    name: 'Cake & Desserts',
    icon: 'Cake',
    hasLookbook: true,
    hasAllergies: true,
    hasDietary: true,
    specificOptions: [
      { id: 'cake-style', name: 'Cake Style', type: 'multiselect', options: ['Traditional Tiered', 'Modern/Minimalist', 'Naked/Semi-Naked', 'Buttercream', 'Fondant', 'Floral', 'Geometric', 'Rustic', 'Elegant', 'Whimsical'] },
      { id: 'cake-flavors', name: 'Flavor Preferences', type: 'multiselect', options: ['Vanilla', 'Chocolate', 'Red Velvet', 'Lemon', 'Carrot', 'Marble', 'Fruit', 'Coffee', 'Champagne', 'Custom'] },
      { id: 'cake-servings', name: 'Servings Needed', type: 'number', placeholder: 'Number of servings' },
      { id: 'dessert-extras', name: 'Additional Desserts', type: 'multiselect', options: ['Cupcakes', 'Macarons', 'Dessert Table', 'Donuts', 'Cookies', 'Cheesecake', 'Ice Cream', 'Chocolate Fountain', 'Candy Bar'] },
      { id: 'cake-notes', name: 'Cake Notes', type: 'textarea', placeholder: 'Any specific design requests or dietary needs...' },
    ],
  },
  {
    id: 'lighting',
    name: 'Lighting & AV',
    icon: 'Lightbulb',
    hasLookbook: true,
    hasAllergies: false,
    hasDietary: false,
    specificOptions: [
      { id: 'lighting-type', name: 'Lighting Type', type: 'multiselect', options: ['Uplighting', 'String Lights', 'Chandeliers', 'Spotlights', 'Dance Floor Lighting', 'Gobo/Monogram', 'Candles', 'Lanterns', 'Neon Signs', 'LED Walls'] },
      { id: 'av-equipment', name: 'AV Equipment', type: 'multiselect', options: ['Sound System', 'Microphones', 'Projector', 'Screens', 'Stage', 'Podium', 'Live Streaming Setup'] },
      { id: 'lighting-mood', name: 'Desired Mood', type: 'multiselect', options: ['Romantic', 'Dramatic', 'Elegant', 'Fun/Party', 'Intimate', 'Grand', 'Rustic/Warm', 'Modern/Cool'] },
      { id: 'lighting-notes', name: 'Lighting Notes', type: 'textarea', placeholder: 'Any specific lighting requirements or effects...' },
    ],
  },
  {
    id: 'transport',
    name: 'Transportation',
    icon: 'Car',
    hasLookbook: true,
    hasAllergies: false,
    hasDietary: false,
    specificOptions: [
      { id: 'vehicle-type', name: 'Vehicle Type', type: 'multiselect', options: ['Classic Car', 'Luxury Sedan', 'Limousine', 'Vintage Car', 'Sports Car', 'Horse & Carriage', 'Party Bus', 'Shuttle Bus', 'Helicopter', 'Boat/Yacht'] },
      { id: 'transport-for', name: 'Transportation For', type: 'multiselect', options: ['Couple', 'Bridal Party', 'Family', 'Guests', 'Vendors'] },
      { id: 'transport-routes', name: 'Routes Needed', type: 'multiselect', options: ['To Ceremony', 'Ceremony to Reception', 'Reception to Hotel', 'Airport Transfers', 'Guest Shuttles'] },
      { id: 'transport-notes', name: 'Transport Notes', type: 'textarea', placeholder: 'Any specific vehicle preferences or routes...' },
    ],
  },
  {
    id: 'planners',
    name: 'Event Planners',
    icon: 'ClipboardList',
    hasLookbook: true,
    hasAllergies: false,
    hasDietary: false,
    specificOptions: [
      { id: 'planning-level', name: 'Planning Level', type: 'select', options: ['Full Planning', 'Partial Planning', 'Day-of Coordination', 'Month-of Coordination', 'Destination Planning'] },
      { id: 'planner-services', name: 'Services Required', type: 'multiselect', options: ['Vendor Management', 'Budget Management', 'Timeline Creation', 'Design & Styling', 'Guest Management', 'RSVP Tracking', 'Rehearsal Coordination', 'On-site Management'] },
      { id: 'planner-notes', name: 'Planning Notes', type: 'textarea', placeholder: 'Any specific planning needs or preferences...' },
    ],
  },
  {
    id: 'hair-makeup',
    name: 'Hair & Makeup',
    icon: 'Sparkles',
    hasLookbook: true,
    hasAllergies: true,
    hasDietary: false,
    specificOptions: [
      { id: 'beauty-style', name: 'Style Preference', type: 'multiselect', options: ['Natural/Soft', 'Glamorous', 'Vintage', 'Bohemian', 'Classic/Timeless', 'Bold/Dramatic', 'Romantic', 'Modern/Edgy'] },
      { id: 'beauty-services', name: 'Services Needed', type: 'multiselect', options: ['Bridal Hair', 'Bridal Makeup', 'Bridal Party Hair', 'Bridal Party Makeup', 'Mother of Bride/Groom', 'Trial Session', 'Touch-ups', 'Groom Grooming'] },
      { id: 'skin-concerns', name: 'Skin Concerns', type: 'multiselect', options: ['Sensitive Skin', 'Oily Skin', 'Dry Skin', 'Acne-Prone', 'Rosacea', 'Allergies to Products'] },
      { id: 'beauty-notes', name: 'Beauty Notes', type: 'textarea', placeholder: 'Any specific looks or product preferences...' },
    ],
  },
  {
    id: 'stationery',
    name: 'Stationery & Signage',
    icon: 'FileText',
    hasLookbook: true,
    hasAllergies: false,
    hasDietary: false,
    specificOptions: [
      { id: 'stationery-items', name: 'Items Needed', type: 'multiselect', options: ['Save the Dates', 'Invitations', 'RSVP Cards', 'Programs', 'Menus', 'Place Cards', 'Table Numbers', 'Welcome Signs', 'Seating Chart', 'Thank You Cards'] },
      { id: 'stationery-style', name: 'Style', type: 'multiselect', options: ['Classic/Traditional', 'Modern/Minimalist', 'Rustic', 'Bohemian', 'Elegant/Luxe', 'Whimsical', 'Vintage', 'Tropical'] },
      { id: 'printing-method', name: 'Printing Method', type: 'multiselect', options: ['Digital', 'Letterpress', 'Foil Stamping', 'Engraving', 'Thermography', 'Calligraphy', 'Laser Cut'] },
      { id: 'stationery-notes', name: 'Stationery Notes', type: 'textarea', placeholder: 'Any specific design elements or wording...' },
    ],
  },
  {
    id: 'rentals',
    name: 'Rentals & Decor',
    icon: 'Armchair',
    hasLookbook: true,
    hasAllergies: false,
    hasDietary: false,
    specificOptions: [
      { id: 'rental-items', name: 'Items Needed', type: 'multiselect', options: ['Tables', 'Chairs', 'Linens', 'Tableware', 'Glassware', 'Flatware', 'Lounge Furniture', 'Tents/Marquees', 'Dance Floor', 'Arches/Backdrops', 'Draping', 'Bars'] },
      { id: 'rental-style', name: 'Style Preference', type: 'multiselect', options: ['Classic', 'Modern', 'Rustic', 'Bohemian', 'Industrial', 'Vintage', 'Luxurious', 'Minimalist'] },
      { id: 'rental-notes', name: 'Rental Notes', type: 'textarea', placeholder: 'Any specific items or quantities needed...' },
    ],
  },
  {
    id: 'officiant',
    name: 'Officiant',
    icon: 'Heart',
    hasLookbook: false,
    hasAllergies: false,
    hasDietary: false,
    specificOptions: [
      { id: 'ceremony-type', name: 'Ceremony Type', type: 'select', options: ['Religious', 'Non-Religious', 'Spiritual', 'Civil', 'Interfaith', 'Cultural', 'Elopement'] },
      { id: 'ceremony-style', name: 'Ceremony Style', type: 'multiselect', options: ['Traditional', 'Modern', 'Personalized', 'Formal', 'Casual', 'Humorous', 'Emotional'] },
      { id: 'ceremony-elements', name: 'Ceremony Elements', type: 'multiselect', options: ['Vows', 'Readings', 'Unity Ceremony', 'Ring Exchange', 'Cultural Rituals', 'Music', 'Prayers'] },
      { id: 'officiant-notes', name: 'Ceremony Notes', type: 'textarea', placeholder: 'Any specific ceremony requirements or preferences...' },
    ],
  },
];

// Helper function to get season for a date
export const getSeasonForDate = (date: Date, hemisphere: 'northern' | 'southern' = 'northern'): string => {
  const month = date.getMonth();
  
  if (hemisphere === 'northern') {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  } else {
    if (month >= 2 && month <= 4) return 'fall';
    if (month >= 5 && month <= 7) return 'winter';
    if (month >= 8 && month <= 10) return 'spring';
    return 'summer';
  }
};

// Helper function to check if flower is in season
export const isFlowerInSeason = (flower: FlowerType, date: Date, hemisphere: 'northern' | 'southern' = 'northern'): boolean => {
  if (flower.seasons.includes('year-round')) return true;
  const season = getSeasonForDate(date, hemisphere);
  return flower.seasons.includes(season as any);
};

// Helper function to get flowers by season


export const getFlowersBySeason = (season: string): FlowerType[] => {
  return flowerTypes.filter(f => f.seasons.includes(season as any) || f.seasons.includes('year-round'));
};

// Helper function to get dietary requirements by category
export const getDietaryByCategory = (category: string): DietaryRequirement[] => {
  return dietaryRequirements.filter(d => d.category === category);
};

// Alias exports for compatibility
export const eventAreaTypes = eventAreas;
export const colorPalettes = colorPalette;
export const serviceProviderCategories = serviceProviderOptions.map(sp => ({
  id: sp.id,
  name: sp.name,
  icon: sp.icon,
  options: sp.specificOptions.flatMap(opt => opt.options || []).slice(0, 20)
}));
