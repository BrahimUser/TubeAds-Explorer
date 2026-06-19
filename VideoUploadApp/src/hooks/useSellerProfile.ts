import { useCallback, useEffect, useState } from 'react';
import { fetchUser, type SellerProfile } from '../services/users';

export function useSellerProfile(uid: string | null | undefined) {
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(uid));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!uid) {
      setSeller(null);
      setLoading(false);
      setError(null);
      return () => {};
    }

    let alive = true;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const profile = await fetchUser(uid);
        if (!alive) return;
        setSeller(profile);
      } catch (e) {
        if (!alive) return;
        setError(String((e as Error)?.message ?? e));
        setSeller(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [uid]);

  useEffect(() => reload(), [reload]);

  return { seller, loading, error, reload };
}
