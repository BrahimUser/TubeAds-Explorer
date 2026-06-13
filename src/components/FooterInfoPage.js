/**
 * Page informative pour les liens du footer (/qui-sommes-nous, /aide, etc.).
 */
import { useTranslation } from 'react-i18next';
import { getFooterPageContent } from '../constants/footerPageContent';
import { SITE_GUTTER_CLASS, SITE_MAX_WIDTH_CLASS } from '../constants/layout';

function PageSection({ section }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
      {section.paragraphs?.map((text) => (
        <p key={text.slice(0, 48)} className="mt-3 text-base leading-relaxed text-slate-600">
          {text}
        </p>
      ))}
      {section.list?.length > 0 && (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-slate-600">
          {section.list.map((item) => (
            <li key={item.slice(0, 48)}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function FooterInfoPage({ path, onBack, onNavigate }) {
  const { i18n, t } = useTranslation();
  const content = getFooterPageContent(path, i18n.language);
  if (!content) return null;

  return (
    <main className={`min-h-[50vh] bg-white pb-20 pt-8 ${SITE_GUTTER_CLASS}`}>
      <div className={`mx-auto ${SITE_MAX_WIDTH_CLASS} max-w-2xl`}>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-brand-600 transition hover:text-brand-700"
        >
          {t('footer.pages.backHome')}
        </button>
        <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-slate-900">
          {content.title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">{content.description}</p>
        {content.sections?.map((section) => (
          <PageSection key={section.title} section={section} />
        ))}
        {path !== '/aide' && (
          <p className="mt-10 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {t('footer.pages.needHelp')}{' '}
            <button
              type="button"
              onClick={() => onNavigate?.('/aide')}
              className="font-semibold text-brand-600 underline-offset-2 hover:underline"
            >
              {t('footer.links.helpCenter')}
            </button>
            .
          </p>
        )}
      </div>
    </main>
  );
}
