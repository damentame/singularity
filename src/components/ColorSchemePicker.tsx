import React, { useState } from 'react';
import { Check, X, Palette, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { colorPalette, ColorOption } from '@/data/questionnaireData';

interface ColorSchemePickerProps {
  selectedColors: string[];
  onColorsChange: (colors: string[]) => void;
  maxColors?: number;
}

const ColorSchemePicker: React.FC<ColorSchemePickerProps> = ({
  selectedColors,
  onColorsChange,
  maxColors = 5,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isOpen, setIsOpen] = useState(false);

  const categories = ['All', ...Array.from(new Set(colorPalette.map(c => c.category)))];

  const filteredColors = activeCategory === 'All' 
    ? colorPalette 
    : colorPalette.filter(c => c.category === activeCategory);

  const toggleColor = (colorId: string) => {
    if (selectedColors.includes(colorId)) {
      onColorsChange(selectedColors.filter(id => id !== colorId));
    } else if (selectedColors.length < maxColors) {
      onColorsChange([...selectedColors, colorId]);
    }
  };

  const removeColor = (colorId: string) => {
    onColorsChange(selectedColors.filter(id => id !== colorId));
  };

  const getColorById = (id: string): ColorOption | undefined => {
    return colorPalette.find(c => c.id === id);
  };

  return (
    <div className="space-y-4">
      {/* Selected Colors Display */}
      <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-50 rounded-lg border border-gray-200">
        {selectedColors.length === 0 ? (
          <span className="text-gray-400 text-sm">Select up to {maxColors} colors for your palette</span>
        ) : (
          selectedColors.map(colorId => {
            const color = getColorById(colorId);
            if (!color) return null;
            return (
              <Badge
                key={colorId}
                variant="secondary"
                className="flex items-center gap-2 px-3 py-1.5 bg-white border"
              >
                <div
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-sm">{color.name}</span>
                <button
                  onClick={() => removeColor(colorId)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })
        )}
      </div>

      {/* Color Dropdown */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Select Colors
            </span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-4">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1 mb-4 pb-3 border-b">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    activeCategory === category
                      ? 'bg-rose-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Color Grid */}
            <div className="grid grid-cols-8 gap-2 max-h-[300px] overflow-y-auto">
              {filteredColors.map(color => {
                const isSelected = selectedColors.includes(color.id);
                const isDisabled = !isSelected && selectedColors.length >= maxColors;
                
                return (
                  <button
                    key={color.id}
                    onClick={() => !isDisabled && toggleColor(color.id)}
                    disabled={isDisabled}
                    className={`relative group w-10 h-10 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-rose-500 scale-110 shadow-lg'
                        : isDisabled
                        ? 'border-gray-200 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-400 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
                        <Check className="w-5 h-5 text-white drop-shadow-lg" />
                      </div>
                    )}
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {color.name}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Color Wheel Visual */}
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs text-gray-500 mb-2">Color Wheel Preview</div>
              <div className="relative w-full h-24 rounded-lg overflow-hidden">
                <div 
                  className="absolute inset-0"
                  style={{
                    background: `conic-gradient(
                      from 0deg,
                      #FF0000, #FF8000, #FFFF00, #80FF00, 
                      #00FF00, #00FF80, #00FFFF, #0080FF,
                      #0000FF, #8000FF, #FF00FF, #FF0080, #FF0000
                    )`
                  }}
                />
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'radial-gradient(circle at center, white 0%, transparent 70%)'
                  }}
                />
              </div>
            </div>

            {/* Selected Count */}
            <div className="mt-3 text-sm text-gray-500 text-center">
              {selectedColors.length} of {maxColors} colors selected
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Color Palette Preview */}
      {selectedColors.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Your Color Palette</div>
          <div className="flex h-16 rounded-lg overflow-hidden shadow-md">
            {selectedColors.map((colorId, index) => {
              const color = getColorById(colorId);
              if (!color) return null;
              return (
                <div
                  key={colorId}
                  className="flex-1 relative group"
                  style={{ backgroundColor: color.hex }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <span className="text-white text-xs font-medium drop-shadow">{color.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorSchemePicker;
