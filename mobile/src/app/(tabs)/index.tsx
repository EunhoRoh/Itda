import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchActiveMissions, type Mission } from '@/api/missions';
import { fetchMemories, type Memory, type Person } from '@/api/people';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  MemoryCategoryLabels,
  RelationStatusLabels,
  RelationTypeLabels,
} from '@/constants/labels';
import {
  BottomTabInset,
  MaxContentWidth,
  Radius,
  Spacing,
  StatusColors,
} from '@/constants/theme';
import { usePeople } from '@/hooks/use-people';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

function formatToday() {
  const now = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${now.getMonth() + 1}월 ${now.getDate()}일 ${days[now.getDay()]}요일`;
}

function sinceLabel(lastContactAt: string | null) {
  if (!lastContactAt) return '연락 기록 없음';
  const years = (Date.now() - new Date(lastContactAt).getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (years >= 1) return `마지막 연락 ${Math.floor(years)}년 전`;
  const months = Math.floor(years * 12);
  return months >= 1 ? `마지막 연락 ${months}개월 전` : '최근에 연락했어요';
}

export default function HomeScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const statusColors = StatusColors[scheme === 'dark' ? 'dark' : 'light'];
  const { status, people, message, reload } = { message: '', ...usePeople() };

  // 추천: 멀어진 관계(재연락 허용) 중 연락이 가장 오래 끊긴 순
  const candidates = useMemo(
    () =>
      people
        .filter((p) => p.status === 'DRIFTED' && p.reconnectAllowed)
        .sort((a, b) => (a.lastContactAt ?? '0000').localeCompare(b.lastContactAt ?? '0000')),
    [people],
  );
  const [skipCount, setSkipCount] = useState(0);
  const hero: Person | undefined = candidates[skipCount % Math.max(candidates.length, 1)];

  const [heroMemory, setHeroMemory] = useState<Memory | null>(null);
  useEffect(() => {
    setHeroMemory(null);
    if (!hero) return;
    let cancelled = false;
    fetchMemories(hero.id)
      .then((memories) => {
        if (!cancelled) setHeroMemory(memories[0] ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hero?.id]);

  const counts = useMemo(
    () => ({
      CONNECTED: people.filter((p) => p.status === 'CONNECTED').length,
      DRIFTED: people.filter((p) => p.status === 'DRIFTED').length,
      ESTRANGED: people.filter((p) => p.status === 'ESTRANGED').length,
    }),
    [people],
  );

  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
  useFocusEffect(
    useCallback(() => {
      reload();
      fetchActiveMissions()
        .then(setActiveMissions)
        .catch(() => setActiveMissions([]));
    }, [reload]),
  );

  const stepLabel: Record<Mission['step'], string> = {
    WARMUP: '워밍업',
    BOOSTER: '용기 채우는 중',
    DRAFT: '초안 쓰는 중',
    SENT: '답장 기다리는 중',
    DONE: '완료',
  };

  const onCourage = () => {
    if (hero)
      router.push({ pathname: '/mission/[personId]', params: { personId: String(hero.id) } });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          <ThemedText type="small" themeColor="textSecondary">
            {formatToday()}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.headline}>
            오늘, 한 사람만{'\n'}이어볼까요?
          </ThemedText>

          {status === 'error' && (
            <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
              <ThemedText type="smallBold">서버에 연결하지 못했어요</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                backend를 실행했는지 확인해 주세요. ({message})
              </ThemedText>
              <Pressable
                onPress={reload}
                style={({ pressed }) => [
                  styles.cta,
                  { backgroundColor: theme.green },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                  다시 시도
                </ThemedText>
              </Pressable>
            </ThemedView>
          )}

          {status === 'ready' && !hero && (
            <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
              <ThemedText type="smallBold">다시 잇고 싶은 사람이 아직 없어요</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                사람들 탭에서 마음이 쓰이는 사람을 등록하면, 잇다가 매일 한 명씩 추천해
                드려요.
              </ThemedText>
            </ThemedView>
          )}

          {hero && (
            <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
              <View style={[styles.pill, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText type="small" style={{ color: statusColors.DRIFTED, fontSize: 12 }}>
                  {RelationStatusLabels[hero.status]}
                </ThemedText>
              </View>

              <View style={styles.whoRow}>
                <View style={[styles.avatar, { backgroundColor: theme.green }]}>
                  <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                    {hero.nickname.slice(0, 2)}
                  </ThemedText>
                </View>
                <View style={styles.whoText}>
                  <ThemedText type="default" style={styles.heroName}>
                    {hero.nickname}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {RelationTypeLabels[hero.relationType]} · {sinceLabel(hero.lastContactAt)}
                  </ThemedText>
                </View>
              </View>

              {heroMemory && (
                <View style={[styles.memoryBox, { backgroundColor: theme.background }]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {MemoryCategoryLabels[heroMemory.category].emoji}{' '}
                    <ThemedText type="smallBold" style={{ color: theme.coral }}>
                      {MemoryCategoryLabels[heroMemory.category].label}
                      {heroMemory.year ? ` · ${heroMemory.year}` : ''}
                    </ThemedText>
                    {heroMemory.note ? ` — “${heroMemory.note}”` : ''}
                  </ThemedText>
                </View>
              )}

              <Pressable
                onPress={onCourage}
                style={({ pressed }) => [
                  styles.cta,
                  { backgroundColor: theme.coral },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                  용기 내보기
                </ThemedText>
              </Pressable>
              {candidates.length > 1 && (
                <Pressable
                  onPress={() => setSkipCount((n) => n + 1)}
                  style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    다음에 할게요
                  </ThemedText>
                </Pressable>
              )}
            </ThemedView>
          )}

          {activeMissions.map((m) => (
            <Pressable
              key={m.id}
              onPress={() =>
                router.push({
                  pathname: '/mission/[personId]',
                  params: { personId: String(m.personId) },
                })
              }>
              <ThemedView
                type="backgroundElement"
                style={[styles.missionCard, { borderColor: theme.border }]}>
                <View style={styles.missionText}>
                  <ThemedText type="smallBold">진행 중 미션 · {m.personNickname}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {stepLabel[m.step]}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" style={{ color: theme.coral }}>
                  이어가기 →
                </ThemedText>
              </ThemedView>
            </Pressable>
          ))}

          {people.length > 0 && (
            <View style={styles.countRow}>
              {(['CONNECTED', 'DRIFTED', 'ESTRANGED'] as const).map((s) => (
                <ThemedView
                  key={s}
                  type="backgroundElement"
                  style={[styles.countCard, { borderColor: theme.border }]}>
                  <View style={[styles.dot, { backgroundColor: statusColors[s] }]} />
                  <ThemedText type="smallBold">{counts[s]}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.countLabel}>
                    {RelationStatusLabels[s].replace(' 관계', '')}
                  </ThemedText>
                </ThemedView>
              ))}
            </View>
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
    paddingTop: Platform.select({ web: Spacing.six, default: Spacing.three }),
    paddingBottom: BottomTabInset + Spacing.four,
  },
  headline: {
    marginBottom: Spacing.two,
  },
  card: {
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: Radius.chip,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  whoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  whoText: {
    flex: 1,
    gap: Spacing.half,
  },
  heroName: {
    fontSize: 20,
    fontWeight: 700,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryBox: {
    borderRadius: Radius.button,
    padding: Spacing.three,
  },
  cta: {
    borderRadius: Radius.button,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  ghost: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
  missionCard: {
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
  },
  missionText: {
    flex: 1,
    gap: Spacing.half,
  },
  countRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  countCard: {
    flex: 1,
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  countLabel: {
    fontSize: 12,
  },
});
