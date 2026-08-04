import type { Memory, Person, RelationType } from '@/api/people';
import { MemoryCategoryLabels } from '@/constants/labels';

/**
 * 관계 유형 × 상태별 미션 콘텐츠 팩.
 * 원칙(docs/04): 넛지는 연구 근거 기반, 죄책감 유발 금지, 틀어진 관계(ESTRANGED)는
 * 사과 6요소 중 '책임 인정'을 담되 용서를 요구하지 않는 톤 (docs/00 §1-3).
 */

export type TemplateKey = 'greeting' | 'memory' | 'honest';

export const TemplateLabels: Record<TemplateKey, string> = {
  greeting: '가벼운 안부',
  memory: '추억 소환',
  honest: '솔직하게',
};

type Tone = {
  greeting: (name: string) => string;
  // note는 추억 한 줄(예: "밤바다에서 라면 먹던 날") 또는 null — 각 톤이 완결 문장을 스스로 만든다
  memory: (name: string, note: string | null) => string;
  honest: (name: string) => string;
};

// 유형별 말투 — 가족/은사는 존대, 친구/연인은 반말, 동료/기타는 해요체
const TONES: Record<RelationType, Tone> = {
  FAMILY: {
    greeting: (n) => `${n}, 요즘 건강은 어떠세요? 문득 생각나서 연락드려요.`,
    memory: (n, note) =>
      note
        ? `${n}, 갑자기 ${note} 생각이 나서 연락드려요. 잘 지내시죠?`
        : `${n}, 문득 예전 생각이 나서 연락드려요. 잘 지내시죠?`,
    honest: (n) =>
      `${n}, 자주 연락 못 드려서 늘 마음에 걸렸어요. 목소리 듣고 싶어서 연락드려요.`,
  },
  FRIEND: {
    greeting: (n) => `${n}, 오랜만이야. 문득 생각나서 연락해봤어. 잘 지내지?`,
    memory: (n, note) =>
      note
        ? `${n}, 오랜만이야. 갑자기 ${note} 생각나서 연락해봤어. 잘 지내고 있지? 언제 한번 보자.`
        : `${n}, 오랜만이야. 문득 예전 생각이 나서 연락해봤어. 잘 지내고 있지? 언제 한번 보자.`,
    honest: (n) =>
      `${n}, 연락 못 한 지 너무 오래됐네. 계속 생각은 났는데 괜히 용기가 안 났어. 잘 지내는지 궁금해서 연락해봤어.`,
  },
  PARTNER: {
    greeting: (n) => `${n}, 잘 지냈어? 문득 생각이 나서. 부담 갖지 말고 편할 때 답해줘.`,
    memory: (n, note) =>
      note
        ? `${n}, 문득 ${note} 생각이 났어. 좋은 기억이라 그런지 안부가 궁금해지더라. 잘 지내지?`
        : `${n}, 문득 좋았던 기억들이 떠올랐어. 잘 지내길 바라는 마음에 연락해봤어.`,
    honest: (n) =>
      `${n}, 연락할까 말까 오래 고민하다 보내. 그냥 잘 지내는지 궁금했어. 답은 편할 때, 안 해도 괜찮아.`,
  },
  MENTOR: {
    greeting: (n) => `${n} 선생님, 오랜만에 인사드립니다. 문득 생각나서 연락드려요.`,
    memory: (n, note) =>
      note
        ? `${n} 선생님, 문득 ${note} 생각이 나서 연락드립니다. 그때 배운 게 아직도 남아 있어요. 건강하시죠?`
        : `${n} 선생님, 문득 그 시절 생각이 나서 연락드립니다. 늘 감사했습니다. 건강하시죠?`,
    honest: (n) =>
      `${n} 선생님, 진작 연락드린다는 게 이렇게 늦었습니다. 늘 감사한 마음이었어요. 건강하시죠?`,
  },
  COLLEAGUE: {
    greeting: (n) => `${n}님, 오랜만이에요. 문득 같이 일하던 때가 생각나서 연락드려요.`,
    memory: (n, note) =>
      note
        ? `${n}님, 문득 ${note} 생각이 나서 연락드려요. 같이 지내던 때가 그립네요. 요즘 어떻게 지내세요?`
        : `${n}님, 문득 같이 일하던 때 생각이 나서 연락드려요. 요즘 어떻게 지내세요?`,
    honest: (n) =>
      `${n}님, 헤어진 뒤로 연락 한번 못 드렸네요. 종종 생각났는데 이제야 용기 내요. 잘 지내시죠?`,
  },
  OTHER: {
    greeting: (n) => `${n}님, 오랜만이에요. 문득 생각나서 연락드려요. 잘 지내시죠?`,
    memory: (n, note) =>
      note
        ? `${n}님, 문득 ${note} 기억이 떠올라서 연락드려요. 안부가 궁금했어요.`
        : `${n}님, 문득 예전 생각이 나서 연락드려요. 안부가 궁금했어요.`,
    honest: (n) =>
      `${n}님, 오래 연락 못 드렸지만 종종 생각났어요. 잘 지내시는지 궁금해서 용기 내 연락드려요.`,
  },
};

