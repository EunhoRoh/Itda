import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMemories, fetchPerson, type Memory, type Person } from '@/api/people';
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

  useFocusEffect(
    useCallback(() => {
      fetchPerson(id).then(setPerson).catch(() => {});
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
  pressed: {
    opacity: 0.7,
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
