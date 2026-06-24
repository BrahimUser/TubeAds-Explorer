import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchListings } from '../services/search';
import { queryKeys } from '../queries/keys';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

function isAbortError(err) {
  return (
    err?.name === 'AbortError' ||
    err?.name === 'CanceledError' ||
    err?.code === 'ERR_CANCELED'
  );
}

export function useProductSearch(query) {
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const trimmed = String(query ?? '').trim();
    const timer = setTimeout(() => setDebouncedQuery(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const enabled = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const result = useQuery({
    queryKey: queryKeys.listings.search(debouncedQuery),
    queryFn: ({ signal }) => searchListings(debouncedQuery, { signal }),
    enabled,
    staleTime: 30_000,
    retry: 1,
    throwOnError: false,
  });

  const error = result.error && !isAbortError(result.error) ? result.error : null;

  return {
    items: enabled ? result.data ?? [] : [],
    isLoading: enabled && result.isLoading,
    isFetching: enabled && result.isFetching,
    error,
    debouncedQuery,
    enabled,
    refetch: result.refetch,
  };
}
