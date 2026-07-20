/**
 * 잇다 디자인 토큰 — 원본 스펙: docs/assets/ui-mockup.html (변경 시 목업과 함께 갱신)
 * 화면에서 hex/px 하드코딩 금지, 반드시 이 토큰을 사용한다 (CLAUDE.md).
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#33291F',
    background: '#FBF7F2',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F6E3DA',
    textSecondary: '#8A7C6C',
    border: '#EBE2D6',
    coral: '#D96B4A',
    coralSoft: '#F6E3DA',
    green: '#3D5A4C',
    greenSoft: '#E2EAE4',
    onAccent: '#FFFFFF',
  },
  dark: {
    text: '#EFE7DC',
    background: '#221D17',
    backgroundElement: '#2E2820',
    backgroundSelected: '#4A342A',
    textSecondary: '#A2937F',
    border: '#3C342A',
    coral: '#E08163',
    coralSoft: '#4A342A',
    green: '#7FA08F',
    greenSoft: '#2E3B34',
    onAccent: '#221D17',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** 관계 상태 색 — RelationStatus(백엔드 enum)와 1:1 (docs/04 §1) */
export const StatusColors = {
  light: {
    CONNECTED: '#4E7D5B', // 이어진 관계
    DRIFTED: '#C99A3C', // 멀어진 관계
    ESTRANGED: '#B65454', // 틀어진 관계
  },
  dark: {
    CONNECTED: '#7CA98A',
    DRIFTED: '#D9B06A',
    ESTRANGED: '#CC7A7A',
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** 감성 카피(용기 부스터 등)에만 사용 — docs/08 디자인 방향 */
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
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

export const Radius = {
  chip: 999,
  button: 14,
  card: 22,
  sheet: 28,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
