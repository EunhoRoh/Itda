import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  changeContactCycle,
  changePersonStatus,
  fetchMemories,
  fetchPerson,
  type Memory,
  type Person,
} from '@/api/people';
import { cancelAftercare, syncContactCycleReminder } from '@/notifications/reminders';
import { confirmAsync } from '@/utils/confirm';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  MemoryCategoryLabels,
  EmotionTagLabels,
  RelationStatusLabels,
  RelationTypeLabels,
} from '@/constants/labels';
import { MaxContentWidth, Radius, Spacing, StatusColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

function sinceLabel(lastContactAt: string | null) {
  if (!lastContactAt) return '연락 기록 없음';
  const years = (Date.now() - new Date(lastContactAt).getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (years >= 1) return `마지막 연락 ${Math.floor(years)}년 전`;
  const months = Math.floor(years * 12);
  return months >= 1 ? `마지막 연락 ${months}개월 전` : '최근에 연락했어요';
}

export default function PersonDetailScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const statusColors = StatusColors[scheme === 'dark' ? 'dark' : 'light'];
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = Number(idParam);

  const [person, setPerson] = useState<Person | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const CYCLE_OPTIONS: { days: number | null; label: string }[] = [
    { days: null, label: '없음' },
    { days: 14, label: '2주' },
    { days: 30, label: '한 달' },
    { days: 90, label: '석 달' },
  ];

  const setCycle = async (days: number | null) => {
    if (!person) return;
    try {
      const updated = await changeContactCycle(person.id, days);
      setPerson(updated);
      const scheduled = await syncContactCycleReminder(person.id, person.nickname, days);
      if (days && !scheduled) {
        Alert.alert(
          '알림 권한이 꺼져 있어요',
          '주기는 저장했지만 휴대폰 알림은 울리지 않아요. 설정에서 잇다 알림을 허용해 주세요.',
        );
      }
    } catch (e) {
      Alert.alert('저장하지 못했어요', e instanceof Error ? e.message : '다시 시도해 주세요');
    }
  };

  /**
   * 다시 멀어짐 — 애프터케어 알림까지 함께 끈다.
   * 관계가 식은 뒤에도 "다시 이어진 지 1년이에요"가 울리면 위로가 아니라 상처가 된다.
   */
  const markDrifted = async () => {
    if (!person) return;
    const ok = await confirmAsync(
      '다시 멀어진 관계로 둘까요?',
      '재연결 기념 알림(1주·1개월·1주년)을 꺼드릴게요. 관계 기록과 추억은 그대로 남아요.',
      '그렇게 할게요',
    );
    if (!ok) return;
    try {
      const updated = await changePersonStatus(person.id, 'DRIFTED');
      setPerson(updated);
      await cancelAftercare(person.id);
    } catch (e) {
      Alert.alert('바꾸지 못했어요', e instanceof Error ? e.message : '다시 시도해 주세요');
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!Number.isFinite(id)) {
        setLoadError('사람을 찾을 수 없어요');
        return;
      }
      setLoadError(null);
      fetchPerson(id)
        .then(setPerson)
        .catch((e) => setLoadError(e instanceof Error ? e.message : '불러오지 못했어요'));
      fetchMemories(id).then(setMemories).catch(() => {});
    }, [id]),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ThemedText type="small" themeColor="textSecondary">
              ← 뒤로
            </ThemedText>
          </Pressable>

          {loadError && !person && (
            <ThemedView
              type="backgroundElement"
              style={[styles.safetyCard, { borderColor: theme.border }]}>
              <ThemedText type="smallBold">불러오지 못했어요</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {loadError}
              </ThemedText>
            </ThemedView>
          )}

          {person && (
            <>
              <View style={styles.profile}>
                <View style={[styles.avatar, { backgroundColor: theme.green }]}>
                  <ThemedText type="smallBold" style={{ color: theme.onAccent, fontSize: 18 }}>
                    {person.nickname.slice(0, 2)}
                  </ThemedText>
                </View>
                <View style={styles.profileText}>
                  <ThemedText type="subtitle" style={styles.name}>
                    {person.nickname}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {RelationTypeLabels[person.relationType]} · {sinceLabel(person.lastContactAt)}
                  </ThemedText>
                </View>
                <View
                  style={[styles.statusPill, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText
                    type="small"
                    style={{ color: statusColors[person.status], fontSize: 12 }}>
                    {RelationStatusLabels[person.status]}
                  </ThemedText>
                </View>
              </View>

              {!person.reconnectAllowed && (
                <ThemedView
                  type="backgroundElement"
                  style={[styles.safetyCard, { borderColor: theme.border }]}>
                  <ThemedText type="smallBold">보호 모드예요</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    당신의 안전이 화해보다 먼저예요. 이 관계에는 재연락을 권하지 않아요. 기록과
                    마음 정리 기능만 열려 있어요. 도움이 필요하면 여성긴급전화 1366.
                  </ThemedText>
                </ThemedView>
              )}

              {person.reconnectAllowed && person.status !== 'CONNECTED' && (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/mission/[personId]',
                      params: { personId: String(person.id) },
                    })
                  }
                  style={({ pressed }) => [
                    styles.cta,
                    { backgroundColor: theme.coral },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                    용기 내보기
                  </ThemedText>
                </Pressable>
              )}

              {person.reconnectAllowed && (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/letter/new',
                      params: { personId: String(person.id) },
                    })
                  }
                  style={({ pressed }) => [
                    styles.cta,
                    styles.outlineCta,
                    { borderColor: theme.coral },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" style={{ color: theme.coral }}>
                    💌 마음 보내기
                  </ThemedText>
                </Pressable>
              )}

              {person.status === 'CONNECTED' && person.reconnectedAt && (
                <>
                  <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                    {person.reconnectedAt}에 다시 이어졌어요. 1주·1개월·1주년에 회상 알림을
                    보내드려요.
                  </ThemedText>
                  <Pressable onPress={markDrifted} hitSlop={8}>
                    <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                      다시 멀어졌어요 — 기념 알림 끄기
                    </ThemedText>
                  </Pressable>
                </>
              )}

              {person.reconnectAllowed && (
                <>
                  <ThemedText type="smallBold" style={{ fontSize: 16, marginTop: Spacing.two }}>
                    연락 리마인더
                  </ThemedText>
                  <View style={styles.cycleRow}>
                    {CYCLE_OPTIONS.map((o) => {
                      const active = (person.contactCycleDays ?? null) === o.days;
                      return (
                        <Pressable
                          key={o.label}
                          onPress={() => setCycle(o.days)}
                          style={[
                            styles.cycleChip,
                            {
                              backgroundColor: active ? theme.green : theme.backgroundElement,
                              borderColor: theme.border,
                            },
                          ]}>
                          <ThemedText
                            type="small"
                            style={{ color: active ? theme.onAccent : theme.textSecondary }}>
                            {o.label}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                  <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                    주기를 정하면 "{person.nickname} 님과 이을 시간이에요"라고 알려드려요. 알림은
                    휴대폰에서만 울려요.
                  </ThemedText>
                </>
              )}

              <View style={styles.memoryHeader}>
                <ThemedText type="smallBold" style={{ fontSize: 16 }}>
                  함께한 추억 {memories.length > 0 ? memories.length : ''}
                </ThemedText>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/memory/new',
                      params: { personId: String(person.id) },
                    })
                  }
                  hitSlop={8}>
                  <ThemedText type="smallBold" style={{ color: theme.coral }}>
                    + 추억 남기기
                  </ThemedText>
                </Pressable>
              </View>

              {memories.length === 0 && (
                <ThemedText type="small" themeColor="textSecondary">
                  아직 남긴 추억이 없어요. 추억은 다시 연락할 때 첫 마디의 재료가 되어줘요.
                </ThemedText>
              )}

              {memories.map((m) => (
                <ThemedView
                  key={m.id}
                  type="backgroundElement"
                  style={[styles.memoryCard, { borderColor: theme.border }]}>
                  <ThemedText style={styles.memoryEmoji}>
                    {MemoryCategoryLabels[m.category].emoji}
                  </ThemedText>
                  <View style={styles.memoryBody}>
                    <ThemedText type="smallBold">
                      {MemoryCategoryLabels[m.category].label}
                      {m.year ? ` · ${m.year}` : ''}
                    </ThemedText>
                    {!!m.note && (
                      <ThemedText type="small" themeColor="textSecondary">
                        “{m.note}”
                      </ThemedText>
                    )}
                    {m.emotion && (
                      <ThemedText type="small" style={{ color: theme.coral, fontSize: 12 }}>
                        {EmotionTagLabels[m.emotion]}
                      </ThemedText>
                    )}
                  </View>
                </ThemedView>
              ))}
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
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  profileText: {
    flex: 1,
    gap: Spacing.half,
  },
  name: {
    fontSize: 26,
    lineHeight: 34,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    borderRadius: Radius.chip,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  safetyCard: {
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  cta: {
    borderRadius: Radius.button,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  outlineCta: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.7,
  },
  cycleRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  cycleChip: {
    borderRadius: Radius.chip,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  memoryCard: {
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    flexDirection: 'row',
    gap: Spacing.three,
  },
  memoryEmoji: {
    fontSize: 22,
  },
  memoryBody: {
    flex: 1,
    gap: Spacing.half,
  },
});
