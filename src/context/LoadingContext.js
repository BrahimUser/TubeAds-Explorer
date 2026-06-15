import { createContext, useContext, useMemo } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import GlobalLoader from '../components/GlobalLoader';

const LoadingContext = createContext({ isLoading: false });

function shouldShowGlobalLoader(query) {
  if (query.state.fetchStatus !== 'fetching') return false;
  if (query.state.status === 'pending') return true;
  return query.meta?.showGlobalLoader === true;
}

export function LoadingProvider({ children }) {
  const mutatingCount = useIsMutating();
  const fetchingCount = useIsFetching({ predicate: shouldShowGlobalLoader });
  const isLoading = mutatingCount > 0 || fetchingCount > 0;

  const value = useMemo(() => ({ isLoading }), [isLoading]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <GlobalLoader visible={isLoading} />
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  return useContext(LoadingContext);
}
