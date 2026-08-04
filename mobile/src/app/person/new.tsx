import * as Contacts from 'expo-contacts';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createPerson, type RelationStatus, type RelationType } from '@/api/people';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RelationTypeLabels } from '@/constants/labels';
import { MaxContentWidth, Radius, Spacing, StatusColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

const RELATION_TYPES = Object.keys(RelationTypeLabels) as RelationType[];

const STATUS_OPTIONS: { key: RelationStatus; title: string; sub: string }[] = [
  { key: 'CONNECTED', title: '잘 지내요', sub: '연락을 이어가도록 도와드릴게요' },
  { key: 'DRIFTED', title: '멀어졌어요', sub: '다시 연락할 용기를 준비해요' },
  { key: 'ESTRANGED', title: '마음이 상했어요', sub: '천천히, 회복의 여정부터 시작해요' },
];

export default function NewPersonScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const statusColors = StatusColors[scheme === 'dark' ? 'dark' : 'light'];

  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState('');
  const [relationType, setRelationType] = useState<RelationType | null>(null);
  const [status, setStatus] = useState<RelationStatus | null>(null);
  const [safetyConcern, setSafetyConcern] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  // 시스템 연락처 피커 — 전체 목록 접근 없이 1명만 선택 (결정로그 #4: 선택적 불러오기)
  const pickFromContacts = async () => {
    try {
      const contact = await Contacts.presentContactPickerAsync();
      if (contact?.name) setNickname(contact.name.slice(0, 50));
    } catch (e) {
      Alert.alert(
        '연락처를 열지 못했어요',
        e instanceof Error ? e.message : '직접 입력으로 진행해 주세요',
      );
    }
  };

  const canNext =
    (step === 0 && nickname.trim().length > 0) ||
    (step === 1 && relationType !== null) ||
    (step === 2 && status !== null) ||
    (step === 3 && safetyConcern !== null);

  const submit = async () => {
    if (!relationType || !status || safetyConcern === null) return;
    setSaving(true);
    try {
      await createPerson({
        nickname: nickname.trim(),
        relationType,
        status,
        safetyConcern,
      });
      router.back();
    } catch (e) {
      setSaving(false);
      Alert.alert('저장하지 못했어요', e instanceof Error ? e.message : '다시 시도해 주세요');
    }
  };

  const next = () => {
    if (step < 3) setStep(step + 1);
    else submit();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <Pressable onPress={() => (step > 0 ? setStep(step - 1) : router.back())} hitSlop={12}>
              <ThemedText type="small" themeColor="textSecondary">
                {step > 0 ? '← 이전' : '← 닫기'}
              </ThemedText>
            </Pressable>
            <ThemedText type="small" themeColor="textSecondary">
              {step + 1} / 4
            </ThemedText>
          </View>

          {step === 0 && (
            <>
              <ThemedText type="subtitle" style={styles.q}>
                누구를{'\n'}이어볼까요?
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                실명 대신 부르는 이름이나 별칭도 좋아요. 기록은 당신만 볼 수 있어요.
              </ThemedText>
              <TextInput
                value={nickname}
                onChangeText={setNickname}
                maxLength={50}
                placeholder="예: 지훈, 어머니, 김 대리"
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
              {Platform.OS !== 'web' && (
                <>
                  <Pressable
                    onPress={pickFromContacts}
                    style={({ pressed }) => [
                      styles.contactBtn,
                      { borderColor: theme.green },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="smallBold" style={{ color: theme.green }}>
                      📇 연락처에서 고르기
                    </ThemedText>
                  </Pressable>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.contactNote}>
                    시스템 선택창에서 한 명만 고를 수 있어요. 연락처 전체를 읽거나 서버로 보내지
                    않아요.
                  </ThemedText>
                </>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <ThemedText type="subtitle" style={styles.q}>
                {nickname.trim()} 님과{'\n'}어떤 사이인가요?
              </ThemedText>
              <View style={styles.typeGrid}>
                {RELATION_TYPES.map((t) => {
                  const active = relationType === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setRelationType(t)}
                      style={[
                        styles.typeChip,
                        {
                          backgroundColor: active ? theme.green : theme.backgroundElement,
                          borderColor: active ? theme.green : theme.border,
                        },
                      ]}>
                      <ThemedText
                        type="smallBold"
                        style={{ color: active ? theme.onAccent : theme.text }}>
                        {RelationTypeLabels[t]}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <ThemedText type="subtitle" style={styles.q}>
                지금 어떤{'\n'}상태인가요?
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                상태에 따라 잇다가 다른 여정을 준비해요.
              </ThemedText>
              {STATUS_OPTIONS.map((o) => {
                const active = status === o.key;
                return (
                  <Pressable
                    key={o.key}
                    onPress={() => setStatus(o.key)}
                    style={[
                      styles.option,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: active ? statusColors[o.key] : theme.border,
                        borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                      },
                    ]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColors[o.key] }]} />
                    <View style={styles.optionText}>
                      <ThemedText type="smallBold" style={{ fontSize: 15 }}>
                        {o.title}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                        {o.sub}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </>
          )}

          {step === 3 && (
            <>
              <ThemedText type="subtitle" style={styles.q}>
                마지막으로,{'\n'}안전 확인이에요
              </ThemedText>
              <ThemedText type="default" themeColor="textSecondary" style={styles.para}>
                이 관계에서 위협이나 폭력을 경험한 적이 있나요? 솔직하게 답해 주세요. 잇다는 어떤
                답이든 판단하지 않아요.
              </ThemedText>
              {(
                [
                  [false, '아니요, 없었어요'],
                  [true, '네, 있었어요'],
                ] as const
              ).map(([value, label]) => {
                const active = safetyConcern === value;
                return (
                  <Pressable
                    key={String(value)}
                    onPress={() => setSafetyConcern(value)}
                    style={[
                      styles.option,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: active ? theme.green : theme.border,
                        borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                      },
                    ]}>
                    <ThemedText type="smallBold" style={{ fontSize: 15 }}>
                      {label}
                    </ThemedText>
                  </Pressable>
                );
              })}
              {safetyConcern === true && (
                <ThemedView
                  type="backgroundElement"
                  style={[styles.safetyNote, { borderColor: theme.border }]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    말해줘서 고마워요. 당신의 안전이 화해보다 먼저예요. 이 관계에는 재연락을
                    권하지 않고, 기록과 마음 정리 기능만 열어둘게요. 도움이 필요하면
                    여성긴급전화 1366, 정신건강 위기상담 1577-0199에 연락할 수 있어요.
                  </ThemedText>
                </ThemedView>
              )}
            </>
          )}

          <Pressable
            disabled={!canNext || saving}
            onPress={next}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: canNext ? theme.coral : theme.border },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
              {step < 3 ? '다음' : saving ? '저장 중…' : '이어두기'}
            </ThemedText>
          </Pressable>

          <View style={styles.progress}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressBar,
                  { backgroundColor: i <= step ? theme.coral : theme.border },
                ]}
              />
            ))}
          </View>
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
    marginTop: Spacing.three,
  },
  para: {
    fontSize: 15,
    lineHeight: 24,
  },
  input: {
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    fontSize: 17,
  },
  contactBtn: {
    borderRadius: Radius.button,
    borderWidth: 1.5,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  contactNote: {
    fontSize: 12,
    textAlign: 'center',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  typeChip: {
    borderRadius: Radius.chip,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  option: {
    borderRadius: Radius.card,
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  optionText: {
    flex: 1,
    gap: Spacing.half,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  safetyNote: {
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
  cta: {
    borderRadius: Radius.button,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  progress: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});
