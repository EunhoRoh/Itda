import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * 로컬 알림 리마인더 — 서버 푸시 없이 기기에서 예약 (MVP).
 * 웹은 미지원이라 전부 no-op. 실기기에서만 동작 확인 가능.
 */

const supported = Platform.OS !== 'web';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function initNotifications() {
  if (!supported) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: '잇다 리마인더',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

async function ensurePermission(): Promise<boolean> {
  if (!supported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** 관계별 연락 주기 알림 — days 간격 반복. days가 없으면 해제만 한다. */
export async function syncContactCycleReminder(
  personId: number,
  nickname: string,
  days: number | null,
): Promise<boolean> {
  if (!supported) return false;
  const identifier = `cycle-${personId}`;
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
  if (!days) return true;
  if (!(await ensurePermission())) return false;
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: `${nickname} 님과 이을 시간이에요 🧵`,
      body: '가벼운 안부 한 줄이면 충분해요. 잇다가 첫 마디를 도와드릴게요.',
      data: { personId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: days * 24 * 60 * 60,
      repeats: true,
      channelId: 'reminders',
    },
  });
  return true;
}

/** 미션에서 메시지를 보낸 뒤 24시간 후 "어떻게 됐나요?" 1회 알림 */
export async function scheduleMissionFollowUp(personId: number, nickname: string) {
  if (!supported) return;
  if (!(await ensurePermission())) return;
  await Notifications.scheduleNotificationAsync({
    identifier: `mission-${personId}`,
    content: {
      title: `${nickname} 님에게 보낸 마음, 어떻게 됐나요?`,
      body: '답장이 왔다면 기록해 주세요. 아직이어도 괜찮아요 — 기다림도 과정이에요.',
      data: { personId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 24 * 60 * 60,
      repeats: false,
      channelId: 'reminders',
    },
  });
}

export async function cancelMissionFollowUp(personId: number) {
  if (!supported) return;
  await Notifications.cancelScheduledNotificationAsync(`mission-${personId}`).catch(() => {});
}
