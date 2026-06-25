import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Thermometer, MapPin, Calendar, Umbrella } from 'lucide-react';

interface WeatherDay {
  date: string;
  day: string;
  high: number;
  low: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'partly-cloudy';
  humidity: number;
  wind: number;
  precipitation: number;
}

const WeatherForecast: React.FC = () => {
  const [location, setLocation] = useState('Cape Town, South Africa');
  const [eventDate, setEventDate] = useState('');
  const [forecast, setForecast] = useState<WeatherDay[]>([]);
  const [unit, setUnit] = useState<'C' | 'F'>('C');

  useEffect(() => {
    // Generate mock 7-day forecast
    generateForecast();
  }, [location]);

  const generateForecast = () => {
    const conditions: WeatherDay['condition'][] = ['sunny', 'cloudy', 'partly-cloudy', 'rainy', 'sunny', 'partly-cloudy', 'sunny'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    const newForecast: WeatherDay[] = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[date.getDay()],
        high: Math.round(22 + Math.random() * 10),
        low: Math.round(14 + Math.random() * 6),
        condition: conditions[i],
        humidity: Math.round(40 + Math.random() * 40),
        wind: Math.round(5 + Math.random() * 20),
        precipitation: conditions[i] === 'rainy' ? Math.round(60 + Math.random() * 30) : Math.round(Math.random() * 20),
      };
    });
    
    setForecast(newForecast);
  };

  const getWeatherIcon = (condition: string, size = 'w-8 h-8') => {
    switch (condition) {
      case 'sunny':
        return <Sun className={`${size} text-yellow-400`} />;
      case 'cloudy':
        return <Cloud className={`${size} text-gray-400`} />;
      case 'partly-cloudy':
        return <Cloud className={`${size} text-blue-300`} />;
      case 'rainy':
        return <CloudRain className={`${size} text-blue-400`} />;
      case 'stormy':
        return <CloudRain className={`${size} text-purple-400`} />;
      case 'snowy':
        return <CloudSnow className={`${size} text-white`} />;
      default:
        return <Sun className={`${size} text-yellow-400`} />;
    }
  };

  const convertTemp = (celsius: number) => {
    if (unit === 'F') {
      return Math.round((celsius * 9/5) + 32);
    }
    return celsius;
  };

  const popularLocations = [
    'Cape Town, South Africa',
    'Johannesburg, South Africa',
    'Durban, South Africa',
    'London, UK',
    'Paris, France',
    'New York, USA',
    'Sydney, Australia',
    'Dubai, UAE',
    'Bali, Indonesia',
    'Santorini, Greece',
  ];

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: '#0B1426' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-normal tracking-[0.04em] mb-4" style={{ color: '#FFFFFF' }}>
            Weather Forecast
          </h1>
          <p className="font-body text-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Plan your perfect outdoor event with accurate weather predictions
          </p>
        </div>

        {/* Location & Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="md:col-span-2">
            <label className="font-body text-xs uppercase tracking-wider mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Event Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/[0.05] border border-white/[0.1] rounded-xl font-body text-white focus:outline-none focus:border-gold/50 appearance-none"
              >
                {popularLocations.map(loc => (
                  <option key={loc} value={loc} className="bg-navy">{loc}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-wider mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Temperature Unit
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setUnit('C')}
                className={`flex-1 py-4 rounded-xl font-body font-medium transition-colors ${
                  unit === 'C' ? 'bg-gold text-navy' : 'bg-white/[0.05] text-white hover:bg-white/[0.1]'
                }`}
              >
                Celsius
              </button>
              <button
                onClick={() => setUnit('F')}
                className={`flex-1 py-4 rounded-xl font-body font-medium transition-colors ${
                  unit === 'F' ? 'bg-gold text-navy' : 'bg-white/[0.05] text-white hover:bg-white/[0.1]'
                }`}
              >
                Fahrenheit
              </button>
            </div>
          </div>
        </div>

        {/* Current Weather */}
        {forecast.length > 0 && (
          <div className="bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 rounded-2xl p-8 mb-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                {getWeatherIcon(forecast[0].condition, 'w-20 h-20')}
                <div>
                  <p className="font-body text-sm uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {location}
                  </p>
                  <p className="font-display text-6xl" style={{ color: '#FFFFFF' }}>
                    {convertTemp(forecast[0].high)}°{unit}
                  </p>
                  <p className="font-body text-lg capitalize" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {forecast[0].condition.replace('-', ' ')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <Droplets className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Humidity</p>
                  <p className="font-display text-xl" style={{ color: '#FFFFFF' }}>{forecast[0].humidity}%</p>
                </div>
                <div className="text-center">
                  <Wind className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Wind</p>
                  <p className="font-display text-xl" style={{ color: '#FFFFFF' }}>{forecast[0].wind} km/h</p>
                </div>
                <div className="text-center">
                  <Umbrella className="w-6 h-6 text-blue-300 mx-auto mb-2" />
                  <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Rain</p>
                  <p className="font-display text-xl" style={{ color: '#FFFFFF' }}>{forecast[0].precipitation}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7-Day Forecast */}
        <h2 className="font-display text-2xl mb-6" style={{ color: '#FFFFFF' }}>7-Day Forecast</h2>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-10">
          {forecast.map((day, index) => (
            <div
              key={index}
              className={`bg-white/[0.03] border rounded-2xl p-4 text-center transition-all hover:bg-white/[0.05] ${
                index === 0 ? 'border-gold/30' : 'border-white/[0.08]'
              }`}
            >
              <p className="font-body text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>{day.day}</p>
              <p className="font-body text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{day.date}</p>
              <div className="flex justify-center mb-3">
                {getWeatherIcon(day.condition, 'w-10 h-10')}
              </div>
              <p className="font-display text-xl mb-1" style={{ color: '#FFFFFF' }}>
                {convertTemp(day.high)}°
              </p>
              <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {convertTemp(day.low)}°
              </p>
              {day.precipitation > 30 && (
                <div className="mt-2 flex items-center justify-center gap-1">
                  <Droplets className="w-3 h-3 text-blue-400" />
                  <span className="font-body text-xs text-blue-400">{day.precipitation}%</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Event Planning Tips */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
          <h2 className="font-display text-2xl mb-6" style={{ color: '#FFFFFF' }}>Event Planning Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Sun className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-body font-medium mb-1" style={{ color: '#FFFFFF' }}>Sunny Days</h3>
                <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Consider providing shade structures, sunscreen stations, and refreshing beverages for outdoor events.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <CloudRain className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-body font-medium mb-1" style={{ color: '#FFFFFF' }}>Rainy Days</h3>
                <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Always have a backup indoor venue or tent rentals ready. Provide umbrellas for guests.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-500/20 flex items-center justify-center flex-shrink-0">
                <Wind className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 className="font-body font-medium mb-1" style={{ color: '#FFFFFF' }}>Windy Conditions</h3>
                <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Secure all decorations, use weighted centerpieces, and consider wind breaks for comfort.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Thermometer className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-body font-medium mb-1" style={{ color: '#FFFFFF' }}>Temperature Extremes</h3>
                <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Plan for heating or cooling options. Schedule outdoor activities during comfortable hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherForecast;
