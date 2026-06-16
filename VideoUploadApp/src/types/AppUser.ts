export type AppUser = {
  id: string;
  uid: string;
  phoneNumber: string;
  displayName: string;
  email: string | null;
  role: string;
  isPro: boolean;
  shopName: string;
  shopLogoUrl: string;
  shopDescription: string;
  authProvider: string;
  createdAt: string | null;
  updatedAt: string | null;
};

let signOutListener: (() => void) | null = null;

export function registerAuthSignOutListener(fn: () => void): () => void {
  signOutListener = fn;
  return () => {
    if (signOutListener === fn) signOutListener = null;
  };
}

export function notifyAuthSignedOut(): void {
  signOutListener?.();
}

export function profileToAppUser(profile: Record<string, unknown>): AppUser {
  const id = String(profile.id ?? profile.uid ?? '');
  return {
    id,
    uid: id,
    phoneNumber: String(profile.phoneNumber ?? ''),
    displayName: String(profile.displayName ?? profile.phoneNumber ?? ''),
    email: null,
    role: String(profile.role ?? 'user').toLowerCase(),
    isPro: Boolean(profile.isPro),
    shopName: String(profile.shopName ?? ''),
    shopLogoUrl: String(profile.shopLogoUrl ?? ''),
    shopDescription: String(profile.shopDescription ?? ''),
    authProvider: String(profile.authProvider ?? 'phone_password'),
    createdAt: (profile.createdAt as string | null) ?? null,
    updatedAt: (profile.updatedAt as string | null) ?? null,
  };
}
