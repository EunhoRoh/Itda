import type { EmotionTag, MemoryCategory, RelationStatus, RelationType } from '@/api/people';

export const RelationTypeLabels: Record<RelationType, string> = {
  FAMILY: '가족',
  FRIEND: '친구',
  PARTNER: '연인',
  MENTOR: '은사',
  COLLEAGUE: '동료',
  OTHER: '인연',
};

export const RelationStatusLabels: Record<RelationStatus, string> = {
  CONNECTED: '이어진 관계',
  DRIFTED: '멀어진 관계',
  ESTRANGED: '틀어진 관계',
};

export const MemoryCategoryLabels: Record<MemoryCategory, { emoji: string; label: string }> = {
  TRAVEL: { emoji: '🧳', label: '함께한 여행' },
  SCHOOL_DAYS: { emoji: '🏫', label: '학창 시절' },
  FOOD: { emoji: '🍜', label: '같이 먹던 것' },
  LAUGHTER: { emoji: '😂', label: '웃었던 일' },
  HELP: { emoji: '🤝', label: '도와준 일' },
  ACHIEVEMENT: { emoji: '🏆', label: '함께 이룬 것' },
  DAILY: { emoji: '☕', label: '사소한 일상' },
  GIFT: { emoji: '🎁', label: '선물' },
  CUSTOM: { emoji: '✏️', label: '기록' },
};

export const EmotionTagLabels: Record<EmotionTag, string> = {
  LONGING: '그리움',
  GRATITUDE: '고마움',
  SORRY: '미안함',
  JOY: '즐거움',
  REGRET: '아쉬움',
};
