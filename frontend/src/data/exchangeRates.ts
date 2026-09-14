// ─── Exchange Rate Converter ───────────────────────────────────────────────────
// Static reference rates — not a live feed. Values below are approximate average
// market rates for August 2026 for this app's major supported currencies,
// expressed as "how many ZAR buy 1 unit of this currency". They are a sensible
// starting point, not a guaranteed-accurate feed: review and adjust them via
// getExchangeRates/saveExchangeRates (surfaced in the currency switcher UI)
// whenever real rates drift.

export const MAJOR_CURRENCIES = ['ZAR', 'USD', 'EUR', 'GBP', 'AUD'] as const;
export type MajorCurrency = typeof MAJOR_CURRENCIES[number];

export const DEFAULT_RATES_TO_ZAR: Record<MajorCurrency, number> = {
  ZAR: 1,
  USD: 18.30,
  EUR: 19.90,
  GBP: 23.20,
  AUD: 12.10,
};

const RATES_STORAGE_KEY = 'theone_exchange_rates_v1';

export const getExchangeRates = (): Record<MajorCurrency, number> => {
  try {
    const raw = localStorage.getItem(RATES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_RATES_TO_ZAR, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_RATES_TO_ZAR };
};

export const saveExchangeRates = (rates: Record<MajorCurrency, number>): void => {
  localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(rates));
};

export const resetExchangeRates = (): void => {
  localStorage.removeItem(RATES_STORAGE_KEY);
};

/** Converts an amount between two currencies via ZAR as the pivot. Returns the amount unchanged if either currency isn't in the rate table. */
export const convertCurrency = (
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number> = getExchangeRates(),
): number => {
  if (from === to) return amount;
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate) return amount;
  return (amount * fromRate) / toRate;
};
