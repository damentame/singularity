// ─── Country Finance Configuration ───────────────────────────────────────────
// Provides default VAT/GST rates, currency, and tax naming per country.
// Used to auto-populate event-level finance fields when country is selected.

export interface CountryFinanceConfig {
  countryIso: string;
  countryName: string;
  currencyIso: string;
  currencySymbol: string;
  vatRate: number;          // decimal e.g. 0.15 = 15%
  vatName: string;          // "VAT", "TVA", "MwSt", "GST", etc.
  defaultPricesIncludeVat: boolean;
}

// ─── Core Country Configs ────────────────────────────────────────────────────

export const COUNTRY_FINANCE_CONFIGS: CountryFinanceConfig[] = [
  // South Africa
  { countryIso: 'ZA', countryName: 'South Africa', currencyIso: 'ZAR', currencySymbol: 'R', vatRate: 0.15, vatName: 'VAT', defaultPricesIncludeVat: true },
  // United Kingdom
  { countryIso: 'GB', countryName: 'United Kingdom', currencyIso: 'GBP', currencySymbol: '£', vatRate: 0.20, vatName: 'VAT', defaultPricesIncludeVat: true },
  // Switzerland
  { countryIso: 'CH', countryName: 'Switzerland', currencyIso: 'CHF', currencySymbol: 'CHF', vatRate: 0.081, vatName: 'MwSt', defaultPricesIncludeVat: true },
  // EU Countries (EUR)
  { countryIso: 'DE', countryName: 'Germany', currencyIso: 'EUR', currencySymbol: '€', vatRate: 0.19, vatName: 'MwSt', defaultPricesIncludeVat: true },
  { countryIso: 'FR', countryName: 'France', currencyIso: 'EUR', currencySymbol: '€', vatRate: 0.20, vatName: 'TVA', defaultPricesIncludeVat: true },
  { countryIso: 'IT', countryName: 'Italy', currencyIso: 'EUR', currencySymbol: '€', vatRate: 0.22, vatName: 'IVA', defaultPricesIncludeVat: true },
  { countryIso: 'ES', countryName: 'Spain', currencyIso: 'EUR', currencySymbol: '€', vatRate: 0.21, vatName: 'IVA', defaultPricesIncludeVat: true },
  { countryIso: 'NL', countryName: 'Netherlands', currencyIso: 'EUR', currencySymbol: '€', vatRate: 0.21, vatName: 'BTW', defaultPricesIncludeVat: true },
  { countryIso: 'PT', countryName: 'Portugal', currencyIso: 'EUR', currencySymbol: '€', vatRate: 0.23, vatName: 'IVA', defaultPricesIncludeVat: true },
  { countryIso: 'IE', countryName: 'Ireland', currencyIso: 'EUR', currencySymbol: '€', vatRate: 0.23, vatName: 'VAT', defaultPricesIncludeVat: true },
  { countryIso: 'AT', countryName: 'Austria', currencyIso: 'EUR', currencySymbol: '€', vatRate: 0.20, vatName: 'USt', defaultPricesIncludeVat: true },
  { countryIso: 'BE', countryName: 'Belgium', currencyIso: 'EUR', currencySymbol: '€', vatRate: 0.21, vatName: 'TVA/BTW', defaultPricesIncludeVat: true },
  { countryIso: 'FI', countryName: 'Finland', currencyIso: 'EUR', currencySymbol: '€', vatRate: 0.255, vatName: 'ALV', defaultPricesIncludeVat: true },
  { countryIso: 'GR', countryName: 'Greece', currencyIso: 'EUR', currencySymbol: '€', vatRate: 0.24, vatName: 'FPA', defaultPricesIncludeVat: true },
  { countryIso: 'LU', countryName: 'Luxembourg', currencyIso: 'EUR', currencySymbol: '€', vatRate: 0.17, vatName: 'TVA', defaultPricesIncludeVat: true },
  // Other popular
  { countryIso: 'US', countryName: 'United States', currencyIso: 'USD', currencySymbol: '$', vatRate: 0, vatName: 'Tax', defaultPricesIncludeVat: false },
  { countryIso: 'AE', countryName: 'United Arab Emirates', currencyIso: 'AED', currencySymbol: 'AED', vatRate: 0.05, vatName: 'VAT', defaultPricesIncludeVat: false },
  { countryIso: 'AU', countryName: 'Australia', currencyIso: 'AUD', currencySymbol: 'A$', vatRate: 0.10, vatName: 'GST', defaultPricesIncludeVat: true },
  { countryIso: 'NZ', countryName: 'New Zealand', currencyIso: 'NZD', currencySymbol: 'NZ$', vatRate: 0.15, vatName: 'GST', defaultPricesIncludeVat: true },
  { countryIso: 'CA', countryName: 'Canada', currencyIso: 'CAD', currencySymbol: 'C$', vatRate: 0.05, vatName: 'GST', defaultPricesIncludeVat: false },
  { countryIso: 'IN', countryName: 'India', currencyIso: 'INR', currencySymbol: '₹', vatRate: 0.18, vatName: 'GST', defaultPricesIncludeVat: false },
  { countryIso: 'KE', countryName: 'Kenya', currencyIso: 'KES', currencySymbol: 'KSh', vatRate: 0.16, vatName: 'VAT', defaultPricesIncludeVat: true },
  { countryIso: 'NG', countryName: 'Nigeria', currencyIso: 'NGN', currencySymbol: '₦', vatRate: 0.075, vatName: 'VAT', defaultPricesIncludeVat: false },
  { countryIso: 'MU', countryName: 'Mauritius', currencyIso: 'MUR', currencySymbol: 'Rs', vatRate: 0.15, vatName: 'VAT', defaultPricesIncludeVat: true },
  { countryIso: 'NA', countryName: 'Namibia', currencyIso: 'NAD', currencySymbol: 'N$', vatRate: 0.15, vatName: 'VAT', defaultPricesIncludeVat: true },
  { countryIso: 'BW', countryName: 'Botswana', currencyIso: 'BWP', currencySymbol: 'P', vatRate: 0.14, vatName: 'VAT', defaultPricesIncludeVat: true },
  { countryIso: 'MZ', countryName: 'Mozambique', currencyIso: 'MZN', currencySymbol: 'MT', vatRate: 0.16, vatName: 'IVA', defaultPricesIncludeVat: true },
  { countryIso: 'SG', countryName: 'Singapore', currencyIso: 'SGD', currencySymbol: 'S$', vatRate: 0.09, vatName: 'GST', defaultPricesIncludeVat: false },
  { countryIso: 'HK', countryName: 'Hong Kong', currencyIso: 'HKD', currencySymbol: 'HK$', vatRate: 0, vatName: 'Tax', defaultPricesIncludeVat: false },
  { countryIso: 'JP', countryName: 'Japan', currencyIso: 'JPY', currencySymbol: '¥', vatRate: 0.10, vatName: 'CT', defaultPricesIncludeVat: true },
  { countryIso: 'SE', countryName: 'Sweden', currencyIso: 'SEK', currencySymbol: 'kr', vatRate: 0.25, vatName: 'Moms', defaultPricesIncludeVat: true },
  { countryIso: 'NO', countryName: 'Norway', currencyIso: 'NOK', currencySymbol: 'kr', vatRate: 0.25, vatName: 'MVA', defaultPricesIncludeVat: true },
  { countryIso: 'DK', countryName: 'Denmark', currencyIso: 'DKK', currencySymbol: 'kr', vatRate: 0.25, vatName: 'Moms', defaultPricesIncludeVat: true },
];

