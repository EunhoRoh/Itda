import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  advanceMission,
  recordMissionResult,
  startOrResumeMission,
  type Mission,
  type MissionResult,
} from '@/api/missions';
import { fetchMemories, fetchPerson, type Memory, type Person } from '@/api/people';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MemoryCategoryLabels } from '@/constants/labels';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STEP_CHIPS = [
  { key: 'WARMUP', label: '워밍업' },
  { key: 'BOOSTER', label: '용기' },
  { key: 'DRAFT', label: '초안' },
  { key: 'SENT', label: '기록' },
] as const;

type TemplateKey = 'greeting' | 'memory' | 'honest';

function buildTemplates(person: Person, memory: Memory | null): Record<TemplateKey, string> {
  const name = person.nickname;
  const memoryLine = memory?.note
    ? `갑자기 ${memory.note} 생각나서 연락해봤어.`
    : '문득 예전 생각이 나서 연락해봤어.';
  return {
    greeting: `${name}, 오랜만이야. 문득 생각나서 연락해봤어. 잘 지내지?`,
    memory: `${name}, 오랜만이야. ${memoryLine} 잘 지내고 있지? 언제 한번 보자.`,
    honest: `${name}, 연락 못 한 지 너무 오래됐네. 계속 생각은 났는데 괜히 용기가 안 났어. 잘 지내는지 궁금해서 연락해봤어.`,
  };
}

