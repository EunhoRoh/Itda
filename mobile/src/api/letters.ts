import { apiGet, apiSend } from './client';
import type { LetterEmotion, LetterStatus } from '@/constants/letter-content';

export type LetterDirection = 'SENT' | 'RECEIVED';
export type SenderDecision = 'NONE' | 'REVEAL' | 'ANON_CHAT' | 'KEEP_HEART';

export type Letter = {
  id: number;
  direction: LetterDirection;
  personId: number | null;
  anonymous: boolean;
  senderName: string;
  emotion: LetterEmotion;
  body: string;
  preset: boolean;
  status: LetterStatus;
  senderDecision: SenderDecision;
  createdAt: string;
};

export type LetterRequest = {
  personId: number;
  anonymous: boolean;
  senderName: string;
  emotion: LetterEmotion;
  body: string;
  preset: boolean;
};

export function sendLetter(request: LetterRequest) {
  return apiSend<Letter>('/api/letters', 'POST', request);
}

export function fetchLetters(direction: LetterDirection) {
  return apiGet<Letter[]>(`/api/letters?direction=${direction}`);
}

export function reactToLetter(letterId: number, reaction: Exclude<LetterStatus, 'DELIVERED'>) {
  return apiSend<Letter>(`/api/letters/${letterId}/react?reaction=${reaction}`, 'PATCH');
}

export function decideLetter(letterId: number, decision: Exclude<SenderDecision, 'NONE'>) {
  return apiSend<Letter>(`/api/letters/${letterId}/decide?decision=${decision}`, 'PATCH');
}

export function refineLetter(emotion: LetterEmotion, body: string, relationLabel?: string) {
  return apiSend<{ drafts: string[] }>('/api/letters/refine', 'POST', {
    emotion,
    body,
    relationLabel,
  });
}
