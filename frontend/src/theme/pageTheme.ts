import { useSyncExternalStore, type CSSProperties } from 'react';

export const THEME_TOKENS = [
  { key: 'background', label: 'Background', hint: 'Page canvas' },
  { key: 'surface', label: 'Surface', hint: 'Header and cards' },
  { key: 'primary', label: 'Primary', hint: 'Buttons and key actions' },
  { key: 'accent', label: 'Accent', hint: 'Section titles and highlights' },
  { key: 'text', label: 'Text', hint: 'Main headings' },
  { key: 'muted', label: 'Muted', hint: 'Secondary labels' },
  { key: 'border', label: 'Border', hint: 'Dividers and card edges' },
] as const;

export type ThemeToken = (typeof THEME_TOKENS)[number]['key'];

export interface PageTheme {
  background: string;
  surface: string;
  primary: string;
  accent: string;
  text: string;
  muted: string;
  border: string;
}

/** Colours already used by the product. Themes can only assign these. */
export const APP_PALETTE = [
  { id: 'gold', name: 'Gold', hex: '#C9A24A' },
  { id: 'gold-light', name: 'Light gold', hex: '#D4AF5A' },
  { id: 'gold-deep', name: 'Deep gold', hex: '#A8863A' },
  { id: 'antique-gold', name: 'Antique gold', hex: '#8B6914' },
  { id: 'soft-gold', name: 'Soft gold', hex: '#B8956A' },
  { id: 'cream', name: 'Cream', hex: '#F5F4F0' },
  { id: 'ivory', name: 'Ivory', hex: '#FAFAF7' },
  { id: 'paper', name: 'Paper', hex: '#FFFCF7' },
  { id: 'warm-cream', name: 'Warm cream', hex: '#F5F1E8' },
  { id: 'canvas', name: 'Canvas', hex: '#E7E2D6' },
  { id: 'warm-paper', name: 'Warm paper', hex: '#F3EEE6' },
  { id: 'white', name: 'White', hex: '#FFFFFF' },
  { id: 'ink', name: 'Ink', hex: '#1A1A1A' },
  { id: 'charcoal', name: 'Charcoal', hex: '#2C2C2C' },
  { id: 'navy', name: 'Navy', hex: '#0B1426' },
  { id: 'navy-light', name: 'Navy light', hex: '#152238' },
  { id: 'warm-grey', name: 'Warm grey', hex: '#8A8175' },
  { id: 'stone', name: 'Stone', hex: '#6B6560' },
  { id: 'border', name: 'Border', hex: '#D4CFC6' },
] as const;

export type PaletteColorId = (typeof APP_PALETTE)[number]['id'];

const PALETTE_BY_HEX = new Map(APP_PALETTE.map((color) => [color.hex.toLowerCase(), color.hex]));

export function paletteColor(hex: string) {
  return APP_PALETTE.find((color) => color.hex.toLowerCase() === hex.toLowerCase());
}

export const DEFAULT_PAGE_THEME: PageTheme = {
  background: '#F5F4F0',
  surface: '#FFFCF7',
  primary: '#C9A24A',
  accent: '#C9A24A',
  text: '#1A1A1A',
  muted: '#8A8175',
  border: '#D4CFC6',
};

export const THEME_PAGES = [
  { id: 'coordinator-dashboard', label: 'Events', description: 'Calendar, recent work, and the event grid' },
  { id: 'coordinator-event', label: 'Event quote', description: 'Quote form, section titles, and the summary column' },
  { id: 'coordinator-proposal', label: 'Proposal', description: 'Client-facing proposal' },
  { id: 'theme-studio', label: 'Theme studio', description: 'This settings page' },
] as const;

export type ThemePageId = (typeof THEME_PAGES)[number]['id'];

function sanitizeTheme(theme: Partial<PageTheme> | undefined): PageTheme {
  const next = { ...DEFAULT_PAGE_THEME };
  if (!theme) return next;
  for (const token of THEME_TOKENS) {
    const value = theme[token.key];
    const allowed = value ? PALETTE_BY_HEX.get(value.toLowerCase()) : undefined;
    if (allowed) next[token.key] = allowed;
  }
  return next;
}

const STORAGE_KEY = 'singularity_page_themes_v1';

const listeners = new Set<() => void>();
let themes: Partial<Record<ThemePageId, PageTheme>> = readThemes();

