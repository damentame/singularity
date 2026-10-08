import React, { useState } from 'react';
import { Download, Palette, RotateCcw, Trash2 } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import CoordinatorHeader from './CoordinatorHeader';
import {
  APP_PALETTE,
  THEME_PAGES,
  THEME_TOKENS,
  ThemePageId,
  ThemeToken,
  applyPageTheme,
  deleteThemeTemplate,
  exportThemeBundle,
  paletteColor,
  resetPageTheme,
  saveThemeTemplate,
  setPageToken,
  suggestTheme,
  themeStyle,
  usePageTheme,
  useThemeTemplates,
} from '@/theme/pageTheme';

const ThemeStudio: React.FC = () => {
  const { setCurrentView } = useAppContext();
  const studioTheme = usePageTheme('theme-studio');
  const [pageId, setPageId] = useState<ThemePageId>('coordinator-dashboard');
  const [focusToken, setFocusToken] = useState<ThemeToken>('background');
  const [touched, setTouched] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const theme = usePageTheme(pageId);
  const templates = useThemeTemplates();
  const suggestion = touched ? suggestTheme(theme, focusToken) : null;
  const page = THEME_PAGES.find((item) => item.id === pageId) ?? THEME_PAGES[0];

  const openPage = () => {
    if (pageId === 'theme-studio') return;
    setCurrentView(pageId);
  };

  const saveTemplate = () => {
    saveThemeTemplate(templateName, theme);
    setTemplateName('');
  };

  const exportTemplates = () => {
    const blob = new Blob([JSON.stringify(exportThemeBundle(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'singularity-theme-templates.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen" style={themeStyle(studioTheme)}>
      <CoordinatorHeader title="Theme studio" onBack={() => setCurrentView('coordinator-dashboard')} backLabel="Events" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--pt-accent)' }}>
            Admin
          </p>
          <h1 className="text-3xl font-light mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: 'var(--pt-text)' }}>
            Page themes
          </h1>
          <p className="text-sm max-w-2xl" style={{ color: 'var(--pt-muted)' }}>
            Assign the app’s existing colours to each page. Background, surface, primary, accent, text, muted, and border can only use this palette.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          <div className="rounded-2xl border p-2 h-fit" style={{ backgroundColor: 'var(--pt-surface)', borderColor: 'var(--pt-border)' }}>
            {THEME_PAGES.map((item) => {
              const selected = item.id === pageId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setPageId(item.id); setTouched(false); }}
                  className="w-full text-left rounded-xl px-3 py-3"
                  style={{
                    backgroundColor: selected ? 'var(--pt-primary)' : 'transparent',
                    color: selected ? 'var(--pt-on-primary)' : 'var(--pt-text)',
                  }}
                >
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="block text-[11px] mt-0.5" style={{ color: selected ? 'var(--pt-on-primary)' : 'var(--pt-muted)' }}>
                    {item.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--pt-surface)', borderColor: 'var(--pt-border)' }}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: 'var(--pt-text)' }}>
                    {page.label}
                  </h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--pt-muted)' }}>{page.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => resetPageTheme(pageId)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] uppercase tracking-wider border"
                  style={{ borderColor: 'var(--pt-border)', color: 'var(--pt-muted)' }}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>

              <div className="space-y-5">
                {THEME_TOKENS.map((token) => {
                  const selected = paletteColor(theme[token.key]);
                  return (
                    <div key={token.key}>
                      <div className="flex items-baseline justify-between gap-3 mb-2">
                        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--pt-muted)' }}>
                          {token.label}
                          <span className="normal-case tracking-normal ml-2">{token.hint}</span>
                        </span>
                        <span className="text-xs" style={{ color: 'var(--pt-text)' }}>{selected?.name ?? 'Default'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {APP_PALETTE.map((color) => {
                          const active = selected?.id === color.id;
                          return (
                            <button
                              key={color.id}
                              type="button"
                              title={color.name}
                              aria-label={`${token.label}: ${color.name}`}
                              aria-pressed={active}
                              onClick={() => {
                                setTouched(true);
                                setFocusToken(token.key);
                                setPageToken(pageId, token.key, color.hex);
                              }}
                              className="w-7 h-7 rounded-full border-2"
                              style={{
                                backgroundColor: color.hex,
                                borderColor: active ? 'var(--pt-text)' : 'var(--pt-border)',
                                boxShadow: active ? '0 0 0 2px var(--pt-surface)' : undefined,
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {suggestion && (
              <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--pt-surface)', borderColor: 'var(--pt-border)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-2" style={{ color: 'var(--pt-accent)' }}>
                  Suggested pairing
                </p>
                <p className="text-sm mb-3" style={{ color: 'var(--pt-text)' }}>{suggestion.reason}</p>
                <p className="text-xs mb-4" style={{ color: 'var(--pt-muted)' }}>
                  {suggestion.changes.map((change) => `${change.label} → ${change.name}`).join(' · ')}
                </p>
                <button
                  type="button"
                  onClick={() => applyPageTheme(pageId, suggestion.theme)}
                  className="px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider"
                  style={{ backgroundColor: 'var(--pt-primary)', color: 'var(--pt-on-primary)' }}
                >
                  Apply suggestion
                </button>
              </div>
            )}

            <div className="rounded-2xl border p-5" style={{ backgroundColor: theme.background, borderColor: theme.border }}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: theme.accent }}>Preview</p>
                  <h3 className="text-2xl font-light mt-1" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: theme.text }}>
                    {page.label}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: theme.muted }}>This is how the chosen colours sit together.</p>
                </div>
                {pageId !== 'theme-studio' && (
                  <button
                    type="button"
                    onClick={openPage}
                    className="px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider"
                    style={{ backgroundColor: theme.primary, color: onColor(theme.primary) }}
                  >
                    Open page
                  </button>
                )}
              </div>
              <div className="rounded-xl border p-4" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2" style={{ color: theme.accent }}>Section title</p>
                <p className="text-sm mb-3" style={{ color: theme.text }}>Surface card on the page background.</p>
                <div className="h-px mb-3" style={{ backgroundColor: theme.border }} />
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider"
                  style={{ backgroundColor: theme.primary, color: onColor(theme.primary) }}
                >
                  <Palette className="w-3.5 h-3.5 inline mr-1.5" />
                  Primary action
                </button>
              </div>
            </div>

            <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--pt-surface)', borderColor: 'var(--pt-border)' }}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: 'var(--pt-text)' }}>
                    Saved templates
                  </h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--pt-muted)' }}>
                    Stored in this browser. Export the file when a developer should build the theme in.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={exportTemplates}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] uppercase tracking-wider border"
                  style={{ borderColor: 'var(--pt-border)', color: 'var(--pt-text)' }}
                >
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
              <div className="flex gap-2 mb-4">
                <input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name"
                  className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--pt-border)', color: 'var(--pt-text)', backgroundColor: 'var(--pt-bg)' }}
                />
                <button
                  type="button"
                  onClick={saveTemplate}
                  disabled={!templateName.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider disabled:opacity-40"
                  style={{ backgroundColor: 'var(--pt-primary)', color: 'var(--pt-on-primary)' }}
                >
                  Save
                </button>
              </div>
              {templates.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--pt-muted)' }}>No templates yet. Save the colours on this page to keep them.</p>
              ) : (
                <div className="space-y-2">
                  {templates.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl border px-3 py-2.5" style={{ borderColor: 'var(--pt-border)' }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate" style={{ color: 'var(--pt-text)' }}>{item.name}</p>
                        <div className="flex gap-1 mt-1.5">
                          {(['background', 'surface', 'primary', 'accent', 'text'] as const).map((token) => (
                            <span key={token} className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: item.theme[token], borderColor: 'var(--pt-border)' }} />
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => applyPageTheme(pageId, item.theme)}
                        className="text-[11px] uppercase tracking-wider"
                        style={{ color: 'var(--pt-accent)' }}
                      >
                        Apply
                      </button>
                      <button type="button" onClick={() => deleteThemeTemplate(item.id)} aria-label={`Delete ${item.name}`} style={{ color: 'var(--pt-muted)' }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function onColor(hex: string) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return '#FFFFFF';
  const n = parseInt(match[1], 16);
  const luminance = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return luminance > 0.72 ? '#1A1A1A' : '#FFFFFF';
}

export default ThemeStudio;
