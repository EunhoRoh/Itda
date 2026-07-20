import { apiGet } from './client';

/** 백엔드 enum과 1:1 (com.itda.domain.person / memory) */
export type RelationType = 'FAMILY' | 'FRIEND' | 'PARTNER' | 'MENTOR' | 'COLLEAGUE' | 'OTHER';
export type RelationStatus = 'CONNECTED' | 'DRIFTED' | 'ESTRANGED';
export type MemoryCategory =
  | 'TRAVEL'
  | 'SCHOOL_DAYS'
  | 'FOOD'
  | 'LAUGHTER'
  | 'HELP'
  | 'ACHIEVEMENT'
  | 'DAILY'
  | 'GIFT'
  | 'CUSTOM';
export type EmotionTag = 'LONGING' | 'GRATITUDE' | 'SORRY' | 'JOY' | 'REGRET';

export type Person = {
  id: number;
  nickname: string;
  relationType: RelationType;
  status: RelationStatus;
  reconnectAllowed: boolean;
  lastContactAt: string | null;
  contactCycleDays: number | null;
};

export type Memory = {
  id: number;
  personId: number;
  category: MemoryCategory;
  emotion: EmotionTag | null;
  year: number | null;
  note: string | null;
  photoUrl: string | null;
};

export function fetchPeople(status?: RelationStatus) {
  const query = status ? `?status=${status}` : '';
  return apiGet<Person[]>(`/api/people${query}`);
}

export function fetchMemories(personId: number) {
  return apiGet<Memory[]>(`/api/people/${personId}/memories`);
}
