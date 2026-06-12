import { useEffect, useRef } from 'react';

/**
 * Polls `fetchFn` on an interval. Returns an unsubscribe function pattern
 * compatible with Firestore `onSnapshot` listeners (returns cleanup fn).
 */
export function createPoller(fetchFn, onChange, onError, intervalMs = 10000) {
  let cancelled = false;

  async function run() {
    try {
      const result = await fetchFn();
      if (!cancelled) onChange(result);
    } catch (err) {
      if (!cancelled) onError?.(err);
    }
  }

  run();
  const id = setInterval(run, intervalMs);

  return () => {
    cancelled = true;
    clearInterval(id);
  };
}

export function usePolling(fetchFn, onResult, deps = [], { enabled = true, intervalMs = 10000 } = {}) {
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    if (!enabled) return undefined;
    return createPoller(
      fetchFn,
      (data) => onResultRef.current?.(data),
      null,
      intervalMs,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs, ...deps]);
}