function readThemes(): Partial<Record<ThemePageId, PageTheme>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Record<ThemePageId, PageTheme>>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
  emit();
}

export function subscribePageThemes(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPageThemes() {
  return themes;
}

export function resolvePageTheme(pageId: string): PageTheme {
  return sanitizeTheme(themes[pageId as ThemePageId]);
}

export function setPageToken(pageId: ThemePageId, token: ThemeToken, value: string) {
  const allowed = PALETTE_BY_HEX.get(value.toLowerCase());
  if (!allowed) return;
  themes = {
    ...themes,
    [pageId]: { ...resolvePageTheme(pageId), [token]: allowed },
  };
  persist();
}

export function applyPageTheme(pageId: ThemePageId, theme: PageTheme) {
  themes = { ...themes, [pageId]: sanitizeTheme(theme) };
  persist();
}

export function resetPageTheme(pageId: ThemePageId) {
  const next = { ...themes };
  delete next[pageId];
  themes = next;
  persist();
}

export interface ThemeTemplate {
  id: string;
  name: string;
  theme: PageTheme;
  createdAt: string;
}

const TEMPLATE_KEY = 'singularity_theme_templates_v1';
let themeTemplates: ThemeTemplate[] = readTemplates();

function readTemplates(): ThemeTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ThemeTemplate[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.name === 'string' && item.theme)
      .map((item) => ({ ...item, theme: sanitizeTheme(item.theme) }));
  } catch {
    return [];
  }
}

function persistTemplates() {
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(themeTemplates));
  emit();
}

export function getThemeTemplates() {
  return themeTemplates;
}

export function saveThemeTemplate(name: string, theme: PageTheme) {
  const trimmed = name.trim();
  if (!trimmed) return;
  themeTemplates = [
    {
      id: `tpl-${Date.now()}`,
      name: trimmed,
      theme: sanitizeTheme(theme),
      createdAt: new Date().toISOString(),
    },
    ...themeTemplates,
  ];
  persistTemplates();
}

export function deleteThemeTemplate(id: string) {
  themeTemplates = themeTemplates.filter((item) => item.id !== id);
  persistTemplates();
}

export function useThemeTemplates() {
  return useSyncExternalStore(subscribePageThemes, getThemeTemplates, getThemeTemplates);
}

export function exportThemeBundle() {
  const pages = Object.fromEntries(
    THEME_PAGES.map((page) => [page.id, resolvePageTheme(page.id)]),
  );
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    note: 'Saved theme templates for later implementation. Every colour is from the app palette.',
    palette: APP_PALETTE.map(({ id, name, hex }) => ({ id, name, hex })),
    templates: themeTemplates,
    pages,
  };
}

