import { apiGet, apiSend } from './client';
import type {
  HintContext,
  HintPeriod,
  LetterEmotion,
  LetterStatus,
} from '@/constants/letter-content';

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
  refined: boolean;
  status: LetterStatus;
  senderDecision: SenderDecision;
  hintContext: HintContext | null;
  hintPeriod: HintPeriod | null;
  hintNow: string | null;
  createdAt: string;
};

export type LetterRequest = {
  personId: number;
  anonymous: boolean;
  senderName: string;
  emotion: LetterEmotion;
  body: string;
  preset: boolean;
  refined?: boolean;
  hintContext?: HintContext;
  hintPeriod?: HintPeriod;
  hintNow?: string;
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