export default function MissionScreen() {
  const theme = useTheme();
  const { personId } = useLocalSearchParams<{ personId: string }>();
  const id = Number(personId);

  const [mission, setMission] = useState<Mission | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [boosterIndex, setBoosterIndex] = useState(0);
  const [template, setTemplate] = useState<TemplateKey>('memory');
  const [draft, setDraft] = useState('');
  const [finishedResult, setFinishedResult] = useState<MissionResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([startOrResumeMission(id), fetchPerson(id), fetchMemories(id)])
      .then(([m, p, memories]) => {
        if (cancelled) return;
        setMission(m);
        setPerson(p);
        setMemory(memories[0] ?? null);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '미션을 열지 못했어요');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const templates = useMemo(
    () => (person ? buildTemplates(person, memory) : null),
    [person, memory],
  );

  useEffect(() => {
    if (templates) setDraft(templates[template]);
  }, [templates, template]);

  const boosterCards = useMemo(
    () => [
      {
        tag: '연구가 말해줘요 · 1/3',
        title: '연락받은 사람은,\n보낸 사람 생각보다\n훨씬 반가워했어요.',
        source: 'Liu et al. (2023) · JPSP · 독립 재현 성공',
      },
      {
        tag: '연구가 말해줘요 · 2/3',
        title: '워밍업을 마친 사람의\n53%가 실제로 연락했어요.\n하지 않은 사람은 31%.',
        source: 'Aknin & Sandstrom (2024) · Nature Comm. Psychol.',
      },
      {
        tag: '당신들의 이야기 · 3/3',
        title: memory?.note
          ? `“${memory.note}”\n\n이 기억을 아는 사람은\n세상에 두 명뿐이에요.`
          : '함께한 시간은\n사라지지 않았어요.\n다시 꺼내는 사람이 있을 뿐.',
        source: memory
          ? `${MemoryCategoryLabels[memory.category].emoji} ${MemoryCategoryLabels[memory.category].label}${memory.year ? ` · ${memory.year}` : ''}`
          : '',
      },
    ],
    [memory],
  );

  const advance = async () => {
    if (!mission) return;
    try {
      setMission(await advanceMission(mission.id));
    } catch (e) {
      Alert.alert('잠깐요', e instanceof Error ? e.message : '진행하지 못했어요');
    }
  };

  const copyAndOpen = async () => {
    if (!mission) return;
    await Clipboard.setStringAsync(draft);
    if (Platform.OS !== 'web') {
      Linking.openURL('kakaotalk://launch').catch(() => {});
    }
    Alert.alert('복사했어요', '카카오톡이나 문자에 붙여넣어 보내면 돼요. 보내는 건 당신의 몫이에요.');
    await advance();
  };

  const finish = async (result: MissionResult) => {
    if (!mission) return;
    try {
      setMission(await recordMissionResult(mission.id, result));
      setFinishedResult(result);
    } catch (e) {
      Alert.alert('잠깐요', e instanceof Error ? e.message : '기록하지 못했어요');
    }
  };

  const step = mission?.step;
  const chipStates = useMemo(() => {
    const order = ['WARMUP', 'BOOSTER', 'DRAFT', 'SENT', 'DONE'];
    const current = order.indexOf(step ?? 'WARMUP');
    return STEP_CHIPS.map((c, i) => ({ ...c, done: i < current, active: i === Math.min(current, 3) }));
  }, [step]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <ThemedText type="small" themeColor="textSecondary">
                ← 닫기
              </ThemedText>
            </Pressable>
            {person && <ThemedText type="smallBold">{person.nickname} 님에게</ThemedText>}
          </View>

          <View style={styles.chips}>
            {chipStates.map((c) => (
              <View
                key={c.key}
                style={[
                  styles.chip,
                  {
                    backgroundColor: c.active ? theme.green : theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}>
                <ThemedText
                  type="small"
                  style={{ color: c.active ? theme.onAccent : theme.textSecondary, fontSize: 12 }}>
                  {c.done ? '✓ ' : ''}
                  {c.label}
                </ThemedText>
              </View>
            ))}
          </View>

          {error && (
            <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
              <ThemedText type="smallBold">{error}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                이 관계에는 미션을 열 수 없거나, 서버에 연결하지 못했어요.
              </ThemedText>
            </ThemedView>
          )}

          {step === 'WARMUP' && (
            <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
              <ThemedText type="subtitle" style={styles.stepTitle}>
                몸풀기부터{'\n'}시작해요
              </ThemedText>
              <ThemedText type="default" themeColor="textSecondary" style={styles.para}>
                오래 끊긴 사람에게 바로 연락하는 건 누구에게나 어려워요. 먼저{' '}
                <ThemedText type="default" style={{ color: theme.coral, fontWeight: 700 }}>
                  지금 편한 사람 한 명
                </ThemedText>
                에게 가벼운 안부를 보내 보세요. {'"'}밥 잘 챙겨 먹고 있어?{'"'} 한 줄이면 충분해요.
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                이 3분짜리 연습만으로 실제 연락 확률이 31%에서 53%로 올라가요 (2024년 연구).
              </ThemedText>
              <Pressable
                onPress={advance}
                style={({ pressed }) => [styles.cta, { backgroundColor: theme.coral }, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                  보냈어요, 다음으로
                </ThemedText>
              </Pressable>
              <Pressable onPress={() => router.back()} style={styles.ghost}>
                <ThemedText type="small" themeColor="textSecondary">
                  오늘은 여기까지 할게요
                </ThemedText>
              </Pressable>
            </ThemedView>
          )}

          {step === 'BOOSTER' && (
            <View style={styles.boosterWrap}>
              <View style={[styles.booster, { backgroundColor: theme.green }]}>
                <ThemedText type="small" style={[styles.boosterTag, { color: theme.greenSoft }]}>
                  {boosterCards[boosterIndex].tag}
                </ThemedText>
                <ThemedText type="subtitle" style={[styles.boosterTitle, { color: theme.onAccent }]}>
                  {boosterCards[boosterIndex].title}
                </ThemedText>
                {!!boosterCards[boosterIndex].source && (
                  <ThemedText type="small" style={{ color: theme.greenSoft, fontSize: 11 }}>
                    {boosterCards[boosterIndex].source}
                  </ThemedText>
                )}
              </View>
              <View style={styles.dots}>
                {boosterCards.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      { backgroundColor: i === boosterIndex ? theme.coral : theme.border },
                    ]}
                  />
                ))}
              </View>
              <Pressable
                onPress={() =>
                  boosterIndex < boosterCards.length - 1
                    ? setBoosterIndex(boosterIndex + 1)
                    : advance()
                }
                style={({ pressed }) => [styles.cta, { backgroundColor: theme.coral }, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                  {boosterIndex < boosterCards.length - 1 ? '다음 카드' : '이제 써볼게요'}
                </ThemedText>
              </Pressable>
            </View>
          )}

          {step === 'DRAFT' && templates && (
            <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
              <ThemedText type="subtitle" style={styles.stepTitle}>
                보낼 첫 마디
              </ThemedText>
              <View style={styles.templateRow}>
                {(
                  [
                    ['greeting', '가벼운 안부'],
                    ['memory', '추억 소환'],
                    ['honest', '솔직하게'],
                  ] as const
                ).map(([key, label]) => (
                  <Pressable
                    key={key}
                    onPress={() => setTemplate(key)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: template === key ? theme.green : theme.background,
                        borderColor: theme.border,
                      },
                    ]}>
                    <ThemedText
                      type="small"
                      style={{
                        color: template === key ? theme.onAccent : theme.textSecondary,
                        fontSize: 12,
                      }}>
                      {label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              <TextInput
                multiline
                value={draft}
                onChangeText={setDraft}
                style={[
                  styles.draftInput,
                  { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
                ]}
              />
              <Pressable
                onPress={copyAndOpen}
                style={({ pressed }) => [styles.cta, { backgroundColor: theme.coral }, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                  복사하고 카카오톡 열기
                </ThemedText>
              </Pressable>
              <ThemedText type="small" themeColor="textSecondary" style={styles.centerNote}>
                잇다에는 전송 버튼이 없어요. 보내는 순간은 당신의 것이니까요.
              </ThemedText>
            </ThemedView>
          )}

          {step === 'SENT' && !finishedResult && (
            <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
              <ThemedText type="subtitle" style={styles.stepTitle}>
                어떻게 됐나요?
              </ThemedText>
              <Pressable
                onPress={() => finish('REPLIED')}
                style={({ pressed }) => [styles.cta, { backgroundColor: theme.green }, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                  😊 답장이 왔어요
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => finish('NO_REPLY')}
                style={({ pressed }) => [
                  styles.cta,
                  styles.outline,
                  { borderColor: theme.border },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold">⏳ 아직 답이 없어요</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => finish('NOT_SENT')}
                style={({ pressed }) => [
                  styles.cta,
                  styles.outline,
                  { borderColor: theme.border },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold">😔 아직 못 보냈어요</ThemedText>
              </Pressable>
            </ThemedView>
          )}

          {(finishedResult || step === 'DONE') && (
            <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
              {finishedResult === 'REPLIED' || (step === 'DONE' && mission?.result === 'REPLIED') ? (
                <>
                  <ThemedText type="subtitle" style={styles.stepTitle}>
                    🧵 다시 이어졌어요!
                  </ThemedText>
                  <ThemedText type="default" themeColor="textSecondary" style={styles.para}>
                    끊겼던 실이 다시 이어졌어요. 이 순간을 만든 건 연구도 잇다도 아니라, 용기를 낸
                    당신이에요.
                  </ThemedText>
                </>
              ) : finishedResult === 'NO_REPLY' ? (
                <>
                  <ThemedText type="subtitle" style={styles.stepTitle}>
                    기다림도 과정이에요
                  </ThemedText>
                  <ThemedText type="default" themeColor="textSecondary" style={styles.para}>
                    답장이 늦는 데는 수많은 이유가 있어요. 당신이 보낸 마음은 이미 도착했어요. 답이
                    오면 홈에서 기록해 주세요.
                  </ThemedText>
                </>
              ) : (
                <>
                  <ThemedText type="subtitle" style={styles.stepTitle}>
                    괜찮아요
                  </ThemedText>
                  <ThemedText type="default" themeColor="textSecondary" style={styles.para}>
                    여기까지 온 것만으로 마음은 이미 절반쯤 전해질 준비가 됐어요. 초안은 저장해
                    뒀으니, 준비되면 언제든 다시 열어요.
                  </ThemedText>
                </>
              )}
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [styles.cta, { backgroundColor: theme.coral }, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                  홈으로
                </ThemedText>
              </Pressable>
            </ThemedView>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
  },
  scroll: {
    gap: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chips: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    borderRadius: Radius.chip,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  card: {
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  stepTitle: {
    fontSize: 26,
    lineHeight: 36,
  },
  para: {
    fontSize: 15,
    lineHeight: 24,
  },
  cta: {
    borderRadius: Radius.button,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  outline: {
    borderWidth: 1,
  },
  ghost: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
  boosterWrap: {
    gap: Spacing.three,
  },
  booster: {
    borderRadius: Radius.sheet,
    padding: Spacing.five,
    minHeight: 320,
    gap: Spacing.three,
    justifyContent: 'center',
  },
  boosterTag: {
    letterSpacing: 1.5,
    fontSize: 11,
  },
  boosterTitle: {
    fontSize: 24,
    lineHeight: 36,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.one,
    justifyContent: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  templateRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  draftInput: {
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 140,
    padding: Spacing.three,
    fontSize: 15,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  centerNote: {
    textAlign: 'center',
    fontSize: 12,
  },
});
