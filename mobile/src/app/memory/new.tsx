import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createMemory,
  fetchPerson,
  type EmotionTag,
  type MemoryCategory,
  type Person,
} from '@/api/people';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EmotionTagLabels, MemoryCategoryLabels } from '@/constants/labels';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CATEGORIES = Object.keys(MemoryCategoryLabels) as MemoryCategory[];
const EMOTIONS = Object.keys(EmotionTagLabels) as EmotionTag[];
const THIS_YEAR = new Date().getFullYear();
const YEAR_CHOICES = [THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 3, THIS_YEAR - 5, THIS_YEAR - 10];

export default function NewMemoryScreen() {
  const theme = useTheme();
  const { personId } = useLocalSearchParams<{ personId: string }>();
  const id = Number(personId);

  const [person, setPerson] = useState<Person | null>(null);
  const [category, setCategory] = useState<MemoryCategory | null>(null);
  const [emotion, setEmotion] = useState<EmotionTag | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPerson(id).then(setPerson).catch(() => {});
  }, [id]);

  const save = async () => {
    if (!category) return;
    setSaving(true);
    try {
      await createMemory(id, {
        category,
        emotion: emotion ?? undefined,
        year: year ?? undefined,
        note: note.trim() || undefined,
      });
      router.back();
    } catch (e) {
      setSaving(false);
      Alert.alert('저장하지 못했어요', e instanceof Error ? e.message : '다시 시도해 주세요');
    }
  };

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
            {person && <ThemedText type="smallBold">{person.nickname} 님과의 추억</ThemedText>}
          </View>

          {!category ? (
            <>
              <ThemedText type="subtitle" style={styles.q}>
                어떤 추억인가요?
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                고르기만 하세요. 쓰는 건 마지막에 한 줄이면 충분해요.
              </ThemedText>
              <View style={styles.grid}>
                {CATEGORIES.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    style={({ pressed }) => [
                      styles.gridItem,
                      { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText style={styles.gridEmoji}>
                      {MemoryCategoryLabels[c].emoji}
                    </ThemedText>
                    <ThemedText type="small" style={styles.gridLabel}>
                      {MemoryCategoryLabels[c].label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <>
              <Pressable onPress={() => setCategory(null)}>
                <View style={[styles.pickedCategory, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="smallBold" style={{ color: theme.coral }}>
                    {MemoryCategoryLabels[category].emoji} {MemoryCategoryLabels[category].label}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                    바꾸기
                  </ThemedText>
                </View>
              </Pressable>

              <View style={[styles.promptBox, { borderColor: theme.border }]}>
                <ThemedText type="small" style={{ color: theme.green, fontStyle: 'italic' }}>
                  💭 {MemoryCategoryLabels[category].prompt}
                </ThemedText>
              </View>

              <ThemedText type="smallBold">어떤 마음이 남아 있나요? (선택)</ThemedText>
              <View style={styles.chipRow}>
                {EMOTIONS.map((e) => {
                  const active = emotion === e;
                  return (
                    <Pressable
                      key={e}
                      onPress={() => setEmotion(active ? null : e)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? theme.green : theme.backgroundElement,
                          borderColor: theme.border,
                        },
                      ]}>
                      <ThemedText
                        type="small"
                        style={{ color: active ? theme.onAccent : theme.textSecondary }}>
                        {EmotionTagLabels[e]}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <ThemedText type="smallBold">언제쯤이었나요? (선택)</ThemedText>
              <View style={styles.chipRow}>
                {YEAR_CHOICES.map((y) => {
                  const active = year === y;
                  return (
                    <Pressable
                      key={y}
                      onPress={() => setYear(active ? null : y)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? theme.green : theme.backgroundElement,
                          borderColor: theme.border,
                        },
                      ]}>
                      <ThemedText
                        type="small"
                        style={{ color: active ? theme.onAccent : theme.textSecondary }}>
                        {y === THIS_YEAR ? '올해' : `${y}년쯤`}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <ThemedText type="smallBold">한 줄로 남기면 (선택)</ThemedText>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={MemoryCategoryLabels[category].prompt}
                placeholderTextColor={theme.textSecondary}
                maxLength={200}
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
                disabled={saving}
                onPress={save}
                style={({ pressed }) => [
                  styles.cta,
                  { backgroundColor: theme.coral },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                  {saving ? '잇는 중…' : '🧵 추억 이어두기'}
                </ThemedText>
              </Pressable>
              <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
                남긴 추억은 다시 연락할 때 첫 마디의 재료가 되어줘요.
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
  q: {
    fontSize: 28,
    lineHeight: 40,
    marginTop: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  gridItem: {
    width: '31%',
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
  },
  gridEmoji: {
    fontSize: 22,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: 600,
  },
  pickedCategory: {
    borderRadius: Radius.button,
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promptBox: {
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    padding: Spacing.three,
  },
  chipRow: {
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
  input: {
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    fontSize: 15,
  },
  cta: {
    borderRadius: Radius.button,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  note: {
    textAlign: 'center',
    fontSize: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});
