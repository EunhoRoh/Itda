import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  closeRoom,
  fetchMessages,
  fetchRoom,
  postMessage,
  requestAssist,
  type ChatMessage,
  type ChatRoom,
  type ChatRole,
} from '@/api/chats';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirmAsync } from '@/utils/confirm';

const POLL_MS = 3000;

/**
 * 커넥트 후 대화방 (docs/12 §15-2) — 익명 나눔방 + AI 동석.
 * 회원 도입 전이라 내 역할(role)과 상대 표시 이름(name)은 진입 화면이 넘겨준다.
 */
export default function ChatRoomScreen() {
  const theme = useTheme();
  const {
    roomId: roomIdParam,
    role: roleParam,
    name: nameParam,
  } = useLocalSearchParams<{ roomId: string; role?: string; name?: string }>();
  const roomId = Number(roomIdParam);
  const myRole: Exclude<ChatRole, 'ASSISTANT'> = roleParam === 'RECIPIENT' ? 'RECIPIENT' : 'SENDER';
  const counterpartName = nameParam || '상대';

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [assisting, setAssisting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const lastIdRef = useRef(0);

  const appendNew = useCallback((incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const known = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !known.has(m.id));
      if (fresh.length === 0) return prev;
      const next = [...prev, ...fresh];
      lastIdRef.current = next[next.length - 1].id;
      return next;
    });
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, []);

  // 첫 로드 + 폴링 (FCM 도입 전 MVP — docs/13 §6)
  useEffect(() => {
    if (!Number.isFinite(roomId)) return;
    let alive = true;
    fetchRoom(roomId)
      .then((r) => alive && setRoom(r))
      .catch(() => {});
    fetchMessages(roomId)
      .then((m) => alive && appendNew(m))
      .catch(() => {});
    const timer = setInterval(() => {
      fetchMessages(roomId, lastIdRef.current || undefined)
        .then((m) => alive && appendNew(m))
        .catch(() => {});
    }, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [roomId, appendNew]);

  const send = async () => {
    const body = input.trim();
    if (!body || sending || room?.status !== 'OPEN') return;
    setSending(true);
    try {
      const saved = await postMessage(roomId, myRole, body);
      setInput('');
      appendNew([saved]);
    } catch (e) {
      Alert.alert('보내지 못했어요', e instanceof Error ? e.message : '다시 시도해 주세요');
    } finally {
      setSending(false);
    }
  };

  const assist = async () => {
    if (assisting || room?.status !== 'OPEN') return;
    setAssisting(true);
    try {
      const reply = await requestAssist(roomId);
      appendNew([reply]);
    } catch (e) {
      Alert.alert(
        '도우미를 부르지 못했어요',
        e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요',
      );
    } finally {
      setAssisting(false);
    }
  };

  const finish = async () => {
    if (room?.status !== 'OPEN') return;
    const ok = await confirmAsync(
      '여기까지 할까요?',
      '대화를 마쳐도 주고받은 마음은 기록으로 남아요. 언제든 새 마음으로 다시 이어질 수 있어요.',
      '마칠게요',
    );
    if (!ok) return;
    try {
      const updated = await closeRoom(roomId);
      setRoom(updated);
    } catch (e) {
      Alert.alert('마치지 못했어요', e instanceof Error ? e.message : '다시 시도해 주세요');
    }
  };

  const open = room?.status === 'OPEN';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <ThemedText type="small" themeColor="textSecondary">
                ← 뒤로
              </ThemedText>
            </Pressable>
            <View style={styles.headerCenter}>
              <ThemedText type="smallBold">
                {counterpartName}
                {room?.anonymous ? ' 🦁' : ''}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                {open ? '이어진 대화' : '마친 대화'}
              </ThemedText>
            </View>
            {open ? (
              <Pressable onPress={finish} hitSlop={12}>
                <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                  여기까지
                </ThemedText>
              </Pressable>
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>

          {room?.anonymous && open && (
            <ThemedView type="backgroundElement" style={[styles.notice, { borderColor: theme.border }]}>
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                🦁 서로 익명인 채로 나누는 대화예요. 누구인지 묻기보다 마음에 머물러 봐요 —
                밝히고 싶어지는 순간까지, 익명은 잇다가 지켜드려요.
              </ThemedText>
            </ThemedView>
          )}

          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.messages}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
            {messages.map((m) => {
              if (m.role === 'ASSISTANT') {
                return (
                  <View key={m.id} style={styles.assistantRow}>
                    <View
                      style={[
                        styles.assistantBubble,
                        { backgroundColor: theme.greenSoft, borderColor: theme.green },
                      ]}>
                      <ThemedText type="small" style={{ color: theme.green, fontSize: 11 }}>
                        🕊️ 잇는 도우미
                      </ThemedText>
                      <ThemedText type="small" style={styles.bubbleText}>
                        {m.body}
                      </ThemedText>
                    </View>
                  </View>
                );
              }
              const mine = m.role === myRole;
              return (
                <View key={m.id} style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                  <View
                    style={[
                      styles.bubble,
                      mine
                        ? { backgroundColor: theme.coralSoft }
                        : [
                            {
                              backgroundColor: theme.backgroundElement,
                              borderColor: theme.border,
                              borderWidth: StyleSheet.hairlineWidth,
                            },
                          ],
                    ]}>
                    <ThemedText type="small" style={styles.bubbleText}>
                      {m.body}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
            {!open && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.closedNote}>
                대화를 마쳤어요. 주고받은 마음은 여기 그대로 남아 있어요.
              </ThemedText>
            )}
          </ScrollView>

          {open && (
            <>
              <Pressable
                onPress={assist}
                disabled={assisting}
                style={({ pressed }) => [
                  styles.assistBtn,
                  { borderColor: theme.green },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="small" style={{ color: theme.green, fontSize: 12 }}>
                  {assisting ? '도우미가 생각하고 있어요…' : '🕊️ 무슨 말을 할지 막막하면, 도우미 부르기'}
                </ThemedText>
              </Pressable>
              <View style={styles.inputRow}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  maxLength={500}
                  multiline
                  placeholder="서두르지 않아도 괜찮아요"
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
                <Pressable
                  onPress={send}
                  disabled={!input.trim() || sending}
                  style={({ pressed }) => [
                    styles.sendBtn,
                    { backgroundColor: input.trim() ? theme.coral : theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" style={{ color: theme.onAccent, fontSize: 13 }}>
                    보내기
                  </ThemedText>
                </Pressable>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  headerCenter: {
    alignItems: 'center',
    gap: 2,
  },
  headerSpacer: {
    width: 40,
  },
  notice: {
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  messages: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  assistantRow: {
    alignItems: 'center',
    marginVertical: Spacing.one,
  },
  assistantBubble: {
    maxWidth: '92%',
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: 2,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
  },
  closedNote: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: Spacing.three,
  },
  assistBtn: {
    borderRadius: Radius.chip,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingBottom: Spacing.four,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 14,
    lineHeight: 20,
    maxHeight: 120,
  },
  sendBtn: {
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
