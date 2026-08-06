import type { RelationType } from '@/api/people';

/**
 * 마음 배달 콘텐츠 (docs/12 §2·§4·§5).
 * 익명은 준비 문구 선택형만 (결정로그 #37 — Gas 모델), 부정 감정은 중재 라우팅 (#29).
 */

export type LetterEmotion =
  | 'GRATITUDE'
  | 'FONDNESS'
  | 'APOLOGY'
  | 'RECONCILE'
  | 'CHEER'
  | 'MEMORY_KEEP'
  | 'GREETING'
  | 'ADMIRE'
  | 'RESENT'
  | 'ANGER';

export type LetterStatus = 'DELIVERED' | 'HEART_RECEIVED' | 'CONNECT_REQUESTED' | 'DECLINED';

export const LetterEmotionMeta: Record<
  LetterEmotion,
  { emoji: string; label: string; deliverable: boolean; tone: 'warm' | 'calm' }
> = {
  GRATITUDE: { emoji: '🌷', label: '고마움', deliverable: true, tone: 'warm' },
  FONDNESS: { emoji: '💛', label: '호감', deliverable: true, tone: 'warm' },
  APOLOGY: { emoji: '🕊️', label: '미안함', deliverable: true, tone: 'calm' },
  RECONCILE: { emoji: '🧵', label: '화해·오해 풀기', deliverable: true, tone: 'calm' },
  CHEER: { emoji: '📣', label: '응원', deliverable: true, tone: 'warm' },
  MEMORY_KEEP: { emoji: '📸', label: '추억 간직', deliverable: true, tone: 'warm' },
  GREETING: { emoji: '👋', label: '안부', deliverable: true, tone: 'warm' },
  ADMIRE: { emoji: '🌟', label: '닮고 싶음', deliverable: true, tone: 'warm' },
  RESENT: { emoji: '🌧️', label: '서운함', deliverable: false, tone: 'calm' },
  ANGER: { emoji: '⛈️', label: '화남', deliverable: false, tone: 'calm' },
};

/** 준비 문구 — 익명 발신의 유일한 본문 (docs/12 §2 채택 + 추가분) */
export const PresetPhrases: Record<string, string[]> = {
  GRATITUDE: [
    '익명의 누군가가 당신에게 고마움을 느끼고 있습니다.',
    '익명의 누군가가 당신 덕분에 힘든 시기를 지나왔습니다.',
    '익명의 누군가가 당신에게 오래 전하지 못한 감사를 간직하고 있습니다.',
  ],
  FONDNESS: [
    '익명의 누군가가 당신에게 호감을 느끼고 있습니다.',
    '익명의 누군가가 당신을 오래 마음에 담아두고 있습니다.',
  ],
  APOLOGY: [
    '익명의 누군가가 당신께 용서를 구하고 싶어 합니다.',
    '익명의 누군가가 당신에게 미안한 마음을 오래 갖고 있습니다.',
  ],
  RECONCILE: [
    '익명의 누군가가 당신과 화해를 하고 싶습니다.',
    '익명의 누군가가 당신과 오해를 풀고 싶습니다.',
  ],
  CHEER: [
    '익명의 누군가가 당신에게 응원을 보내고 싶어 합니다.',
    '익명의 누군가가 당신이 잘 지내기를 바라고 있습니다.',
  ],
  MEMORY_KEEP: [
    '익명의 누군가가 당신과의 추억을 소중히 간직하고 있습니다.',
  ],
  GREETING: [
    '익명의 누군가가 당신의 안부를 궁금해합니다.',
  ],
  ADMIRE: [
    '익명의 누군가가 당신을 닮고 싶어 합니다.',
  ],
};

/** 직장 톤 팩 (docs/12 §17 — 동료 관계면 이 문구를 우선 노출) */
export const WorkplacePresetPhrases: Record<string, string[]> = {
  GRATITUDE: [
    '익명의 동료가 함께 일했던 시간에 감사하고 있습니다.',
    '익명의 동료가 당신의 도움 덕분에 어려운 시기를 넘겼다고 전합니다.',
  ],
  CHEER: ['익명의 동료가 당신의 새로운 시작을 응원합니다.'],
  ADMIRE: ['익명의 동료가 당신의 일하는 방식을 존경하고 있습니다.'],
};

const ADJECTIVES = ['용감한', '다정한', '조용한', '씩씩한', '느긋한', '반짝이는', '순한', '단단한'];
const ANIMALS = ['사자', '펭귄', '고래', '여우', '수달', '부엉이', '판다', '돌고래'];

/** 익명 닉네임 — 수신자별로 달라야 발신자 특정을 막는다 (docs/12 §5) */
export function anonymousNickname(personId: number): string {
  const a = ADJECTIVES[(personId * 7 + 3) % ADJECTIVES.length];
  const b = ANIMALS[(personId * 5 + 1) % ANIMALS.length];
  return `${a} ${b}`;
}

export function presetsFor(emotion: LetterEmotion, relationType?: RelationType): string[] {
  const base = PresetPhrases[emotion] ?? [];
  if (relationType === 'COLLEAGUE') {
    return [...(WorkplacePresetPhrases[emotion] ?? []), ...base];
  }
  return base;
}

export const ReactionLabels: Record<Exclude<LetterStatus, 'DELIVERED'>, string> = {
  HEART_RECEIVED: '마음만 받을게요',
  CONNECT_REQUESTED: '더 얘기하고 싶어요',
  DECLINED: '받고 싶지 않아요',
};
