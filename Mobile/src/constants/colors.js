import { useTheme, THEME_MODES } from "../contexts/ThemeContext";

export const COLORS = {
  // ─── Primary — Rose Gold / Pink ──────────────────────────
  PRIMARY: '#ef5e83',
  PRIMARY_LIGHT: '#ffb2bf',
  PRIMARY_DARK: '#660028',
  PRIMARY_GLOW: 'rgba(255, 178, 191, 0.25)',
  PRIMARY_GLOW_STRONG: 'rgba(255, 178, 191, 0.4)',

  // ─── Accent ─────────────────────────────────────────────
  GOLD: '#FFB84D',
  PEACH: '#FFD4B2',
  ROSE_MIST: '#FFE4EA',

  // ─── Dark Theme (Auth screens) ──────────────────────────
  DARK_BG: '#161311',
  DARK_CARD: 'rgba(31, 27, 25, 0.8)',
  DARK_CARD_SOLID: '#1f1b19',
  DARK_INPUT_BG: '#1a1614',
  DARK_BORDER: '#514541',
  DARK_BORDER_LIGHT: 'rgba(232, 89, 126, 0.2)',
  DARK_TEXT: '#f3eeeb',
  DARK_TEXT_SECONDARY: '#d3c3bd',

  // ─── Light Theme (Main app screens) ─────────────────────
  BG: '#FFF5F7',
  CARD: '#FFFFFF',
  CARD_BORDER: '#F0E2E6',
  TEXT: '#1A0F14',
  TEXT_SECONDARY: '#8B7B80',
  TEXT_MUTED: '#B8A6AC',

  // ─── Tab Bar ────────────────────────────────────────────
  TAB_BG: '#F7F6F6',
  TAB_ACTIVE: '#9C6B4E',
  TAB_ACTIVE_BG: '#F2F1F1',
  TAB_INACTIVE: '#B8A6AC',
  TAB_BORDER: 'rgba(255, 255, 255, 0.8)',
  TAB_SHADOW: 'rgba(0, 0, 0, 0.06)',

  // ─── Status Colors ──────────────────────────────────────
  INCOME: '#2A9D8F',
  INCOME_LIGHT: '#E8F5F3',
  EXPENSE: '#E76F51',
  EXPENSE_LIGHT: '#FDE8E3',
  WARNING: '#FFB84D',
  WARNING_LIGHT: '#FFF3E0',
  INFO: '#6B9BD2',
  INFO_LIGHT: '#E8F0FE',

  // ─── Chat Bot UI ────────────────────────────────────────
  CHAT_BG: '#FFF7FC',
  CHAT_PURPLE: '#8B3DFF',
  CHAT_PURPLE_DARK: '#6D22E8',
  CHAT_PURPLE_LIGHT: '#F1E5FF',
  CHAT_PURPLE_SOFT: '#F3E9FF',
  CHAT_PINK: '#FF8BDD',
  CHAT_BORDER: 'rgba(139, 61, 255, 0.16)',
  CHAT_SHADOW: 'rgba(139, 61, 255, 0.18)',
  CHAT_TEXT: '#14071F',
  CHAT_MUTED: '#91859D',
  CHAT_BUBBLE: '#FFFFFF',

  // ─── Utility ────────────────────────────────────────────
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  OVERLAY: 'rgba(0, 0, 0, 0.5)',
  TRANSPARENT: 'transparent',
};

export const DARK_COLORS = {
  ...COLORS,

  // ─── Override for Dark Mode ─────────────────────────────
  BG: '#0F0D0C',
  CARD: '#1A1817',
  CARD_BORDER: '#2E2A28',
  TEXT: '#F3EEEC',
  TEXT_SECONDARY: '#B8ACA6',
  TEXT_MUTED: '#7A6E68',

  TAB_BG: '#1A1817',
  TAB_ACTIVE: '#E8A87C',
  TAB_ACTIVE_BG: '#2A2624',
  TAB_INACTIVE: '#7A6E68',
  TAB_BORDER: 'rgba(255, 255, 255, 0.06)',
  TAB_SHADOW: 'rgba(0, 0, 0, 0.3)',

  CHAT_BG: '#0F0A0F',
  CHAT_BORDER: 'rgba(139, 61, 255, 0.12)',
  CHAT_SHADOW: 'rgba(139, 61, 255, 0.08)',
  CHAT_TEXT: '#F3EEEC',
  CHAT_MUTED: '#8B7D90',
  CHAT_BUBBLE: '#1F1A1F',

  INCOME_LIGHT: '#1A2F2C',
  EXPENSE_LIGHT: '#2F1A18',
  WARNING_LIGHT: '#2F2418',
  INFO_LIGHT: '#18222F',

  ROSE_MIST: '#2A181E',
  OVERLAY: 'rgba(0, 0, 0, 0.7)',
};

/**
 * Returns the appropriate color palette based on current theme.
 * Use this hook in components to get theme-aware colors.
 */
export function useAppColors() {
  const { theme } = useTheme();
  return theme === THEME_MODES.DARK ? DARK_COLORS : COLORS;
}

