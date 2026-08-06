import { apiGet, apiSend } from './client';

/** 커넥트 후 대화방 (docs/12 §15-2) — com.itda.domain.chat 과 1:1 */
export type ChatRoomStatus = 'OPEN' | 'CLOSED';
export type ChatRole = 'SENDER' | 'RECIPIENT' | 'ASSISTANT';

export type ChatRoom = {
  id: number;
  letterId: number;
  anonymous: boolean;
  status: ChatRoomStatus;
};

export type ChatMessage = {
  id: number;
  role: ChatRole;
  body: string;
  createdAt: string;
};

export function fetchRoomByLetter(letterId: number) {
  return apiGet<ChatRoom>(`/api/chats/by-letter/${letterId}`);
}

export function fetchRoom(roomId: number) {
  return apiGet<ChatRoom>(`/api/chats/${roomId}`);
}

export function fetchMessages(roomId: number, afterId?: number) {
  const query = afterId ? `?afterId=${afterId}` : '';
  return apiGet<ChatMessage[]>(`/api/chats/${roomId}/messages${query}`);
}

export function postMessage(roomId: number, role: Exclude<ChatRole, 'ASSISTANT'>, body: string) {
  return apiSend<ChatMessage>(`/api/chats/${roomId}/messages`, 'POST', { role, body });
}

/** AI 동석 도우미 한 마디 — 결과는 방의 모두에게 보인다 */
export function requestAssist(roomId: number) {
  return apiSend<ChatMessage>(`/api/chats/${roomId}/assist`, 'POST');
}

export function closeRoom(roomId: number) {
  return apiSend<ChatRoom>(`/api/chats/${roomId}/close`, 'PATCH');
}
