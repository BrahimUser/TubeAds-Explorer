import { createContext, useContext, useEffect, useState } from 'react';
import { getPendingRequestCount, subscribeLoading } from '../api/loadingTracker';
import GlobalLoader from '../components/GlobalLoader';

const LoadingContext = createContext({ isLoading: false });

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(() => getPendingRequestCount() > 0);

  useEffect(() => subscribeLoading((count) => setIsLoading(count > 0)), []);

  return (
    <LoadingContext.Provider value={{ isLoading }}>
      {children}
      <GlobalLoader visible={isLoading} />
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  return useContext(LoadingContext);
}
