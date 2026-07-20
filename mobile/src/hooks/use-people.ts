import { useCallback, useEffect, useState } from 'react';

import { fetchPeople, type Person } from '@/api/people';

type PeopleState =
  | { status: 'loading'; people: Person[] }
  | { status: 'error'; people: Person[]; message: string }
  | { status: 'ready'; people: Person[] };

export function usePeople() {
  const [state, setState] = useState<PeopleState>({ status: 'loading', people: [] });

  const reload = useCallback(async () => {
    setState((prev) => ({ status: 'loading', people: prev.people }));
    try {
      const people = await fetchPeople();
      setState({ status: 'ready', people });
    } catch (e) {
      setState({
        status: 'error',
        people: [],
        message: e instanceof Error ? e.message : '서버에 연결하지 못했어요',
      });
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
