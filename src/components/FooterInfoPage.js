/**
 * Page informative pour les liens du footer (/qui-sommes-nous, /aide, etc.).
 */
import { FOOTER_PAGE_CONTENT } from '../constants/footerLinks';
import { SITE_GUTTER_CLASS, SITE_MAX_WIDTH_CLASS } from '../constants/layout';

export default function FooterInfoPage({ path, onBack, onNavigate }) {
  const meta = FOOTER_PAGE_CONTENT[path];
  if (!meta) return null;

  return (
    <main className={`min-h-[50vh] bg-white pb-20 pt-8 ${SITE_GUTTER_CLASS}`}>
      <div className={`mx-auto ${SITE_MAX_WIDTH_CLASS} max-w-2xl`}>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-brand-600 transition hover:text-brand-700"
        >
          ← Retour à l’accueil
        </button>
        <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-slate-900">{meta.title}</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">{meta.description}</p>
        <p className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Le contenu détaillé de cette page sera publié prochainement. En attendant, notre équipe
          reste joignable via le{' '}
          <button
            type="button"
            onClick={() => onNavigate?.('/aide')}
            className="font-semibold text-brand-600 underline-offset-2 hover:underline"
          >
            centre d’aide
          </button>
          .
        </p>
      </div>
    </main>
  );
}
