import { Platform, useColorScheme } from 'react-native';

/**
 * Design tokens shared by every screen in the harness.
 *
 * The palettes are hand-tuned Material-3-ish tones derived from the deep
 * violet seed `#4C2FD0` used by the Sahha Flutter example app — deliberately
 * not the stock blue so the test harness is recognisable at a glance on a
 * device full of demo apps.
 */
export interface AppTheme {
  isDark: boolean;
  colors: {
    primary: string;
    onPrimary: string;
    primaryContainer: string;
    onPrimaryContainer: string;
    secondaryContainer: string;
    onSecondaryContainer: string;
    tertiaryContainer: string;
    onTertiaryContainer: string;
    background: string;
    surface: string;
    surfaceVariant: string;
    onSurface: string;
    onSurfaceVariant: string;
    outline: string;
    outlineVariant: string;
    error: string;
    onError: string;
    errorContainer: string;
    onErrorContainer: string;
    success: string;
    successContainer: string;
    onSuccessContainer: string;
    warning: string;
    warningContainer: string;
    onWarningContainer: string;
  };
  /** Corner radii: cards, smaller controls, fully rounded pills. */
  radius: { card: number; control: number; pill: number };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  /** Font family used for JSON / raw API output. */
  mono: string;
}

const lightColors: AppTheme['colors'] = {
  primary: '#4C2FD0',
  onPrimary: '#FFFFFF',
  primaryContainer: '#E5DEFF',
  onPrimaryContainer: '#1B0A63',
  secondaryContainer: '#E4DFF4',
  onSecondaryContainer: '#1D1A2C',
  tertiaryContainer: '#FFD8EC',
  onTertiaryContainer: '#36071F',
  background: '#FDFBFF',
  surface: '#FFFFFF',
  surfaceVariant: '#E6E0EC',
  onSurface: '#1C1B1F',
  onSurfaceVariant: '#49454F',
  outline: '#79747E',
  outlineVariant: '#CAC4D0',
  error: '#B3261E',
  onError: '#FFFFFF',
  errorContainer: '#F9DEDC',
  onErrorContainer: '#410E0B',
  success: '#2E7D32',
  successContainer: '#D7F2D8',
  onSuccessContainer: '#0B3D12',
  warning: '#B26500',
  warningContainer: '#FFE2BE',
  onWarningContainer: '#3E2200',
};

const darkColors: AppTheme['colors'] = {
  primary: '#C9BEFF',
  onPrimary: '#2C0F87',
  primaryContainer: '#3A24A5',
  onPrimaryContainer: '#E5DEFF',
  secondaryContainer: '#443F55',
  onSecondaryContainer: '#E4DFF4',
  tertiaryContainer: '#633B4C',
  onTertiaryContainer: '#FFD8EC',
  background: '#141218',
  surface: '#1D1B22',
  surfaceVariant: '#2E2A35',
  onSurface: '#E6E1E9',
  onSurfaceVariant: '#CAC4D0',
  outline: '#938F99',
  outlineVariant: '#38343D',
  error: '#F2B8B5',
  onError: '#601410',
  errorContainer: '#8C1D18',
  onErrorContainer: '#F9DEDC',
  success: '#7FD98A',
  successContainer: '#1E4620',
  onSuccessContainer: '#C6EFC8',
  warning: '#FFB870',
  warningContainer: '#4A2E00',
  onWarningContainer: '#FFDEB8',
};

const radius: AppTheme['radius'] = { card: 16, control: 12, pill: 999 };

const spacing: AppTheme['spacing'] = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

const mono: string = Platform.select({ ios: 'Menlo', default: 'monospace' });

export const lightTheme: AppTheme = {
  isDark: false,
  colors: lightColors,
  radius,
  spacing,
  mono,
};

export const darkTheme: AppTheme = {
  isDark: true,
  colors: darkColors,
  radius,
  spacing,
  mono,
};

/** Resolves the palette for the current system colour scheme. */
export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
