import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin, Globe, Search } from 'lucide-react';

interface Territory {
  name: string;
  cities?: string[];
  countries?: { name: string; cities: string[] }[];
}

const territories: Territory[] = [
  {
    name: 'South Africa',
    cities: [
      'Cape Town',
      'Johannesburg',
      'Durban',
      'Pretoria',
      'Port Elizabeth',
      'Bloemfontein',
      'Stellenbosch',
      'Franschhoek',
      'Knysna',
      'Hermanus',
      'Plettenberg Bay',
      'Umhlanga',
      'Sandton',
      'Constantia',
    ],
  },
  {
    name: 'Europe',
    countries: [
      { name: 'France', cities: ['Paris', 'Nice', 'Cannes', 'Monaco', 'Saint-Tropez', 'Bordeaux', 'Lyon', 'Provence'] },
      { name: 'Italy', cities: ['Rome', 'Milan', 'Florence', 'Venice', 'Amalfi Coast', 'Lake Como', 'Tuscany', 'Capri', 'Sardinia', 'Sicily'] },
      { name: 'Spain', cities: ['Barcelona', 'Madrid', 'Ibiza', 'Mallorca', 'Marbella', 'Seville', 'Valencia', 'San Sebastián'] },
      { name: 'United Kingdom', cities: ['London', 'Edinburgh', 'Manchester', 'Oxford', 'Cambridge', 'Bath', 'Cotswolds', 'Scottish Highlands'] },
      { name: 'Greece', cities: ['Athens', 'Santorini', 'Mykonos', 'Crete', 'Rhodes', 'Corfu', 'Zakynthos', 'Paros'] },
      { name: 'Portugal', cities: ['Lisbon', 'Porto', 'Algarve', 'Madeira', 'Sintra', 'Cascais', 'Azores'] },
      { name: 'Germany', cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Düsseldorf', 'Cologne', 'Bavaria'] },
      { name: 'Switzerland', cities: ['Zurich', 'Geneva', 'Lucerne', 'Zermatt', 'St. Moritz', 'Interlaken', 'Basel'] },
      { name: 'Austria', cities: ['Vienna', 'Salzburg', 'Innsbruck', 'Hallstatt'] },
      { name: 'Netherlands', cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht'] },
      { name: 'Belgium', cities: ['Brussels', 'Bruges', 'Antwerp', 'Ghent'] },
      { name: 'Croatia', cities: ['Dubrovnik', 'Split', 'Hvar', 'Zagreb', 'Plitvice'] },
      { name: 'Czech Republic', cities: ['Prague', 'Český Krumlov', 'Brno'] },
      { name: 'Ireland', cities: ['Dublin', 'Cork', 'Galway', 'Killarney'] },
      { name: 'Sweden', cities: ['Stockholm', 'Gothenburg', 'Malmö'] },
      { name: 'Norway', cities: ['Oslo', 'Bergen', 'Tromsø', 'Fjords'] },
      { name: 'Denmark', cities: ['Copenhagen', 'Aarhus'] },
      { name: 'Finland', cities: ['Helsinki', 'Lapland', 'Turku'] },
      { name: 'Iceland', cities: ['Reykjavik', 'Blue Lagoon', 'Golden Circle'] },
      { name: 'Malta', cities: ['Valletta', 'Mdina', 'Gozo'] },
      { name: 'Cyprus', cities: ['Paphos', 'Limassol', 'Nicosia', 'Ayia Napa'] },
    ],
  },
  {
    name: 'Asia',
    countries: [
      { name: 'Thailand', cities: ['Bangkok', 'Phuket', 'Koh Samui', 'Chiang Mai', 'Krabi', 'Hua Hin'] },
      { name: 'Japan', cities: ['Tokyo', 'Kyoto', 'Osaka', 'Okinawa', 'Hokkaido', 'Nara'] },
      { name: 'Indonesia', cities: ['Bali', 'Jakarta', 'Lombok', 'Komodo', 'Yogyakarta'] },
      { name: 'Vietnam', cities: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hoi An', 'Phu Quoc'] },
      { name: 'Singapore', cities: ['Singapore City', 'Sentosa'] },
      { name: 'Malaysia', cities: ['Kuala Lumpur', 'Langkawi', 'Penang', 'Borneo'] },
      { name: 'Philippines', cities: ['Manila', 'Boracay', 'Palawan', 'Cebu', 'Siargao'] },
      { name: 'India', cities: ['Mumbai', 'Delhi', 'Goa', 'Jaipur', 'Udaipur', 'Kerala', 'Agra'] },
      { name: 'Sri Lanka', cities: ['Colombo', 'Kandy', 'Galle', 'Ella', 'Sigiriya'] },
      { name: 'China', cities: ['Shanghai', 'Beijing', 'Hong Kong', 'Shenzhen', 'Hangzhou'] },
      { name: 'South Korea', cities: ['Seoul', 'Busan', 'Jeju Island'] },
      { name: 'UAE', cities: ['Dubai', 'Abu Dhabi', 'Ras Al Khaimah'] },
      { name: 'Maldives', cities: ['Malé', 'Baa Atoll', 'Ari Atoll', 'North Malé Atoll'] },
    ],
  },
  {
    name: 'Pacific & Oceania',
    countries: [
      { name: 'Australia', cities: ['Sydney', 'Melbourne', 'Gold Coast', 'Brisbane', 'Perth', 'Byron Bay', 'Great Barrier Reef', 'Hunter Valley', 'Whitsundays'] },
      { name: 'New Zealand', cities: ['Auckland', 'Queenstown', 'Wellington', 'Rotorua', 'Christchurch', 'Bay of Islands'] },
      { name: 'Fiji', cities: ['Nadi', 'Denarau Island', 'Mamanuca Islands', 'Yasawa Islands'] },
      { name: 'French Polynesia', cities: ['Tahiti', 'Bora Bora', 'Moorea', 'Rangiroa'] },
      { name: 'Hawaii', cities: ['Honolulu', 'Maui', 'Kauai', 'Big Island', 'Oahu'] },
      { name: 'Cook Islands', cities: ['Rarotonga', 'Aitutaki'] },
      { name: 'Samoa', cities: ['Apia', 'Upolu', 'Savai\'i'] },
      { name: 'Vanuatu', cities: ['Port Vila', 'Espiritu Santo'] },
    ],
  },
  {
    name: 'North America',
    countries: [
      { name: 'United States', cities: ['New York', 'Los Angeles', 'Miami', 'Las Vegas', 'San Francisco', 'Chicago', 'Boston', 'Seattle', 'San Diego', 'Napa Valley', 'Aspen', 'Palm Beach', 'The Hamptons', 'Santa Barbara', 'Scottsdale', 'Charleston', 'Savannah', 'Nashville', 'Austin', 'New Orleans'] },
      { name: 'Canada', cities: ['Toronto', 'Vancouver', 'Montreal', 'Whistler', 'Banff', 'Quebec City', 'Victoria', 'Calgary', 'Niagara Falls'] },
      { name: 'Mexico', cities: ['Cancun', 'Los Cabos', 'Mexico City', 'Tulum', 'Puerto Vallarta', 'Riviera Maya', 'Playa del Carmen', 'San Miguel de Allende'] },
    ],
  },
  {
    name: 'Caribbean & Islands',
    countries: [
      { name: 'Bahamas', cities: ['Nassau', 'Paradise Island', 'Exumas', 'Harbour Island'] },
      { name: 'Jamaica', cities: ['Montego Bay', 'Negril', 'Ocho Rios', 'Kingston'] },
      { name: 'Dominican Republic', cities: ['Punta Cana', 'Santo Domingo', 'La Romana'] },
      { name: 'St. Lucia', cities: ['Soufrière', 'Castries', 'Rodney Bay'] },
      { name: 'Barbados', cities: ['Bridgetown', 'Holetown', 'Speightstown'] },
      { name: 'Turks & Caicos', cities: ['Providenciales', 'Grace Bay'] },
      { name: 'Cayman Islands', cities: ['Grand Cayman', 'Seven Mile Beach'] },
      { name: 'Aruba', cities: ['Oranjestad', 'Palm Beach', 'Eagle Beach'] },
      { name: 'St. Barts', cities: ['Gustavia', 'St. Jean'] },
      { name: 'Antigua', cities: ['St. John\'s', 'English Harbour'] },
      { name: 'British Virgin Islands', cities: ['Tortola', 'Virgin Gorda', 'Jost Van Dyke'] },
      { name: 'US Virgin Islands', cities: ['St. Thomas', 'St. John', 'St. Croix'] },
      { name: 'Puerto Rico', cities: ['San Juan', 'Vieques', 'Culebra'] },
    ],
  },
  {
    name: 'South America',
    countries: [
      { name: 'Brazil', cities: ['Rio de Janeiro', 'São Paulo', 'Florianópolis', 'Salvador', 'Fernando de Noronha', 'Búzios'] },
      { name: 'Argentina', cities: ['Buenos Aires', 'Mendoza', 'Bariloche', 'Patagonia', 'Iguazu Falls'] },
      { name: 'Colombia', cities: ['Cartagena', 'Bogotá', 'Medellín', 'Santa Marta'] },
      { name: 'Peru', cities: ['Lima', 'Cusco', 'Machu Picchu', 'Sacred Valley'] },
      { name: 'Chile', cities: ['Santiago', 'Valparaíso', 'Atacama', 'Patagonia', 'Easter Island'] },
      { name: 'Ecuador', cities: ['Quito', 'Galápagos Islands', 'Guayaquil'] },
      { name: 'Uruguay', cities: ['Montevideo', 'Punta del Este', 'Colonia'] },
    ],
  },
  {
    name: 'Africa & Indian Ocean',
    countries: [
      { name: 'Morocco', cities: ['Marrakech', 'Casablanca', 'Fes', 'Tangier', 'Essaouira'] },
      { name: 'Kenya', cities: ['Nairobi', 'Masai Mara', 'Mombasa', 'Diani Beach', 'Lamu'] },
      { name: 'Tanzania', cities: ['Zanzibar', 'Serengeti', 'Arusha', 'Ngorongoro'] },
      { name: 'Mauritius', cities: ['Port Louis', 'Grand Baie', 'Flic en Flac', 'Le Morne'] },
      { name: 'Seychelles', cities: ['Mahé', 'Praslin', 'La Digue', 'Silhouette Island'] },
      { name: 'Egypt', cities: ['Cairo', 'Luxor', 'Sharm El Sheikh', 'Hurghada', 'Alexandria'] },
      { name: 'Botswana', cities: ['Okavango Delta', 'Chobe', 'Maun'] },
      { name: 'Namibia', cities: ['Windhoek', 'Sossusvlei', 'Etosha', 'Swakopmund'] },
      { name: 'Rwanda', cities: ['Kigali', 'Volcanoes National Park'] },
      { name: 'Madagascar', cities: ['Antananarivo', 'Nosy Be', 'Andasibe'] },
    ],
  },
];

interface TerritorySelectorProps {
  onSelect?: (location: string) => void;
}

const TerritorySelector: React.FC<TerritorySelectorProps> = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [expandedTerritory, setExpandedTerritory] = useState<string | null>(null);
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    setIsOpen(false);
    onSelect?.(location);
  };

  const filterLocations = (query: string) => {
    if (!query) return territories;
    
    const lowerQuery = query.toLowerCase();
    return territories.map(territory => {
      if (territory.cities) {
        const filteredCities = territory.cities.filter(city => 
          city.toLowerCase().includes(lowerQuery)
        );
        if (filteredCities.length > 0 || territory.name.toLowerCase().includes(lowerQuery)) {
          return { ...territory, cities: filteredCities.length > 0 ? filteredCities : territory.cities };
        }
      }
      if (territory.countries) {
        const filteredCountries = territory.countries
          .map(country => ({
            ...country,
            cities: country.cities.filter(city => city.toLowerCase().includes(lowerQuery))
          }))
          .filter(country => 
            country.name.toLowerCase().includes(lowerQuery) || 
            country.cities.length > 0
          );
        if (filteredCountries.length > 0 || territory.name.toLowerCase().includes(lowerQuery)) {
          return { ...territory, countries: filteredCountries };
        }
      }
      return null;
    }).filter(Boolean) as Territory[];
  };

  const filteredTerritories = filterLocations(searchQuery);

  return (
    <div ref={dropdownRef} className="relative w-full max-w-lg mx-auto">
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-4 px-8 py-5 rounded-xl bg-white/[0.05] border border-white/[0.15] hover:border-gold/40 transition-all duration-500 group"
      >
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center border border-gold/25">
            <MapPin className="w-5 h-5 text-gold" />
          </div>
          <div className="text-left">
            <p 
              className="text-xs uppercase tracking-[0.15em] mb-1" 
              style={{ 
                color: '#FFFFFF',
                fontFamily: '"Inter", sans-serif',
                opacity: 0.6,
              }}
            >
              Event Location
            </p>
            <p 
              className="text-xl tracking-[0.04em] font-light" 
              style={{ 
                color: '#FFFFFF',
                fontFamily: '"Playfair Display", Georgia, serif',
              }}
            >
              {selectedLocation || 'Select Your Destination'}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gold/70 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-3 rounded-xl border shadow-2xl shadow-black/50 z-50 max-h-[70vh] overflow-hidden animate-fadeIn"
          style={{ 
            backgroundColor: '#0B1426',
            borderColor: 'rgba(139, 105, 20, 0.2)'
          }}
        >
          {/* Search Bar */}
          <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#FFFFFF', opacity: 0.4 }} />
              <input
                type="text"
                placeholder="Search cities, countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-lg bg-white/[0.05] border border-white/[0.15] text-sm focus:outline-none focus:border-gold/40 transition-colors"
                style={{ 
                  color: '#FFFFFF',
                  fontFamily: '"Inter", sans-serif',
                }}
              />
            </div>
          </div>

          {/* Territory List */}
          <div className="overflow-y-auto max-h-[55vh] custom-scrollbar">
            {filteredTerritories.map((territory) => (
              <div key={territory.name} className="border-b last:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {/* Territory Header */}
                <button
                  onClick={() => {
                    if (territory.cities && !territory.countries) {
                      setExpandedTerritory(expandedTerritory === territory.name ? null : territory.name);
                    } else {
                      setExpandedTerritory(expandedTerritory === territory.name ? null : territory.name);
                    }
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.05] transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <Globe className="w-4 h-4 text-gold/70" />
                    <span 
                      className="text-lg tracking-[0.03em] font-light group-hover:text-gold transition-colors" 
                      style={{ 
                        color: '#FFFFFF',
                        fontFamily: '"Playfair Display", Georgia, serif',
                      }}
                    >
                      {territory.name}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expandedTerritory === territory.name ? 'rotate-180' : ''}`} style={{ color: '#FFFFFF', opacity: 0.4 }} />
                </button>

                {/* Cities (for South Africa) */}
                {expandedTerritory === territory.name && territory.cities && (
                  <div className="bg-white/[0.03] py-3">
                    <div className="grid grid-cols-2 gap-1 px-5">
                      {territory.cities.map((city) => (
                        <button
                          key={city}
                          onClick={() => handleLocationSelect(`${city}, ${territory.name}`)}
                          className="text-left px-4 py-3 rounded-lg text-sm hover:text-white hover:bg-gold/10 transition-all duration-200"
                          style={{ 
                            color: '#FFFFFF',
                            fontFamily: '"Inter", sans-serif',
                            opacity: 0.75,
                          }}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Countries (for regions) */}
                {expandedTerritory === territory.name && territory.countries && (
                  <div className="bg-white/[0.03]">
                    {territory.countries.map((country) => (
                      <div key={country.name}>
                        <button
                          onClick={() => setExpandedCountry(expandedCountry === country.name ? null : country.name)}
                          className="w-full flex items-center justify-between px-10 py-3.5 hover:bg-white/[0.05] transition-colors"
                        >
                          <span 
                            className="text-sm hover:text-gold transition-colors" 
                            style={{ 
                              color: '#FFFFFF',
                              fontFamily: '"Inter", sans-serif',
                              opacity: 0.85,
                            }}
                          >
                            {country.name}
                          </span>
                          <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${expandedCountry === country.name ? 'rotate-180' : ''}`} style={{ color: '#FFFFFF', opacity: 0.3 }} />
                        </button>

                        {expandedCountry === country.name && (
                          <div className="bg-white/[0.03] py-2 px-8">
                            <div className="grid grid-cols-2 gap-1">
                              {country.cities.map((city) => (
                                <button
                                  key={city}
                                  onClick={() => handleLocationSelect(`${city}, ${country.name}`)}
                                  className="text-left px-4 py-2.5 rounded-lg text-sm hover:text-white hover:bg-gold/10 transition-all duration-200"
                                  style={{ 
                                    color: '#FFFFFF',
                                    fontFamily: '"Inter", sans-serif',
                                    opacity: 0.65,
                                  }}
                                >
                                  {city}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-5 border-t bg-white/[0.03]" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <p 
              className="text-center text-xs uppercase tracking-[0.15em]" 
              style={{ 
                color: '#FFFFFF',
                fontFamily: '"Inter", sans-serif',
                opacity: 0.5,
              }}
            >
              Can't find your location? <button className="text-gold/80 hover:text-gold transition-colors">Contact us</button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TerritorySelector;