// ─── Default fallback (South Africa) ─────────────────────────────────────────

export const DEFAULT_COUNTRY_CONFIG: CountryFinanceConfig = COUNTRY_FINANCE_CONFIGS[0]; // ZA

// ─── Lookup Helpers ──────────────────────────────────────────────────────────

export const getCountryConfig = (countryIso: string): CountryFinanceConfig | undefined =>
  COUNTRY_FINANCE_CONFIGS.find(c => c.countryIso === countryIso);

export const getCountryConfigOrDefault = (countryIso: string): CountryFinanceConfig =>
  getCountryConfig(countryIso) || DEFAULT_COUNTRY_CONFIG;

export const getCurrencySymbol = (currencyIso: string): string => {
  const config = COUNTRY_FINANCE_CONFIGS.find(c => c.currencyIso === currencyIso);
  return config?.currencySymbol || currencyIso;
};

// ─── Currency Format Helper ──────────────────────────────────────────────────

export const formatCurrency = (amount: number, currencySymbol: string = 'R', locale: string = 'en-ZA'): string => {
  const formatted = amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // For symbols that are short (R, £, $, €, ₹, ₦) put them before with space
  // For longer codes (CHF, AED, etc.) put them before with space
  return `${currencySymbol} ${formatted}`;
};

// ─── Unique Currency List (for dropdown) ─────────────────────────────────────

export interface CurrencyOption {
  iso: string;
  symbol: string;
  label: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = (() => {
  const seen = new Set<string>();
  const list: CurrencyOption[] = [];
  // Prioritized order
  const priority = ['ZAR', 'GBP', 'EUR', 'USD', 'CHF', 'AED', 'AUD', 'NZD', 'CAD', 'INR'];
  for (const iso of priority) {
    const cfg = COUNTRY_FINANCE_CONFIGS.find(c => c.currencyIso === iso);
    if (cfg && !seen.has(iso)) {
      seen.add(iso);
      list.push({ iso, symbol: cfg.currencySymbol, label: `${cfg.currencySymbol} — ${iso}` });
    }
  }
  for (const cfg of COUNTRY_FINANCE_CONFIGS) {
    if (!seen.has(cfg.currencyIso)) {
      seen.add(cfg.currencyIso);
      list.push({ iso: cfg.currencyIso, symbol: cfg.currencySymbol, label: `${cfg.currencySymbol} — ${cfg.currencyIso}` });
    }
  }
  return list;
})();

// ─── VAT Calculation Helpers ─────────────────────────────────────────────────

export interface VatBreakdown {
  supplierNet: number;
  vatValue: number;
  supplierGross: number;
}

/**
 * Calculate VAT breakdown from total input cost.
 * @param totalInputCost - The total cost as entered (qty * unitPrice + setup + breakdown + delivery)
 * @param priceIncludesVat - Whether the input price already includes VAT
 * @param vatRate - The VAT rate as decimal (e.g. 0.15 for 15%)
 */
export const calculateVatBreakdown = (
  totalInputCost: number,
  priceIncludesVat: boolean,
  vatRate: number,
): VatBreakdown => {
  if (vatRate <= 0) {
    return { supplierNet: totalInputCost, vatValue: 0, supplierGross: totalInputCost };
  }

  if (priceIncludesVat) {
    // Input IS the gross
    const supplierGross = totalInputCost;
    const supplierNet = supplierGross / (1 + vatRate);
    const vatValue = supplierGross - supplierNet;
    return { supplierNet, vatValue, supplierGross };
  } else {
    // Input IS the net
    const supplierNet = totalInputCost;
    const vatValue = supplierNet * vatRate;
    const supplierGross = supplierNet + vatValue;
    return { supplierNet, vatValue, supplierGross };
  }
};
