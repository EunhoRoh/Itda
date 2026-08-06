import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { refineLetter, sendLetter } from '@/api/letters';
import { fetchPeople, type Person } from '@/api/people';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  anonymousNickname,
  LetterEmotionMeta,
  presetsFor,
  type LetterEmotion,
} from '@/constants/letter-content';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const EMOTIONS = Object.keys(LetterEmotionMeta) as LetterEmotion[];

export default function NewLetterScreen() {
  const theme = useTheme();
  const { personId: personIdParam } = useLocalSearchParams<{ personId?: string }>();

  const [people, setPeople] = useState<Person[]>([]);
  const [personId, setPersonId] = useState<number | null>(
    personIdParam ? Number(personIdParam) : null,
  );
  const [emotion, setEmotion] = useState<LetterEmotion | null>(null);
  const [anonymous, setAnonymous] = useState(true);
  const [presetBody, setPresetBody] = useState<string | null>(null);
  const [customBody, setCustomBody] = useState('');
  const [senderName, setSenderName] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refinedDrafts, setRefinedDrafts] = useState<string[]>([]);

  const refine = async () => {
    if (!emotion || !customBody.trim() || refining) return;
    setRefining(true);
    setRefinedDrafts([]);
    try {
      const result = await refineLetter(emotion, customBody.trim());
      setRefinedDrafts(result.drafts);
    } catch (e) {
      Alert.alert('다듬지 못했어요', e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요');
    } finally {
      setRefining(false);
    }
  };

  useEffect(() => {
    fetchPeople()
      .then((all) => setPeople(all.filter((p) => p.reconnectAllowed)))
      .catch(() => {});
  }, []);

  const person = useMemo(() => people.find((p) => p.id === personId) ?? null, [people, personId]);
  const meta = emotion ? LetterEmotionMeta[emotion] : null;
  const presets = useMemo(
    () => (emotion && person ? presetsFor(emotion, person.relationType) : []),
    [emotion, person],
  );

  const body = anonymous ? presetBody : customBody.trim() || presetBody;
  const canSend =
    !!person && !!emotion && meta?.deliverable && !!body && (anonymous || senderName.trim());

  const send = async () => {
    if (!person || !emotion || !body || sending) return;
    setSending(true);
    try {
      await sendLetter({
        personId: person.id,
        anonymous,
        senderName: anonymous ? anonymousNickname(person.id) : senderName.trim(),
        emotion,
        body,
        preset: anonymous ? true : body === presetBody,
      });
      setSent(true);
    } catch (e) {
      setSending(false);
      Alert.alert('보내지 못했어요', e instanceof Error ? e.message : '다시 시도해 주세요');
    }
  };

  if (sent) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.doneWrap}>
            <ThemedText type="subtitle" style={styles.doneTitle}>
              🧵 마음을 실어 보냈어요
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.para}>
              {anonymous
                ? `${person ? anonymousNickname(person.id) : '익명'}의 이름으로 전해져요. 상대가 대화를 원하면 알려드릴게요 — 공개할지는 그때 당신이 정해요.`
                : '당신의 이름으로 전해져요. 답이 없어도 마음은 이미 도착한 거예요.'}
            </ThemedText>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.cta,
                { backgroundColor: theme.coral },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                마음함으로
              </ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

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
            <ThemedText type="smallBold">마음 보내기</ThemedText>
          </View>

          <ThemedText type="smallBold">누구에게 보낼까요?</ThemedText>
          <View style={styles.chipWrap}>
            {people.map((p) => {
              const active = personId === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setPersonId(p.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? theme.green : theme.backgroundElement,
                      borderColor: theme.border,
                    },
                  ]}>
                  <ThemedText
                    type="small"
                    style={{ color: active ? theme.onAccent : theme.text }}>
                    {p.nickname}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <ThemedText type="smallBold">어떤 마음인가요?</ThemedText>
          <View style={styles.emotionGrid}>
            {EMOTIONS.map((e) => {
              const m = LetterEmotionMeta[e];
              const active = emotion === e;
              return (
                <Pressable
                  key={e}
                  onPress={() => {
                    setEmotion(e);
                    setPresetBody(null);
                  }}
                  style={[
                    styles.emotionItem,
                    {
                      backgroundColor: active
                        ? m.tone === 'warm'
                          ? theme.coralSoft
                          : theme.greenSoft
                        : theme.backgroundElement,
                      borderColor: active
                        ? m.tone === 'warm'
                          ? theme.coral
                          : theme.green
                        : theme.border,
                    },
                  ]}>
                  <ThemedText style={{ fontSize: 18 }}>{m.emoji}</ThemedText>
                  <ThemedText type="small" style={{ fontSize: 11, fontWeight: 600 }}>
                    {m.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {meta && !meta.deliverable && (
            <ThemedView
              type="backgroundElement"
              style={[styles.card, { borderColor: theme.green }]}>
              <ThemedText type="smallBold">이 마음은 대화로 풀 때 풀려요</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                서운함과 화남을 일방적으로 전하면 오히려 관계가 더 다치기 쉬워요. 잇다의 화해
                브리지(준비 중)에서 AI와 함께 마음을 정리하고, 상대에게는 "오해를 풀고
                싶습니다"라는 대화 초대로 전해드릴게요.
              </ThemedText>
            </ThemedView>
          )}

          {meta?.deliverable && (
            <>
              <ThemedText type="smallBold">어떻게 보낼까요?</ThemedText>
              <View style={styles.chipWrap}>
                <Pressable
                  onPress={() => setAnonymous(true)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: anonymous ? theme.green : theme.backgroundElement,
                      borderColor: theme.border,
                    },
                  ]}>
                  <ThemedText
                    type="small"
                    style={{ color: anonymous ? theme.onAccent : theme.text }}>
                    🦁 익명으로{person ? ` (${anonymousNickname(person.id)})` : ''}
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => setAnonymous(false)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: !anonymous ? theme.green : theme.backgroundElement,
                      borderColor: theme.border,
                    },
                  ]}>
                  <ThemedText
                    type="small"
                    style={{ color: !anonymous ? theme.onAccent : theme.text }}>
                    ✏️ 내 이름으로
                  </ThemedText>
                </Pressable>
              </View>

              {!anonymous && (
                <TextInput
                  value={senderName}
                  onChangeText={setSenderName}
                  maxLength={30}
                  placeholder="상대에게 보일 내 이름"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                    },
                  ]}
                />
              )}

              <ThemedText type="smallBold">
                {anonymous ? '준비된 문구에서 골라주세요' : '문구를 고르거나 직접 써주세요'}
              </ThemedText>
              {anonymous && (
                <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                  익명일 때는 준비된 문구로만 보낼 수 있어요 — 서로를 지키는 규칙이에요.
                </ThemedText>
              )}
              {presets.map((phrase) => {
                const active = presetBody === phrase;
                return (
                  <Pressable
                    key={phrase}
                    onPress={() => setPresetBody(active ? null : phrase)}
                    style={[
                      styles.presetCard,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: active ? theme.coral : theme.border,
                        borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                      },
                    ]}>
                    <ThemedText type="small" style={{ lineHeight: 20 }}>
                      {phrase}
                    </ThemedText>
                  </Pressable>
                );
              })}

              {!anonymous && (
                <>
                  <TextInput
                    multiline
                    value={customBody}
                    onChangeText={(t) => {
                      setCustomBody(t);
                      if (t.trim()) setPresetBody(null);
                      setRefinedDrafts([]);
                    }}
                    maxLength={500}
                    placeholder="직접 쓸 수도 있어요. 구체적인 기억 하나면 충분해요."
                    placeholderTextColor={theme.textSecondary}
                    style={[
                      styles.textarea,
                      {
                        color: theme.text,
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.border,
                      },
                    ]}
                  />
                  {!!customBody.trim() && (
                    <Pressable
                      onPress={refine}
                      disabled={refining}
                      style={({ pressed }) => [
                        styles.refineBtn,
                        { borderColor: theme.green },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText type="smallBold" style={{ color: theme.green, fontSize: 13 }}>
                        {refining ? '다듬는 중…' : '✨ 표현 다듬기 — 3가지 안 받아보기'}
                      </ThemedText>
                    </Pressable>
                  )}
                  {refinedDrafts.length > 0 && (
                    <>
                      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                        마음은 그대로, 표현만 다듬었어요. 마음에 드는 안을 고르면 본문에 들어가요.
                      </ThemedText>
                      {refinedDrafts.map((draft, i) => (
                        <Pressable
                          key={i}
                          onPress={() => {
                            setCustomBody(draft);
                            setRefinedDrafts([]);
                          }}
                          style={({ pressed }) => [
                            styles.presetCard,
                            {
                              backgroundColor: theme.greenSoft,
                              borderColor: theme.green,
                              borderWidth: StyleSheet.hairlineWidth,
                            },
                            pressed && styles.pressed,
                          ]}>
                          <ThemedText type="small" style={{ lineHeight: 20 }}>
                            {['담백하게', '따뜻하게', '정중하게'][i] ?? `안 ${i + 1}`} — {draft}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </>
                  )}
                </>
              )}

              <Pressable
                disabled={!canSend || sending}
                onPress={send}
                style={({ pressed }) => [
                  styles.cta,
                  { backgroundColor: canSend ? theme.coral : theme.border },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                  {sending ? '보내는 중…' : '🧵 마음 보내기'}
                </ThemedText>
              </Pressable>
              <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
                익명 마음은 하루 3명까지. 상대가 원치 않으면 더 보낼 수 없어요.
              </ThemedText>
            </>
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderRadius: Radius.chip,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  emotionItem: {
    width: '31%',
    borderRadius: Radius.button,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    gap: 2,
  },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  presetCard: {
    borderRadius: Radius.button,
    padding: Spacing.three,
  },
  input: {
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    fontSize: 15,
  },
  refineBtn: {
    borderRadius: Radius.button,
    borderWidth: 1.5,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  textarea: {
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 100,
    padding: Spacing.three,
    fontSize: 14,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  cta: {
    borderRadius: Radius.button,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  note: {
    textAlign: 'center',
    fontSize: 11,
  },
  pressed: {
    opacity: 0.7,
  },
  doneWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  doneTitle: {
    fontSize: 26,
    lineHeight: 36,
  },
  para: {
    fontSize: 15,
    lineHeight: 24,
  },
});
