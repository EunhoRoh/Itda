import { useCallback, useRef, useState } from 'react';

import { fetchPeople, type Person } from '@/api/people';

type PeopleState =
  | { status: 'loading'; people: Person[] }
  | { status: 'error'; people: Person[]; message: string }
  | { status: 'ready'; people: Person[] };

/**
 * 목록 로드는 화면의 useFocusEffect에서 reload()로 트리거한다 (마운트 시 자동 호출 없음 —
 * 포커스 이펙트와 이중 발사되면 늦게 도착한 응답이 상태를 덮는 레이스가 생긴다).
 * 실패해도 이미 보여주던 people은 유지한다.
 */
export function usePeople() {
  const [state, setState] = useState<PeopleState>({ status: 'loading', people: [] });
  const seq = useRef(0);

  const reload = useCallback(async () => {
    const my = ++seq.current;
    setState((prev) => ({ status: 'loading', people: prev.people }));
    try {
      const people = await fetchPeople();
      if (my !== seq.current) return;
      setState({ status: 'ready', people });
    } catch (e) {
      if (my !== seq.current) return;
      setState((prev) => ({
        status: 'error',
        people: prev.people,
        message: e instanceof Error ? e.message : '서버에 연결하지 못했어요',
      }));
    }
  }, []);

  return { ...state, reload };
}
