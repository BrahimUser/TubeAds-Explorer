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

/**
 * Contenu affiché sur /qui-sommes-nous, /aide, etc.
 * title : titre H1 ; description : phrase vue par l’utilisateur (justification du lien).
 */
export const FOOTER_PAGE_CONTENT = {
  '/qui-sommes-nous': {
    title: 'Qui sommes-nous',
    description:
      'Découvrez la mission de la marketplace, notre équipe au Maroc et les valeurs qui guident la plateforme.',
  },
  '/carrieres': {
    title: 'Carrières',
    description:
      'Consultez les offres d’emploi, stages et opportunités pour rejoindre une équipe tech et commerce dynamique.',
  },
  '/presse': {
    title: 'Presse',
    description:
      'Accédez aux communiqués, logos officiels et coordonnées médias pour couvrir l’actualité de la marketplace.',
  },
  '/aide': {
    title: "Centre d'aide",
    description:
      'Trouvez les réponses aux questions fréquentes, tutoriels et coordonnées du support client (chat, e-mail, téléphone).',
  },
  '/conditions-utilisation': {
    title: "Conditions d'utilisation",
    description:
      'Lisez les règles d’utilisation du site, les droits et obligations des acheteurs et des vendeurs sur la plateforme.',
  },
  '/politique-confidentialite': {
    title: 'Politique de confidentialité',
    description:
      'Comprenez comment nous collectons, utilisons et protégeons vos données personnelles conformément au droit marocain.',
  },
  '/service-livraison': {
    title: 'Livraison',
    description:
      'Informez-vous sur les modes de livraison disponibles au Maroc, délais indicatifs et frais associés aux commandes.',
  },
  '/paiement-securise': {
    title: 'Paiement sécurisé',
    description:
      'Découvrez les moyens de paiement acceptés et les garanties de sécurité (cryptage, partenaires bancaires).',
  },
  '/protection-acheteur': {
    title: 'Protection acheteur',
    description:
      'Découvrez nos engagements en cas de litige, retours et remboursements pour sécuriser vos achats sur la marketplace.',
  },
};

export const FOOTER_INFO_PATHS = new Set(Object.keys(FOOTER_PAGE_CONTENT));

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
