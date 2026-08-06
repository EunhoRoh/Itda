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

/** prompt: 회상을 돕는 질문 — 기록 화면에서 카테고리 선택 직후 노출 + 메모 placeholder */
export const MemoryCategoryLabels: Record<
  MemoryCategory,
  { emoji: string; label: string; prompt: string }
> = {
  TRAVEL: { emoji: '🧳', label: '함께한 여행', prompt: '그 여행에서 예상 밖이라 더 기억나는 순간이 있나요?' },
  SCHOOL_DAYS: { emoji: '🏫', label: '학창 시절', prompt: '수업보다 선명하게 남은 쉬는 시간의 장면이 있나요?' },
  FOOD: { emoji: '🍜', label: '같이 먹던 것', prompt: '그 사람과 먹으면 유난히 맛있던 게 있나요?' },
  LAUGHTER: { emoji: '😂', label: '웃었던 일', prompt: '지금 떠올려도 피식 웃게 되는 장면은 뭔가요?' },
  HELP: { emoji: '🤝', label: '도와준 일', prompt: '가장 힘들던 시기, 그 사람이 해준 한마디나 행동이 있나요?' },
  ACHIEVEMENT: { emoji: '🏆', label: '함께 이룬 것', prompt: '둘이서 해냈다고 자랑하고 싶은 일이 있나요?' },
  DAILY: { emoji: '☕', label: '사소한 일상', prompt: '특별할 것 없는데 자꾸 생각나는 평범한 하루가 있나요?' },
  GIFT: { emoji: '🎁', label: '선물', prompt: '주고받은 것 중 아직 간직하고 있는 게 있나요?' },
  MUSIC: { emoji: '🎵', label: '함께 듣던 노래', prompt: '들으면 그 사람이 자동으로 떠오르는 노래가 있나요?' },
  PLACE: { emoji: '📍', label: '자주 가던 곳', prompt: '지나가면 그 사람 생각이 나는 장소가 있나요?' },
  SHOW: { emoji: '🎬', label: '같이 본 것', prompt: '같이 보며 울고 웃었던 영화·드라마·경기가 있나요?' },
  SPORTS: {
    emoji: '⚽',
    label: '같이 땀 흘린 기억',
    prompt: '같이 뛰거나 오르거나 연주하던 시간, 어떤 장면이 남아 있나요?',
  },
  TALK: { emoji: '🌙', label: '나눈 이야기', prompt: '밤늦게까지 이어졌던 대화의 주제가 기억나나요?' },
  JOKE: { emoji: '🤫', label: '둘만 아는 농담', prompt: '설명하면 재미없지만 둘은 아는 그 말, 뭐였나요?' },
  CUSTOM: { emoji: '✏️', label: '직접 입력', prompt: '떠오르는 대로 자유롭게 남겨 주세요.' },
};

export const EmotionTagLabels: Record<EmotionTag, string> = {
  LONGING: '그리움',
  GRATITUDE: '고마움',
  SORRY: '미안함',
  JOY: '즐거움',
  REGRET: '아쉬움',
};
