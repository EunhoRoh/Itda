import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  decideLetter,
  fetchLetters,
  reactToLetter,
  type Letter,
  type LetterDirection,
  type SenderDecision,
} from '@/api/letters';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  LetterEmotionMeta,
  ReactionLabels,
  type LetterStatus,
} from '@/constants/letter-content';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function dateLabel(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function LettersScreen() {
  const theme = useTheme();
  const [tab, setTab] = useState<LetterDirection>('RECEIVED');
  const [letters, setLetters] = useState<Letter[]>([]);
  const [openedId, setOpenedId] = useState<number | null>(null);

  const reload = useCallback((direction: LetterDirection) => {
    fetchLetters(direction)
      .then(setLetters)
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload(tab);
    }, [reload, tab]),
  );

  const react = async (letter: Letter, reaction: Exclude<LetterStatus, 'DELIVERED'>) => {
    try {
      const updated = await reactToLetter(letter.id, reaction);
      setLetters((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch {}
  };

  const decide = async (letter: Letter, decision: Exclude<SenderDecision, 'NONE'>) => {
    try {
      const updated = await decideLetter(letter.id, decision);
      setLetters((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch {}
  };

  const SenderStatusText: Record<string, string> = {
    DELIVERED: '상대의 응답을 기다리고 있어요',
    HEART_RECEIVED: '🤍 상대가 마음을 받았어요',
    DECLINED: '상대가 받지 않기로 했어요 — 그 마음도 존중해 주세요',
  };

  const DecisionText: Record<Exclude<SenderDecision, 'NONE'>, string> = {
    REVEAL: '실명을 공개하고 대화하기로 했어요 — 대화방은 곧 열려요',
    ANON_CHAT: '익명인 채로 대화하기로 했어요 — 대화방은 곧 열려요',
    KEEP_HEART: '마음만 전하기로 했어요 — 상대에게 완곡히 알렸어요',
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle">마음함</ThemedText>
            <Pressable
              onPress={() => router.push('/letter/new')}
              style={({ pressed }) => [
                styles.sendBtn,
                { backgroundColor: theme.coral },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                💌 마음 보내기
              </ThemedText>
            </Pressable>
          </View>
          <View style={styles.segmentRow}>
            {(
              [
                ['RECEIVED', '받은 마음'],
                ['SENT', '보낸 마음'],
              ] as const
            ).map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => {
                  setTab(key);
                  setOpenedId(null);
                }}
                style={[
                  styles.segment,
                  {
                    backgroundColor: tab === key ? theme.green : theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}>
                <ThemedText
                  type="small"
                  style={{ color: tab === key ? theme.onAccent : theme.textSecondary }}>
                  {label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <ThemedText type="small" themeColor="textSecondary">
            {tab === 'RECEIVED'
              ? '누군가 당신에게 남긴 마음이에요. 열어보는 것도, 답하는 것도 당신의 속도로.'
              : '당신이 보낸 마음이에요. 답을 재촉하지 않아도, 마음은 이미 도착했어요.'}
          </ThemedText>

          {letters.length === 0 && (
            <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
              <ThemedText type="smallBold">
                {tab === 'RECEIVED' ? '아직 도착한 마음이 없어요' : '아직 보낸 마음이 없어요'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                먼저 누군가에게 마음을 보내보는 건 어때요? 받는 사람은 생각보다 훨씬 반가워해요.
              </ThemedText>
            </ThemedView>
          )}

          {letters.map((letter) => {
            const meta = LetterEmotionMeta[letter.emotion];
            const accent = meta.tone === 'warm' ? theme.coral : theme.green;
            const soft = meta.tone === 'warm' ? theme.coralSoft : theme.greenSoft;
            const opened = openedId === letter.id;
            return (
              <Pressable
                key={letter.id}
                onPress={() => setOpenedId(opened ? null : letter.id)}>
                <ThemedView
                  type="backgroundElement"
                  style={[styles.card, { borderColor: opened ? accent : theme.border }]}>
                  <View style={styles.cardHead}>
                    <View style={[styles.badge, { backgroundColor: soft }]}>
                      <ThemedText type="small" style={{ color: accent, fontSize: 12 }}>
                        {meta.emoji} {meta.label}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                      {dateLabel(letter.createdAt)}
                    </ThemedText>
                  </View>
                  <ThemedText type="smallBold">
                    {letter.senderName}
                    {letter.anonymous ? ' (익명)' : ''}
                  </ThemedText>
                  <ThemedText
                    type="default"
                    themeColor={opened ? 'text' : 'textSecondary'}
                    numberOfLines={opened ? undefined : 2}
                    style={styles.body}>
                    {letter.body}
                  </ThemedText>

                  {tab === 'SENT' && letter.status !== 'CONNECT_REQUESTED' && (
                    <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                      {SenderStatusText[letter.status]}
                    </ThemedText>
                  )}

                  {tab === 'SENT' &&
                    letter.status === 'CONNECT_REQUESTED' &&
                    (letter.senderDecision === 'NONE' ? (
                      <View style={styles.reactions}>
                        <ThemedText type="smallBold" style={{ color: accent, fontSize: 13 }}>
                          💬 상대가 더 얘기하고 싶어 해요! 어떻게 할까요?
                        </ThemedText>
                        <Pressable
                          onPress={() => decide(letter, 'REVEAL')}
                          style={({ pressed }) => [
                            styles.reactBtn,
                            { backgroundColor: accent },
                            pressed && styles.pressed,
                          ]}>
                          <ThemedText
                            type="smallBold"
                            style={{ color: theme.onAccent, fontSize: 13 }}>
                            ✨ 내가 누군지 밝히고 대화할게요
                          </ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={() => decide(letter, 'ANON_CHAT')}
                          style={({ pressed }) => [
                            styles.reactBtn,
                            styles.outline,
                            { borderColor: accent },
                            pressed && styles.pressed,
                          ]}>
                          <ThemedText type="smallBold" style={{ color: accent, fontSize: 13 }}>
                            🦁 조금 더 익명으로 이야기할게요
                          </ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={() => decide(letter, 'KEEP_HEART')}
                          style={({ pressed }) => [styles.reactGhost, pressed && styles.pressed]}>
                          <ThemedText
                            type="small"
                            themeColor="textSecondary"
                            style={{ fontSize: 12 }}>
                            아직은 마음만 전할게요
                          </ThemedText>
                        </Pressable>
                      </View>
                    ) : (
                      <ThemedText type="small" style={{ color: accent, fontSize: 12 }}>
                        {DecisionText[letter.senderDecision as Exclude<SenderDecision, 'NONE'>]}
                      </ThemedText>
                    ))}

                  {tab === 'RECEIVED' && opened && letter.status === 'DELIVERED' && (
                    <View style={styles.reactions}>
                      <Pressable
                        onPress={() => react(letter, 'HEART_RECEIVED')}
                        style={({ pressed }) => [
                          styles.reactBtn,
                          { backgroundColor: accent },
                          pressed && styles.pressed,
                        ]}>
                        <ThemedText type="smallBold" style={{ color: theme.onAccent, fontSize: 13 }}>
                          🤍 {ReactionLabels.HEART_RECEIVED}
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() => react(letter, 'CONNECT_REQUESTED')}
                        style={({ pressed }) => [
                          styles.reactBtn,
                          styles.outline,
                          { borderColor: accent },
                          pressed && styles.pressed,
                        ]}>
                        <ThemedText type="smallBold" style={{ color: accent, fontSize: 13 }}>
                          💬 {ReactionLabels.CONNECT_REQUESTED}
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() => react(letter, 'DECLINED')}
                        style={({ pressed }) => [styles.reactGhost, pressed && styles.pressed]}>
                        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                          {ReactionLabels.DECLINED}
                        </ThemedText>
                      </Pressable>
                    </View>
                  )}

                  {tab === 'RECEIVED' && letter.status === 'HEART_RECEIVED' && (
                    <ThemedText type="small" style={{ color: accent, fontSize: 12 }}>
                      🤍 마음만 받았어요 — 보낸 분에게 전해졌어요
                    </ThemedText>
                  )}
                  {tab === 'RECEIVED' && letter.status === 'CONNECT_REQUESTED' && (
                    <ThemedText type="small" style={{ color: accent, fontSize: 12 }}>
                      💬 대화 요청을 전했어요 — 공개 여부는 보낸 분이 정해요
                    </ThemedText>
                  )}
                  {tab === 'RECEIVED' && letter.status === 'DECLINED' && (
                    <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                      이 발신자의 마음은 더 이상 도착하지 않아요
                    </ThemedText>
                  )}
                </ThemedView>
              </Pressable>
            );
          })}

          <ThemedText type="small" themeColor="textSecondary" style={styles.footNote}>
            마음이 부담스럽거나 위협적이라면 "받고 싶지 않아요"를 눌러주세요. 차단은 언제나
            무료예요.
          </ThemedText>
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
    paddingTop: Platform.select({ web: Spacing.six, default: Spacing.three }),
    paddingBottom: BottomTabInset + Spacing.four,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sendBtn: {
    borderRadius: Radius.chip,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  segment: {
    borderRadius: Radius.chip,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    borderRadius: Radius.chip,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
  },
  reactions: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  reactBtn: {
    borderRadius: Radius.button,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  outline: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  reactGhost: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
  footNote: {
    textAlign: 'center',
    fontSize: 11,
  },
});
