import { apiGet, apiSend } from './client';

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

export function fetchPerson(id: number) {
  return apiGet<Person>(`/api/people/${id}`);
}

export type PersonRequest = {
  nickname: string;
  relationType: RelationType;
  status: RelationStatus;
  safetyConcern: boolean;
  lastContactAt?: string;
  contactCycleDays?: number;
};

export function createPerson(request: PersonRequest) {
  return apiSend<Person>('/api/people', 'POST', request);
}

export function changePersonStatus(id: number, status: RelationStatus) {
  return apiSend<Person>(`/api/people/${id}/status?status=${status}`, 'PATCH');
}

export function changeContactCycle(id: number, days: number | null) {
  const query = days ? `?days=${days}` : '';
  return apiSend<Person>(`/api/people/${id}/contact-cycle${query}`, 'PATCH');
}

export type MemoryRequest = {
  category: MemoryCategory;
  emotion?: EmotionTag;
  year?: number;
  note?: string;
};

export function createMemory(personId: number, request: MemoryRequest) {
  return apiSend<Memory>(`/api/people/${personId}/memories`, 'POST', request);
}

export function fetchMemories(personId: number) {
  return apiGet<Memory[]>(`/api/people/${personId}/memories`);
}
