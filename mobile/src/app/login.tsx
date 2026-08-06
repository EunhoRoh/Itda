import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * 로그인 (P2-0 준비 — docs/13).
 * 카카오/Apple 실연동은 개발자 콘솔 앱 등록 후: 지금은 단일 사용자 dev 모드로 계속 사용 가능.
 */
export default function LoginScreen() {
  const theme = useTheme();

  const notReady = (provider: string) =>
    Alert.alert(
      `${provider} 로그인 준비 중`,
      '개발자 콘솔에 앱을 등록하면 열려요. 지금은 로그인 없이 모든 기능을 쓸 수 있어요.',
    );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <ThemedText style={styles.logo}>🧵</ThemedText>
          <ThemedText type="title" style={styles.title}>
            잇다
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.tagline}>
            사람과 사람을 잇다{'\n'}마음과 마음을 잇다
          </ThemedText>
        </View>

        <View style={styles.buttons}>
          <Pressable
            onPress={() => notReady('카카오')}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: '#FEE500' },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={{ color: '#191919' }}>
              💬 카카오로 시작하기
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => notReady('Apple')}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: theme.text },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={{ color: theme.background }}>
               Apple로 시작하기
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}>
            <ThemedText type="small" themeColor="textSecondary">
              로그인 없이 둘러볼게요
            </ThemedText>
          </Pressable>
        </View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          가입하면 마음 배달을 주고받을 수 있어요.{'\n'}관계 기록은 언제나 당신의 기기와 계정에만.
        </ThemedText>
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
    paddingHorizontal: Spacing.five,
    justifyContent: 'center',
    gap: Spacing.five,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    fontSize: 56,
    lineHeight: 68,
  },
  title: {
    fontSize: 40,
    lineHeight: 48,
  },
  tagline: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 24,
  },
  buttons: {
    gap: Spacing.two,
  },
  btn: {
    borderRadius: Radius.button,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  ghost: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  note: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 17,
  },
});