function channel(value: number) {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return 0;
  const n = parseInt(match[1], 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

function contrast(a: string, b: string) {
  const left = luminance(a);
  const right = luminance(b);
  const [hi, lo] = left > right ? [left, right] : [right, left];
  return (hi + 0.05) / (lo + 0.05);
}

function pickColor(score: (hex: string) => number, locked?: string) {
  const ranked = APP_PALETTE
    .filter((color) => !locked || color.hex.toLowerCase() !== locked.toLowerCase())
    .map((color) => ({ hex: color.hex, score: score(color.hex) }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.hex ?? DEFAULT_PAGE_THEME.background;
}

export interface ThemeSuggestion {
  reason: string;
  theme: PageTheme;
  changes: { token: ThemeToken; label: string; name: string }[];
}

export function suggestTheme(current: PageTheme, changed: ThemeToken): ThemeSuggestion | null {
  const locked = sanitizeTheme(current);
  const resolvedBackground = changed === 'text' && contrast(locked.background, locked.text) < 4.5
    ? pickColor((hex) => {
      const ratio = contrast(hex, locked.text);
      return ratio >= 4.5 ? 20 + ratio : ratio;
    })
    : locked.background;

  const darkPage = luminance(resolvedBackground) < 0.35;
  let surface = locked.surface;
  const surfaceFails = darkPage
    ? luminance(surface) > 0.5
    : contrast(surface, resolvedBackground) < 1.08 || surface.toLowerCase() === resolvedBackground.toLowerCase();
  if (changed !== 'surface' && surfaceFails) {
    surface = pickColor((hex) => {
      const ratio = contrast(hex, resolvedBackground);
      if (darkPage) {
        const visible = luminance(hex) < 0.45 && ratio >= 1.12 && ratio <= 2.8;
        return (visible ? 20 : 0) + ratio;
      }
      const visible = ratio >= 1.08 && ratio <= 2.4;
      return (visible ? 12 : 0) + (luminance(hex) >= luminance(resolvedBackground) ? 2 : 0) + ratio;
    }, resolvedBackground);
  }

  let text = locked.text;
  const textFails = Math.min(contrast(text, resolvedBackground), contrast(text, surface)) < 4.5;
  if (changed !== 'text' && textFails) {
    text = pickColor((hex) => {
      const worst = Math.min(contrast(hex, resolvedBackground), contrast(hex, surface));
      return worst >= 4.5 ? 30 + worst : worst;
    });
  }

  let muted = locked.muted;
  const mutedFails = Math.min(contrast(muted, resolvedBackground), contrast(muted, surface)) < 3;
  if (changed !== 'muted' && mutedFails) {
    muted = pickColor((hex) => {
      const worst = Math.min(contrast(hex, resolvedBackground), contrast(hex, surface));
      const quieter = contrast(hex, resolvedBackground) + 0.75 < contrast(text, resolvedBackground);
      return (worst >= 3 ? 16 : 0) + (quieter ? 4 : 0) + worst;
    }, text);
  }

  let border = locked.border;
  const borderRatio = contrast(border, resolvedBackground);
  const borderFails = borderRatio < 1.25 || borderRatio > 3.2;
  if (changed !== 'border' && borderFails) {
    border = pickColor((hex) => {
      const ratio = contrast(hex, resolvedBackground);
      const visible = ratio >= 1.25 && ratio <= 2.6;
      return (visible ? 14 : 0) + (ratio < contrast(text, resolvedBackground) ? 2 : 0);
    }, text);
  }

  let primary = locked.primary;
  const primaryLabel = onPrimary(primary);
  const primaryFails = contrast(primary, primaryLabel) < 4.5 || contrast(primary, resolvedBackground) < 2.2;
  if (changed !== 'primary' && primaryFails) {
    primary = pickColor((hex) => {
      const labelContrast = contrast(hex, onPrimary(hex));
      const standsOut = contrast(hex, resolvedBackground);
      return (labelContrast >= 4.5 ? 20 : 0) + (standsOut >= 2.5 ? 8 : 0) + standsOut;
    });
  }

  let accent = locked.accent;
  const accentFails = contrast(accent, surface) < 3;
  if (changed !== 'accent' && accentFails) {
    accent = pickColor((hex) => {
      const onSurface = contrast(hex, surface);
      return (onSurface >= 4.5 ? 24 : onSurface >= 3 ? 12 : 0) + onSurface;
    }, text);
  }

  const theme = sanitizeTheme({ background: resolvedBackground, surface, primary, accent, text, muted, border });
  const changes = THEME_TOKENS
    .filter((token) => token.key !== changed && theme[token.key].toLowerCase() !== locked[token.key].toLowerCase())
    .map((token) => ({
      token: token.key,
      label: token.label,
      name: paletteColor(theme[token.key])?.name ?? theme[token.key],
    }));
  if (changes.length === 0) return null;

  const chosen = paletteColor(locked[changed]);
  const light = luminance(locked[changed]) > 0.45;
  return {
    theme,
    changes,
    reason: `${chosen?.name ?? 'This colour'} is ${light ? 'light' : 'dark'}, so the other roles are paired to keep text readable and actions easy to see.`,
  };
}

export function usePageTheme(pageId: string): PageTheme {
  const all = useSyncExternalStore(subscribePageThemes, getPageThemes, getPageThemes);
  return sanitizeTheme(all[pageId as ThemePageId]);
}

function onPrimary(hex: string) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return '#FFFFFF';
  const n = parseInt(match[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.72 ? '#1A1A1A' : '#FFFFFF';
}

export function themeStyle(theme: PageTheme): CSSProperties {
  return {
    backgroundColor: 'var(--pt-bg)',
    ['--pt-bg' as string]: theme.background,
    ['--pt-surface' as string]: theme.surface,
    ['--pt-primary' as string]: theme.primary,
    ['--pt-accent' as string]: theme.accent,
    ['--pt-text' as string]: theme.text,
    ['--pt-muted' as string]: theme.muted,
    ['--pt-border' as string]: theme.border,
    ['--pt-on-primary' as string]: onPrimary(theme.primary),
  };
}
