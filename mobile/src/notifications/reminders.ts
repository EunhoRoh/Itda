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

/**
 * 애프터케어 — 재연결 후 1주/1개월/1주년 회상 체크인 (docs/12 §15-5).
 * 관계는 이어진 순간이 끝이 아니라 시작이라는 설계. 끄고 싶으면 상세에서 주기 해제와 함께 관리.
 */
const AFTERCARE_STEPS: { key: string; days: number; title: (n: string) => string; body: string }[] = [
  {
    key: 'week',
    days: 7,
    title: (n) => `${n} 님과 다시 이어진 지 일주일이에요`,
    body: '첫 연락 이후 어떠셨어요? 가벼운 안부 한 줄이면 충분해요.',
  },
  {
    key: 'month',
    days: 30,
    title: (n) => `${n} 님과의 한 달, 어떤 추억이 생겼나요?`,
    body: '새로 생긴 기억을 남겨두면 다음 대화의 재료가 되어줘요.',
  },
  {
    key: 'year',
    days: 365,
    title: (n) => `${n} 님과 다시 이어진 지 1년이에요 🧵`,
    body: '당신에게 그 사람은 어떤 사람인가요? 오늘, 그 마음을 전해보세요.',
  },
];

export async function scheduleAftercare(personId: number, nickname: string) {
  if (!supported) return;
  if (!(await ensurePermission())) return;
  for (const step of AFTERCARE_STEPS) {
    await Notifications.scheduleNotificationAsync({
      identifier: `aftercare-${personId}-${step.key}`,
      content: {
        title: step.title(nickname),
        body: step.body,
        data: { personId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: step.days * 24 * 60 * 60,
        repeats: false,
        channelId: 'reminders',
      },
    }).catch(() => {});
  }
}

export async function cancelAftercare(personId: number) {
  if (!supported) return;
  for (const step of AFTERCARE_STEPS) {
    await Notifications.cancelScheduledNotificationAsync(`aftercare-${personId}-${step.key}`).catch(
      () => {},
    );
  }
}
