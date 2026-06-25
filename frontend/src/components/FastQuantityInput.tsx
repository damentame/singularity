import React, { useState, useRef, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';

const GOLD = '#C9A24A';

interface FastQuantityInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  steps?: number[];
  presets?: number[];
  compact?: boolean;
}

const FastQuantityInput: React.FC<FastQuantityInputProps> = ({
  value,
  onChange,
  min = 0,
  max = 9999,
  steps = [-10, -1, 1, 10],
  presets,
  compact = false,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  const clamp = (v: number) => Math.max(min, Math.min(max, v));

  const handleStep = (delta: number) => {
    onChange(clamp(value + delta));
  };

  const commitDraft = () => {
    const parsed = parseInt(draft, 10);
    if (!isNaN(parsed)) onChange(clamp(parsed));
    else setDraft(String(value));
    setEditing(false);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {steps.map((s) => (
          <button
            key={s}
            onClick={() => handleStep(s)}
            className="w-7 h-7 rounded-md text-xs font-medium flex items-center justify-center transition-colors"
            style={{
              backgroundColor: s < 0 ? 'rgba(0,0,0,0.04)' : 'rgba(201,162,74,0.08)',
              color: s < 0 ? '#888' : GOLD,
            }}
          >
            {s > 0 ? `+${s}` : s}
          </button>
        ))}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={editing ? draft : String(value)}
          onFocus={() => { setEditing(true); setDraft(String(value)); }}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
          onBlur={commitDraft}
          onKeyDown={(e) => { if (e.key === 'Enter') commitDraft(); }}
          className="w-16 h-7 text-center text-sm rounded-md border transition-colors outline-none"
          style={{
            borderColor: editing ? GOLD : '#E5E5E5',
            fontFamily: '"Inter", sans-serif',
            color: '#1A1A1A',
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleStep(-10)}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium transition-colors"
          style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: '#888' }}
        >
          -10
        </button>
        <button
          onClick={() => handleStep(-1)}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: '#888' }}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={editing ? draft : String(value)}
          onFocus={() => { setEditing(true); setDraft(String(value)); }}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
          onBlur={commitDraft}
          onKeyDown={(e) => { if (e.key === 'Enter') commitDraft(); }}
          className="w-20 h-9 text-center text-base font-medium rounded-lg border-2 transition-colors outline-none"
          style={{
            borderColor: editing ? GOLD : '#E5E5E5',
            fontFamily: '"Inter", sans-serif',
            color: '#1A1A1A',
          }}
        />
        <button
          onClick={() => handleStep(1)}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleStep(10)}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium transition-colors"
          style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}
        >
          +10
        </button>
      </div>
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => onChange(clamp(p))}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                value === p ? 'text-white' : ''
              }`}
              style={{
                backgroundColor: value === p ? GOLD : 'rgba(0,0,0,0.04)',
                color: value === p ? '#FFF' : '#777',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FastQuantityInput;
