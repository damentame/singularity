import type React from 'react';

export const GOLD = 'var(--pt-primary, #C9A24A)';
export const SURFACE = 'var(--pt-surface, #FFFCF7)';
export const TEXT = 'var(--pt-text, #1A1A1A)';
export const MUTED = 'var(--pt-muted, #8A8175)';
export const BORDER = 'var(--pt-border, #D4CFC6)';

export const glassCard: React.CSSProperties = {
  backgroundColor: 'color-mix(in srgb, var(--pt-surface, #FFFCF7) 88%, transparent)',
  border: '1px solid var(--pt-border, #D4CFC6)',
  backdropFilter: 'blur(14px) saturate(140%)',
  WebkitBackdropFilter: 'blur(14px) saturate(140%)',
  boxShadow: '0 8px 24px rgba(26,26,26,0.04), inset 0 1px 0 rgba(255,255,255,0.65)',
};

export const glassCardHover: React.CSSProperties = {
  ...glassCard,
  backgroundColor: 'rgba(255,249,230,0.55)',
  borderColor: 'rgba(201,162,74,0.28)',
  boxShadow: '0 10px 28px rgba(201,162,74,0.10), inset 0 1px 0 rgba(255,255,255,0.65)',
  transform: 'translateY(-1px)',
};

export const ALLOWED_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif';
