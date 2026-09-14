import React, { useState } from 'react';
import { ChevronDown, Settings2, X, RotateCcw } from 'lucide-react';
import { useEventContext, PlannerEvent } from '@/contexts/EventContext';
import { getCurrencySymbol } from '@/data/countryConfig';
import {
  MAJOR_CURRENCIES,
  MajorCurrency,
  getExchangeRates,
  saveExchangeRates,
  resetExchangeRates,
  convertCurrency,
} from '@/data/exchangeRates';
import { toast } from '@/components/ui/use-toast';

const GOLD = '#C9A24A';

interface CurrencySwitcherProps {
  event: PlannerEvent;
}

const CurrencySwitcher: React.FC<CurrencySwitcherProps> = ({ event }) => {
  const { convertEventCurrency } = useEventContext();
  const [showRates, setShowRates] = useState(false);
  const [rates, setRates] = useState(getExchangeRates());

  const currentCurrency = (event.currency || 'ZAR') as MajorCurrency;
  const isMajor = (MAJOR_CURRENCIES as readonly string[]).includes(currentCurrency);

  const handleChange = (newCurrency: string) => {
    if (newCurrency === currentCurrency) return;
    const rate = convertCurrency(1, currentCurrency, newCurrency, rates);
    const confirmed = window.confirm(
      `Convert this quote from ${currentCurrency} to ${newCurrency}?\n\n` +
      `1 ${currentCurrency} ≈ ${rate.toFixed(4)} ${newCurrency}\n\n` +
      `Every line item's unit cost, delivery, setup and strike cost will be rescaled at this rate. This can be undone by switching back, but amounts will be re-rounded.`
    );
    if (!confirmed) return;
    convertEventCurrency(event.id, newCurrency);
    toast({ title: 'Currency Converted', description: `Quote converted from ${currentCurrency} to ${newCurrency}.` });
  };

  const handleSaveRates = () => {
    saveExchangeRates(rates);
    setShowRates(false);
    toast({ title: 'Exchange Rates Updated', description: 'New rates will apply to future currency conversions.' });
  };

  const handleResetRates = () => {
    resetExchangeRates();
    setRates(getExchangeRates());
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <select
            value={currentCurrency}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors appearance-none bg-white pr-8"
            style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
          >
            {!isMajor && <option value={currentCurrency}>{getCurrencySymbol(currentCurrency)} - {currentCurrency} (current)</option>}
            {MAJOR_CURRENCIES.map((c) => (
              <option key={c} value={c}>{getCurrencySymbol(c)} - {c}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
        <button
          type="button"
          onClick={() => setShowRates(true)}
          title="Edit exchange rates"
          className="p-2 rounded-lg border transition-colors hover:bg-gray-50"
          style={{ borderColor: '#EFEFEF' }}
        >
          <Settings2 className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
      {!isMajor && (
        <p className="text-[9px] text-gray-400 mt-1">
          Current currency ({currentCurrency}) isn't one of the supported major currencies — converting will switch it to one below.
        </p>
      )}

      {showRates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowRates(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs p-5"
            onClick={(e) => e.stopPropagation()}
            style={{ border: '1px solid rgba(201,162,74,0.15)' }}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Exchange Rates</h3>
              <button onClick={() => setShowRates(false)} className="p-1 rounded-lg hover:bg-black/5">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mb-4">
              Approximate reference rates, not a live feed. Units of ZAR per 1 unit of currency — adjust to match current market rates.
            </p>
            <div className="space-y-2.5">
              {MAJOR_CURRENCIES.filter(c => c !== 'ZAR').map((c) => (
                <div key={c} className="flex items-center gap-2">
                  <span className="text-xs w-28 text-gray-600">1 {c} =</span>
                  <input
                    type="number"
                    step="0.01"
                    value={rates[c]}
                    onChange={(e) => setRates(p => ({ ...p, [c]: parseFloat(e.target.value) || 0 }))}
                    className="flex-1 h-8 text-xs rounded-lg border px-2 outline-none"
                    style={{ borderColor: 'rgba(201,162,74,0.2)', color: '#1A1A1A' }}
                  />
                  <span className="text-xs text-gray-400">ZAR</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={handleSaveRates}
                className="flex-1 py-2 rounded-lg text-xs font-medium uppercase tracking-wider"
                style={{ backgroundColor: GOLD, color: '#FFF' }}
              >
                Save Rates
              </button>
              <button
                type="button"
                onClick={handleResetRates}
                title="Reset to defaults"
                className="p-2 rounded-lg border hover:bg-gray-50"
                style={{ borderColor: '#EFEFEF' }}
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySwitcher;
