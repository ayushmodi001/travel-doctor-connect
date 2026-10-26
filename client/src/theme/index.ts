/**
 * Design System: Centralized theme tokens for MediConnect.
 * Modern clinical & travel companion aesthetic:
 * Clean slate canvas, clinical azure & medical teal primary palette,
 * emerald health accents, refined elevation, and crisp typography.
 */

export const Colors = {
  // Primary brand palette – Clinical Azure & Deep Ocean
  primary: {
    50:  '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0284C7', // Signature Clinical Ocean Azure
    600: '#0369A1',
    700: '#075985',
    800: '#0C4A6E',
    900: '#082F49',
  },

  // Medical Teal & Sage (cards, badges, verified accents)
  teal: {
    50:    '#F0FDFA',
    light: '#CCFBF1',
    main:  '#0D9488', // Medical Teal
    dark:  '#0F766E',
  },

  // Sage Green (verified doctors, ratings, health metrics)
  sage: {
    50:    '#F0FDF4',
    light: '#DCFCE7',
    main:  '#16A34A', // Clinical Emerald
    dark:  '#15803D',
  },

  // Coral & Terracotta accents
  terracotta: {
    50:    '#FFF7ED',
    light: '#FFEDD5',
    main:  '#EA580C',
    dark:  '#C2410C',
  },

  // Backward compatibility aliases
  coral: {
    50:    '#FFF7ED',
    light: '#FFEDD5',
    main:  '#EA580C',
    dark:  '#C2410C',
  },
  mint: {
    50:    '#F0FDF4',
    light: '#DCFCE7',
    main:  '#16A34A',
    dark:  '#15803D',
  },

  // Amber Ochre (pending states, triage warnings, notes)
  ochre: {
    50:    '#FFFBEB',
    light: '#FEF3C7',
    main:  '#D97706',
    dark:  '#B45309',
  },

  // Neutral palette – Crisp Clinical Slate
  neutral: {
    0:   '#FFFFFF',
    50:  '#F8FAFC', // Slate background canvas
    100: '#F1F5F9', // Light surface
    150: '#E2E8F0', // Hairline borders
    200: '#CBD5E1',
    300: '#94A3B8',
    400: '#64748B', // Soft muted text
    500: '#475569', // Secondary text
    600: '#334155',
    700: '#1E293B',
    800: '#0F172A',
    900: '#020617', // Primary deep slate text
  },

  // Semantic colours
  success: {
    light: '#DCFCE7',
    main:  '#16A34A',
    dark:  '#15803D',
  },
  warning: {
    light: '#FEF3C7',
    main:  '#D97706',
    dark:  '#B45309',
  },
  error: {
    light: '#FEF2F2',
    main:  '#DC2626',
    dark:  '#B91C1C',
  },
  info: {
    light: '#F0F9FF',
    main:  '#0284C7',
    dark:  '#0369A1',
  },

  // Severity levels (triage)
  severity: {
    low:      '#16A34A',
    moderate: '#D97706',
    high:     '#EA580C',
    critical: '#DC2626',
  },

  // Ticket card gradient – Deep Marine Azure & Slate Teal
  ticket: {
    start: '#0F766E',
    end:   '#0C4A6E',
  },

  // Shorthands
  canvas:      '#F8FAFC',
  card:        '#FFFFFF',
  white:       '#FFFFFF',
  black:       '#020617',
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
    xl:   21,
    '2xl': 25,
    '3xl': 29,
    '4xl': 34,
    '5xl': 42,
  },
  lineHeight: {
    tight:   1.2,
    normal:  1.45,
    relaxed: 1.7,
  },
  letterSpacing: {
    tight: -0.6,
    tighter: -1.0,
    normal: 0,
    wide: 0.4,
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
  sm:   6,
  md:   10,
  lg:   14,
  xl:   18,
  '2xl': 24,
  '3xl': 30,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  elevation: {
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  // Backward compatibility alias
  pinterest: {
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  iris: {
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const theme = { Colors, Typography, Spacing, BorderRadius, Shadows };
export default theme;
