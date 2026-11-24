/**
 * Domora AI — Design Tokens & TypeScript Types
 * Aesthetic Direction: Architectural Editorial Luxury
 * Spacing base: 8pt grid
 */

export const DOMORA_COLORS = {
  porcelain: '#F5EBDF',
  porcelainSurface: '#FAF5EE',
  porcelainMuted: '#EDE0D0',
  terracotta: '#8C4A3D',
  terracottaHover: '#753B30',
  sandstone: '#C5A88A',
  sandstoneLight: '#DFCDB8',
  olive: '#6F795E',
  oliveLight: '#E5E9DF',
  charcoal: '#262824',
  charcoalMuted: '#5A5C56',
  amber: '#B57B3A',
  amberLight: '#F3E6D4',
} as const;

export type DomoraColorToken = keyof typeof DOMORA_COLORS;

export const DOMORA_TYPOGRAPHY = {
  display: 'var(--font-display)',
  sans: 'var(--font-sans)',
  mono: 'var(--font-mono)',
} as const;

export const DOMORA_SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

export const DOMORA_RADII = {
  none: '0px',
  sm: '2px',
  md: '4px',
  lg: '8px',
} as const;

export const DOMORA_MOTION = {
  durationFast: 0.16,
  durationBase: 0.28,
  durationSlow: 0.45,
  easeEditorial: [0.22, 1, 0.36, 1] as const,
} as const;

export const UNIT_VISUAL_STATES = {
  OCCUPIED: {
    label: 'Occupied',
    fill: DOMORA_COLORS.olive,
    fillMuted: DOMORA_COLORS.oliveLight,
    stroke: DOMORA_COLORS.olive,
    text: '#FAF5EE',
  },
  VACANT: {
    label: 'Vacant',
    fill: DOMORA_COLORS.porcelainSurface,
    fillMuted: DOMORA_COLORS.porcelain,
    stroke: DOMORA_COLORS.sandstone,
    text: DOMORA_COLORS.charcoal,
  },
  MAINTENANCE: {
    label: 'Maintenance Required',
    fill: DOMORA_COLORS.terracotta,
    fillMuted: '#F2E2DF',
    stroke: DOMORA_COLORS.terracotta,
    text: '#FAF5EE',
  },
  EXPIRING_SOON: {
    label: 'Lease Expiring Soon',
    fill: DOMORA_COLORS.amber,
    fillMuted: DOMORA_COLORS.amberLight,
    stroke: DOMORA_COLORS.amber,
    text: '#FAF5EE',
  },
} as const;

export type UnitVisualStateKey = keyof typeof UNIT_VISUAL_STATES;
