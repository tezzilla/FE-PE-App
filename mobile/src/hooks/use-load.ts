import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { useSession } from '@/ctx';
import { ApiError } from '@/lib/api';

/**
 * Load data with the session token. Reloads whenever the screen regains focus
 * (so readiness updates after a practice session) and signs out on an expired token.
 */
export function useLoad<T>(load: (token: string) => Promise<T>, { reloadOnFocus = true } = {}) {
  const { token, signOut } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const loaded = useRef(false);

  const run = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      setData(await load(token));
      setError(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return signOut();
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (reloadOnFocus || !loaded.current) {
        loaded.current = true;
        run();
      }
    }, [run, reloadOnFocus]),
  );

  return { data, error, refreshing, reload: run };
}
