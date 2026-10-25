/**
 * Design System: Centralized theme tokens for the MediConnect app.
 * Professional, clean medical UI palette – no cartoonish elements.
 */

export const Colors = {
  // Primary brand palette – deep teal/slate
  primary: {
    50:  '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',  // brand primary
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Neutral greys (backgrounds, text, borders)
  neutral: {
    0:   '#ffffff',
    50:  '#f8fafc',
    100: '#f1f5f9',
    150: '#eef2f7',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Semantic colours
  success: {
    light: '#dcfce7',
    main:  '#22c55e',
    dark:  '#15803d',
  },
  warning: {
    light: '#fef9c3',
    main:  '#eab308',
    dark:  '#a16207',
  },
  error: {
    light: '#fee2e2',
    main:  '#ef4444',
    dark:  '#b91c1c',
  },
  info: {
    light: '#dbeafe',
    main:  '#3b82f6',
    dark:  '#1d4ed8',
  },

  // Severity levels (triage)
  severity: {
    low:      '#22c55e',
    moderate: '#eab308',
    high:     '#f97316',
    critical: '#ef4444',
  },

  // Common shorthands
  white:       '#ffffff',
  black:       '#0f172a',
  transparent: 'transparent',
};

export const Typography = {
  fontFamily: {
    regular:  'Inter_400Regular',
    medium:   'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold:     'Inter_700Bold',
  },
  fontSize: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   16,
    lg:   18,
    xl:   20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },
  lineHeight: {
    tight:   1.25,
    normal:  1.5,
    relaxed: 1.75,
  },
};

export const Spacing = {
  0:   0,
  1:   4,
  2:   8,
  3:   12,
  4:   16,
  5:   20,
  6:   24,
  7:   28,
  8:   32,
  10:  40,
  12:  48,
  16:  64,
  20:  80,
};

export const BorderRadius = {
  none: 0,
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Convenience alias used throughout screens
export const theme = { Colors, Typography, Spacing, BorderRadius, Shadows };
export default theme;
