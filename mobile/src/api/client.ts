import { Platform } from 'react-native';

/**
 * 로컬 개발 기본값:
 * - 웹/iOS 시뮬레이터는 localhost, Android 에뮬레이터는 10.0.2.2가 호스트 머신
 * - 실기기(Expo Go)는 EXPO_PUBLIC_API_URL에 PC의 LAN 주소를 넣어 사용
 */
const DEV_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8090',
  default: 'http://localhost:8090',
});

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? DEV_BASE_URL;

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`GET ${path} 실패 (${res.status})`);
  }
  return res.json() as Promise<T>;
}
