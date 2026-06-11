import { useTranslation } from 'react-i18next';
import { APP_NAME } from '../constants/branding';
import {
  FOOTER_NAV_ABOUT,
  FOOTER_NAV_HELP,
  FOOTER_NAV_SERVICES,
  FOOTER_PAGE_CONTENT,
  FOOTER_SOCIAL_URLS,
  FOOTER_STORE_URLS,
} from '../constants/footerLinks';
import { SITE_GUTTER_CLASS, SITE_MAX_WIDTH_CLASS } from '../constants/layout';
import TrustStrip from './TrustStrip';
import {
  AppStoreBadgeSvg,
  FacebookOfficialIcon,
  GooglePlayBadgeSvg,
  InstagramOfficialIcon,
  TikTokOfficialIcon,
  YouTubeOfficialIcon,
} from './FooterSocialSvgs';

/**
 * Pied de page marketplace (Maroc) — 4 colonnes, liens internes (SPA),
 * réseaux sociaux et badges stores en liens réels.
 */
/**
 * Classe de base partagée par les 4 cercles « Suivez-nous ».
 * - Garde dimensions/bordures/espacements existants (h-11 w-11, rounded-full).
 * - Couleur d'icône appliquée via `text-[#brand]` sur chaque lien.
 * - Hover : scale-up + brightness boost (effet doux).
 */
const socialLinkBase =
  'inline-grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white shadow-sm transition duration-200 ease-out ' +
  'hover:scale-110 hover:shadow-md hover:brightness-110 active:scale-100 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ' +
  'motion-reduce:transition-none motion-reduce:hover:scale-100';

export default function Footer({ onHome, onNavigatePath }) {
  const { t } = useTranslation();
  const navLinkClass =
    'block text-sm text-slate-600 transition hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 rounded-sm';

  function handleInternalNav(e, href) {
    e.preventDefault();
    onNavigatePath?.(href);
  }

  const renderColumn = (links) =>
    links.map(({ href, label, i18nKey }) => (
      <li key={href}>
        <a
          href={href}
          title={FOOTER_PAGE_CONTENT[href]?.description}
          className={navLinkClass}
          onClick={(e) => handleInternalNav(e, href)}
        >
          {i18nKey ? t(i18nKey, { defaultValue: label }) : label}
        </a>
      </li>
    ));

  return (
    <>
      <TrustStrip />
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className={`mx-auto ${SITE_MAX_WIDTH_CLASS} py-12 ${SITE_GUTTER_CLASS}`}>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-12">
            <div className="sm:col-span-2 lg:col-span-3">
              <button
                type="button"
                onClick={() => onHome?.()}
                className="flex items-center gap-2.5 font-semibold text-slate-900 transition hover:text-brand-600"
              >
                <img
                  src={`${process.env.PUBLIC_URL || ''}/logosite.png`}
                  alt=""
                  className="h-8 w-auto shrink-0 object-contain"
                  draggable="false"
                />
                <span className="text-lg tracking-tight">{APP_NAME}</span>
              </button>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
                {t('footer.description')}
              </p>
            </div>

            <nav className="lg:col-span-3" aria-labelledby="footer-about-heading">
              <h4 id="footer-about-heading" className="text-sm font-semibold text-slate-900">
                {t('footer.about')}
              </h4>
              <ul className="mt-4 space-y-2.5">{renderColumn(FOOTER_NAV_ABOUT)}</ul>
            </nav>

            <nav className="lg:col-span-3" aria-labelledby="footer-help-heading">
              <h4 id="footer-help-heading" className="text-sm font-semibold text-slate-900">
                {t('footer.help')}
              </h4>
              <ul className="mt-4 space-y-2.5">{renderColumn(FOOTER_NAV_HELP)}</ul>
            </nav>

            <nav className="lg:col-span-3" aria-labelledby="footer-services-heading">
              <h4 id="footer-services-heading" className="text-sm font-semibold text-slate-900">
                {t('footer.services')}
              </h4>
              <ul className="mt-4 space-y-2.5">{renderColumn(FOOTER_NAV_SERVICES)}</ul>
            </nav>
          </div>

          <div className="mt-12 flex flex-col gap-8 border-t border-slate-200 pt-10 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">{t('footer.followUs')}</h4>
              <ul className="mt-4 flex flex-wrap gap-3" aria-label={t('footer.socialAria')}>
                <li>
                  <a
                    href={FOOTER_SOCIAL_URLS.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Facebook — MaMarketplace"
                    aria-label="Facebook"
                    className={socialLinkBase + ' text-[#1877F2] hover:bg-[#1877F2]/10 hover:border-[#1877F2]/40'}
                  >
                    <FacebookOfficialIcon className="h-[22px] w-[22px]" />
                  </a>
                </li>
                <li>
                  <a
                    href={FOOTER_SOCIAL_URLS.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Instagram — MaMarketplace"
                    aria-label="Instagram"
                    className={
                      socialLinkBase +
                      ' text-[#E4405F] hover:border-transparent hover:text-white hover:bg-gradient-to-br hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF]'
                    }
                  >
                    <InstagramOfficialIcon className="h-[22px] w-[22px]" />
                  </a>
                </li>
                <li>
                  <a
                    href={FOOTER_SOCIAL_URLS.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="TikTok — MaMarketplace"
                    aria-label="TikTok"
                    className={
                      socialLinkBase +
                      ' text-black hover:border-transparent hover:bg-black hover:text-white'
                    }
                  >
                    <span
                      className="inline-block transition duration-200 [filter:drop-shadow(-1px_-1px_0_rgba(37,244,238,0.85))_drop-shadow(1px_1px_0_rgba(254,44,85,0.85))]"
                    >
                      <TikTokOfficialIcon className="h-[22px] w-[22px]" />
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href={FOOTER_SOCIAL_URLS.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="YouTube — MaMarketplace"
                    aria-label="YouTube"
                    className={socialLinkBase + ' text-[#FF0000] hover:bg-[#FF0000]/10 hover:border-[#FF0000]/40'}
                  >
                    <YouTubeOfficialIcon className="h-[22px] w-[22px]" />
                  </a>
                </li>
              </ul>
            </div>
            <div className="lg:text-end">
              <h4 className="text-sm font-semibold text-slate-900">{t('footer.downloadApp')}</h4>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
                <a
                  href={FOOTER_STORE_URLS.googlePlay}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-[10px] transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
                  aria-label={t('footer.googlePlay')}
                >
                  <GooglePlayBadgeSvg className="h-11 w-[148px] sm:h-12 sm:w-[162px]" />
                </a>
                <a
                  href={FOOTER_STORE_URLS.appStore}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-[10px] transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
                  aria-label={t('footer.appStore')}
                >
                  <AppStoreBadgeSvg className="h-11 w-[148px] sm:h-12 sm:w-[162px]" />
                </a>
              </div>
            </div>
          </div>

          <p className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
            {t('footer.copyright', { appName: APP_NAME })}
          </p>
        </div>
      </footer>
    </>
  );
}
