/**
 * App colors, matched to the CivilPrep website. Light and dark variants.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0f172a',
    background: '#f8fafc',
    backgroundElement: '#ffffff',
    backgroundSelected: '#e2e8f0',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    brand: '#ea580c',
    onBrand: '#ffffff',
    good: '#16a34a',
    warn: '#ca8a04',
    bad: '#dc2626',
  },
  dark: {
    text: '#e2e8f0',
    background: '#0b1120',
    backgroundElement: '#111827',
    backgroundSelected: '#1f2937',
    textSecondary: '#94a3b8',
    border: '#1f2937',
    brand: '#fb923c',
    onBrand: '#0b1120',
    good: '#22c55e',
    warn: '#eab308',
    bad: '#f87171',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 640;

export function masteryColor(m: number, c: (typeof Colors)['light' | 'dark']) {
  return m >= 0.7 ? c.good : m >= 0.55 ? c.warn : c.bad;
}
