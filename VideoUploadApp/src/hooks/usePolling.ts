import { useEffect, useRef } from 'react';

/**
 * Polls `fetchFn` on an interval. Returns an unsubscribe function compatible
 * with former Firestore `onSnapshot` listeners.
 */
export function createPoller<T>(
  fetchFn: () => Promise<T>,
  onChange: (data: T) => void,
  onError: ((err: Error) => void) | undefined,
  intervalMs = 10000,
): () => void {
  let cancelled = false;
  let inFlight = false;

  async function run() {
    if (inFlight) return;
    inFlight = true;
    try {
      const result = await fetchFn();
      if (!cancelled) onChange(result);
    } catch (err) {
      if (!cancelled) onError?.(err as Error);
    } finally {
      inFlight = false;
    }
  }

  void run();
  const id = setInterval(() => void run(), intervalMs);

  return () => {
    cancelled = true;
    clearInterval(id);
  };
}

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  onResult: (data: T) => void,
  deps: unknown[],
  options: { enabled?: boolean; intervalMs?: number } = {},
): void {
  const { enabled = true, intervalMs = 10000 } = options;
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    if (!enabled) return undefined;
    return createPoller(
      fetchFn,
      (data) => onResultRef.current(data),
      undefined,
      intervalMs,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs, ...deps]);
}
