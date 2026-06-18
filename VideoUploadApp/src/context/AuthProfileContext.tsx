import React, {
  createContext,
  useContext,
  useMemo,
} from 'react';
import { useAuthUser } from '../context/AuthContext';

type UserProfileData = Record<string, unknown> | null;

type AuthProfileContextValue = {
  userProfile: UserProfileData;
  profileReady: boolean;
  isAdmin: boolean;
  role: string;
};

const AuthProfileContext = createContext<AuthProfileContextValue | null>(null);

export { AuthProfileContext };

export function AuthProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useAuthUser();

  const value = useMemo<AuthProfileContextValue>(() => {
    if (!user) {
      return {
        userProfile: null,
        profileReady: !initializing,
        isAdmin: false,
        role: '',
      };
    }
    const role = user.role || 'user';
    const isAdmin = role === 'admin';
    return {
      userProfile: {
        phoneNumber: user.phoneNumber,
        displayName: user.displayName,
        role,
        isPro: user.isPro,
        shopName: user.shopName,
        shopLogoUrl: user.shopLogoUrl,
        shopDescription: user.shopDescription,
      },
      profileReady: !initializing,
      isAdmin,
      role,
    };
  }, [
    user?.uid,
    user?.phoneNumber,
    user?.displayName,
    user?.role,
    user?.isPro,
    user?.shopName,
    user?.shopLogoUrl,
    user?.shopDescription,
    initializing,
  ]);

  return <AuthProfileContext.Provider value={value}>{children}</AuthProfileContext.Provider>;
}

export function useAuthProfile(): AuthProfileContextValue {
  const ctx = useContext(AuthProfileContext);
  if (!ctx) {
    throw new Error('useAuthProfile must be used within AuthProfileProvider');
  }
  return ctx;
}
