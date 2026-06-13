/**
 * Liens du pied de page — URLs réseaux / stores à adapter à votre marque.
 * Les descriptions servent à la page informative affichée après clic (SPA).
 */

/** Remplacez par les URLs officielles de votre marketplace au Maroc. */
export const FOOTER_SOCIAL_URLS = {
  facebook: 'https://www.facebook.com/MaMarketplace',
  instagram: 'https://www.instagram.com/MaMarketplace',
  tiktok: 'https://www.tiktok.com/@MaMarketplace',
  youtube: 'https://www.youtube.com/@MaMarketplace',
};

/** Liens vers les fiches magasin (remplacez par vos IDs réels une fois l’app publiée). */
export const FOOTER_STORE_URLS = {
  googlePlay:
    'https://play.google.com/store/apps/details?id=com.marketplace.ma.app',
  appStore: 'https://apps.apple.com/fr/app/marketplace/id0000000000',
};

export { FOOTER_PAGE_CONTENT, FOOTER_INFO_PATHS } from './footerPageContent';

export const FOOTER_NAV_ABOUT = [
  { href: '/qui-sommes-nous', label: 'Qui sommes-nous', i18nKey: 'footer.links.about' },
  { href: '/carrieres', label: 'Carrières', i18nKey: 'footer.links.careers' },
  { href: '/presse', label: 'Presse', i18nKey: 'footer.links.press' },
];

export const FOOTER_NAV_HELP = [
  { href: '/aide', label: "Centre d'aide", i18nKey: 'footer.links.helpCenter' },
  { href: '/conditions-utilisation', label: "Conditions d'utilisation", i18nKey: 'footer.links.terms' },
  { href: '/politique-confidentialite', label: 'Politique de confidentialité', i18nKey: 'footer.links.privacy' },
];

export const FOOTER_NAV_SERVICES = [
  { href: '/service-livraison', label: 'Livraison', i18nKey: 'footer.links.delivery' },
  { href: '/paiement-securise', label: 'Paiement sécurisé', i18nKey: 'footer.links.securePayment' },
  { href: '/protection-acheteur', label: 'Protection acheteur', i18nKey: 'footer.links.buyerProtection' },
];
