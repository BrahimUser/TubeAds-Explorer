import api, { silentRequest, unwrap } from '../api/client';
import { resolveDevServerUrl } from '../config/api';

export type SellerProfile = {
  uid: string;
  shopName: string;
  shopLogoUrl: string;
  shopDescription: string;
  isPro: boolean;
  phoneNumber: string;
};

export function normalizeUserProfile(uid: string, raw: Record<string, unknown> | null): SellerProfile {
  if (!raw || typeof raw !== 'object') {
    return {
      uid,
      isPro: false,
      shopName: '',
      shopLogoUrl: '',
      shopDescription: '',
      phoneNumber: '',
    };
  }
  const logo = String(raw.shopLogoUrl ?? raw.shop_logo_url ?? raw.photoURL ?? '').trim();
  return {
    uid: String(raw.id ?? raw.uid ?? uid),
    isPro: Boolean(raw.isPro),
    shopName: String(raw.shopName ?? raw.shop_name ?? raw.displayName ?? '').trim(),
    shopLogoUrl: logo ? resolveDevServerUrl(logo) : '',
    shopDescription: String(
      raw.shopDescription ?? raw.shop_description ?? raw.bio ?? raw.about ?? '',
    ).trim(),
    phoneNumber: String(raw.phoneNumber ?? raw.phone ?? '').trim(),
  };
}

export function sellerDisplayName(profile: SellerProfile | null, uid: string): string {
  if (profile?.shopName) return profile.shopName;
  return `Shop · ${uid.slice(0, 8)}…`;
}

export async function fetchUser(uid: string): Promise<SellerProfile> {
  const res = await api.get(`/users/${uid}`, silentRequest);
  const data = unwrap<{ user: Record<string, unknown> | null }>(res);
  return normalizeUserProfile(uid, data.user);
}
