import { apiGet, apiSend } from './client';

export type MissionStep = 'WARMUP' | 'BOOSTER' | 'DRAFT' | 'SENT' | 'DONE';
export type MissionResult = 'REPLIED' | 'NO_REPLY' | 'NOT_SENT';

export type Mission = {
  id: number;
  personId: number;
  personNickname: string;
  step: MissionStep;
  result: MissionResult | null;
};

export function startOrResumeMission(personId: number) {
  return apiSend<Mission>(`/api/people/${personId}/missions`, 'POST');
}

export function fetchActiveMissions() {
  return apiGet<Mission[]>('/api/missions/active');
}

export function advanceMission(missionId: number) {
  return apiSend<Mission>(`/api/missions/${missionId}/advance`, 'PATCH');
}

export function recordMissionResult(missionId: number, result: MissionResult) {
  return apiSend<Mission>(`/api/missions/${missionId}/result?result=${result}`, 'PATCH');
}
