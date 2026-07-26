import React from 'react';
import { ItemCategory } from '@/contexts/EventContext';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

const s = {
  fill: 'none',
  strokeWidth: '1.8',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

// Chair side profile
const FurnitureIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} {...s} className={className}>
    <line x1="5" y1="14" x2="19" y2="14" />
    <line x1="6" y1="14" x2="6" y2="21" />
    <line x1="18" y1="14" x2="18" y2="21" />
    <line x1="15" y1="14" x2="15" y2="7" />
    <line x1="15" y1="7" x2="19" y2="7" />
  </svg>
);

// Hanging pendant lamp with cord
const LightingIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} {...s} className={className}>
    <line x1="12" y1="2" x2="12" y2="6" />
    <path d="M7 6 L6 15 L18 15 L17 6 Z" />
    <circle cx="12" cy="10.5" r="1.8" />
  </svg>
);

// Four-petal flower with stem
const FloralsIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} {...s} className={className}>
    <circle cx="12" cy="11" r="2" />
    <path d="M12 9 C13.2 6.5 14 4 12 4 C10 4 10.8 6.5 12 9" />
    <path d="M14 11 C16.5 9.8 19 9 19 11 C19 13 16.5 12.2 14 11" />
    <path d="M12 13 C10.8 15.5 10 18 12 18 C14 18 13.2 15.5 12 13" />
    <path d="M10 11 C7.5 12.2 5 13 5 11 C5 9 7.5 9.8 10 11" />
    <line x1="12" y1="18" x2="12" y2="22" />
  </svg>
);

// Single person with head + torso + arms + legs
const StaffingIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} {...s} className={className}>
    <circle cx="12" cy="6" r="3" />
    <line x1="12" y1="9" x2="12" y2="17" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="12" y1="17" x2="9" y2="21" />
    <line x1="12" y1="17" x2="15" y2="21" />
  </svg>
);

// Standing microphone with sound arcs
const EntertainmentIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} {...s} className={className}>
    <rect x="9" y="3" width="6" height="9" rx="3" />
    <path d="M6 10 A6 4 0 0 0 18 10" />
    <line x1="12" y1="14" x2="12" y2="19" />
    <line x1="8" y1="19" x2="16" y2="19" />
  </svg>
);

// Camera body with lens
const PhotoVideoIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} {...s} className={className}>
    <rect x="3" y="8" width="18" height="13" rx="2" />
    <path d="M9 8 L9 5 L15 5 L15 8" />
    <circle cx="12" cy="14.5" r="4" />
    <circle cx="12" cy="14.5" r="1.5" />
  </svg>
);

// Food cloche with dome and handle
const CateringIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} {...s} className={className}>
    <path d="M4 14 A8 7 0 0 1 20 14" />
    <line x1="3" y1="14" x2="21" y2="14" />
    <line x1="5" y1="17" x2="19" y2="17" />
    <line x1="12" y1="14" x2="12" y2="11" />
    <circle cx="12" cy="10" r="1.5" />
  </svg>
);

// Martini / cocktail glass
const BeveragesIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} {...s} className={className}>
    <line x1="5" y1="5" x2="19" y2="5" />
    <line x1="5" y1="5" x2="12" y2="16" />
    <line x1="19" y1="5" x2="12" y2="16" />
    <line x1="12" y1="16" x2="12" y2="21" />
    <line x1="8" y1="21" x2="16" y2="21" />
  </svg>
);

// 4-point sparkle star
const DecorIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} {...s} className={className}>
    <path d="M12 2 L13.8 10.2 L22 12 L13.8 13.8 L12 22 L10.2 13.8 L2 12 L10.2 10.2 Z" />
  </svg>
);

// Envelope with V-fold flap
const StationeryIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} {...s} className={className}>
    <rect x="3" y="6" width="18" height="14" rx="2" />
    <path d="M3 6 L12 14 L21 6" />
  </svg>
);

// Speaker box with cone and sound waves
const AVTechnicalIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} {...s} className={className}>
    <rect x="4" y="3" width="11" height="18" rx="1.5" />
    <circle cx="9.5" cy="13" r="3.5" />
    <circle cx="9.5" cy="13" r="1.2" />
    <circle cx="9.5" cy="6" r="1.5" />
    <path d="M19 9 Q22 12 19 15" />
    <path d="M17 7 Q21 12 17 17" />
  </svg>
);

// Car side silhouette
const TransportIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} {...s} className={className}>
    <path d="M3 16 H21 V13 L17 8 L7 8 L3 13 Z" />
    <path d="M7 8 L8.5 13 L15.5 13 L17 8" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

const ICONS: Partial<Record<ItemCategory, React.FC<IconProps>>> = {
  furniture: FurnitureIcon,
  linen: FurnitureIcon,
  lighting: LightingIcon,
  florals: FloralsIcon,
  staffing: StaffingIcon,
  entertainment: EntertainmentIcon,
  photo_video: PhotoVideoIcon,
  catering: CateringIcon,
  beverages: BeveragesIcon,
  decor: DecorIcon,
  stationery: StationeryIcon,
  av_technical: AVTechnicalIcon,
  transport: TransportIcon,
};

interface CategoryIconProps extends IconProps {
  category: ItemCategory;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ category, size = 16, color = 'currentColor', className }) => {
  const Icon = ICONS[category];
  if (!Icon) return null;
  return <Icon size={size} color={color} className={className} />;
};

export default CategoryIcon;