// 틀어진 관계 전용 — 책임 인정(사과 6요소 1순위)을 담되, 용서·답장을 요구하지 않는다
const ESTRANGED_TONES: Record<'formal' | 'casual', Tone> = {
  casual: {
    greeting: (n) => `${n}, 오랜만이야. 불쑥 연락해서 놀랐지. 그냥 네 생각이 나서, 잘 지내는지 궁금했어.`,
    memory: (n, note) =>
      note
        ? `${n}, 문득 ${note} 기억이 떠올랐어. 우리 사이에 여러 일이 있었지만, 좋은 기억도 많았다는 걸 말하고 싶었어.`
        : `${n}, 문득 좋았던 기억들이 떠올랐어. 우리 사이에 여러 일이 있었지만, 좋은 기억도 많았다는 걸 말하고 싶었어.`,
    honest: (n) =>
      `${n}, 오래 고민하다 연락해. 그때 내가 서툴렀던 부분이 있었다는 걸 이제는 알아. 당장 뭘 바라는 건 아니고, 그 말을 전하고 싶었어. 답은 편할 때, 안 해도 괜찮아.`,
  },
  formal: {
    greeting: (n) => `${n}, 오랜만에 연락드려요. 갑작스러우시죠. 그냥 안부가 궁금했어요.`,
    memory: (n, note) =>
      note
        ? `${n}, 문득 ${note} 기억이 떠올랐어요. 여러 일이 있었지만 좋은 기억도 많았다는 말씀을 드리고 싶었어요.`
        : `${n}, 문득 좋았던 기억들이 떠올랐어요. 여러 일이 있었지만 좋은 기억도 많았다는 말씀을 드리고 싶었어요.`,
    honest: (n) =>
      `${n}, 오래 고민하다 연락드려요. 그때 제가 부족했던 부분이 있었다는 걸 이제는 압니다. 뭘 바라고 드리는 연락은 아니에요. 그 말씀을 꼭 전하고 싶었어요.`,
  },
};

const FORMAL_TYPES: RelationType[] = ['FAMILY', 'MENTOR', 'COLLEAGUE', 'OTHER'];

export function buildTemplates(person: Person, memory: Memory | null): Record<TemplateKey, string> {
  const name = person.nickname;
  const formal = FORMAL_TYPES.includes(person.relationType);
  const note = memory?.note ?? null;

  const tone =
    person.status === 'ESTRANGED'
      ? ESTRANGED_TONES[formal ? 'formal' : 'casual']
      : TONES[person.relationType];

  return {
    greeting: tone.greeting(name),
    memory: tone.memory(name, note),
    honest: tone.honest(name),
  };
}

export type BoosterCard = { tag: string; title: string; source: string };

export function buildBoosterCards(person: Person, memory: Memory | null): BoosterCard[] {
  const memoryCard: BoosterCard = {
    tag: `당신들의 이야기`,
    title: memory?.note
      ? `“${memory.note}”\n\n이 기억을 아는 사람은\n세상에 두 명뿐이에요.`
      : '함께한 시간은\n사라지지 않았어요.\n다시 꺼내는 사람이 있을 뿐.',
    source: memory
      ? `${MemoryCategoryLabels[memory.category].emoji} ${MemoryCategoryLabels[memory.category].label}${memory.year ? ` · ${memory.year}` : ''}`
      : '',
  };

  const cards: BoosterCard[] =
    person.status === 'ESTRANGED'
      ? [
          {
            tag: '연구가 말해줘요',
            title: '용서는 성격이 아니라\n연습이에요.\n25편 넘는 실험이 확인했어요.',
            source: 'Worthington REACH 모델 · 25+ RCT · 메타분석 d≈0.6',
          },
          {
            tag: '기억해 주세요',
            title: '오늘의 목표는 화해가 아니라\n한 마디를 건네는 것.\n답장이 없어도 실패가 아니에요.',
            source: '용서와 재연결은 별개의 선택이에요 (잇다 원칙)',
          },
        ]
      : [
          {
            tag: '연구가 말해줘요',
            title: '연락받은 사람은,\n보낸 사람 생각보다\n훨씬 반가워했어요.',
            source: 'Liu et al. (2023) · JPSP · 독립 재현 성공',
          },
          {
            tag: '연구가 말해줘요',
            title: '워밍업을 마친 사람의\n53%가 실제로 연락했어요.\n하지 않은 사람은 31%.',
            source: 'Aknin & Sandstrom (2024) · Nature Comm. Psychol.',
          },
        ];

  const numbered = [...cards, memoryCard];
  return numbered.map((c, i) => ({ ...c, tag: `${c.tag} · ${i + 1}/${numbered.length}` }));
}

export function warmupCopy(person: Person): { title: string; body: string } {
  if (person.status === 'ESTRANGED') {
    return {
      title: '마음 고르기부터\n시작해요',
      body: '틀어진 관계에 연락하는 건 큰 용기예요. 먼저 지금 편한 사람 한 명에게 가벼운 안부를 보내며 마음을 데워 보세요. 오늘 끝까지 가지 않아도 괜찮아요.',
    };
  }
  return {
    title: '몸풀기부터\n시작해요',
    body: '오래 끊긴 사람에게 바로 연락하는 건 누구에게나 어려워요. 먼저 지금 편한 사람 한 명에게 가벼운 안부를 보내 보세요. "밥 잘 챙겨 먹고 있어?" 한 줄이면 충분해요.',
  };
}
