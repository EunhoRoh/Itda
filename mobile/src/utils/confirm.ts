import { Alert, Platform } from 'react-native';

/** 확인 다이얼로그 — RN-web에서는 Alert 버튼이 동작하지 않아 window.confirm으로 대체 */
export function confirmAsync(title: string, message: string, okLabel = '네'): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: '아니요', style: 'cancel', onPress: () => resolve(false) },
      { text: okLabel, onPress: () => resolve(true) },
    ]);
  });
}
