import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RelationStatus } from '@/api/people';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RelationStatusLabels, RelationTypeLabels } from '@/constants/labels';
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

const FILTERS: { key: RelationStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'CONNECTED', label: '이어진' },
  { key: 'DRIFTED', label: '멀어진' },
  { key: 'ESTRANGED', label: '틀어진' },
];

export default function PeopleScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const statusColors = StatusColors[scheme === 'dark' ? 'dark' : 'light'];
  const { status, people } = usePeople();
  const [filter, setFilter] = useState<RelationStatus | 'ALL'>('ALL');

  const filtered = useMemo(
    () => (filter === 'ALL' ? people : people.filter((p) => p.status === filter)),
    [people, filter],
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">내 사람들</ThemedText>

          <View style={styles.filterRow}>
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: active ? theme.green : theme.backgroundElement,
                      borderColor: theme.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText
                    type="small"
                    style={{ color: active ? theme.onAccent : theme.textSecondary }}>
                    {f.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {status === 'ready' && filtered.length === 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              아직 등록된 사람이 없어요. 등록 화면은 다음 단계에서 열려요.
            </ThemedText>
          )}

          {filtered.map((p) => (
            <ThemedView
              key={p.id}
              type="backgroundElement"
              style={[styles.personCard, { borderColor: theme.border }]}>
              <View style={[styles.statusBar, { backgroundColor: statusColors[p.status] }]} />
              <View style={styles.personBody}>
                <ThemedText type="smallBold" style={styles.personName}>
                  {p.nickname}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {RelationTypeLabels[p.relationType]} · {RelationStatusLabels[p.status]}
                  {!p.reconnectAllowed && ' · 보호 모드'}
                </ThemedText>
              </View>
            </ThemedView>
          ))}
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
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    borderRadius: Radius.chip,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  personCard: {
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  statusBar: {
    width: 4,
  },
  personBody: {
    padding: Spacing.three,
    gap: Spacing.half,
  },
  personName: {
    fontSize: 16,
  },
  pressed: {
    opacity: 0.7,
  },
});
