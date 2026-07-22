import { useCallback, useEffect, useState } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Thin fetch-and-store hook so pages don't hand-roll loading/error state per call. */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetcher()
      .then((result) => setData(result))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: () => setReloadToken((t) => t + 1) };
}
