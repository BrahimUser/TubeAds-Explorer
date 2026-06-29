/**
 * Hero — two-layer composition:
 *   1) `<img>` background pinned to inset:0 (object-cover) — fills the
 *      whole section so the orange/beige tones span the full width.
 *   2) Content (title + search form + stat cards) on `relative z-10`,
 *      with every wrapper kept `bg-transparent`. Only the form and the
 *      stat cards keep their own white background to pop over the image;
 *      the title uses a soft text-shadow for readability instead of a
 *      solid colour panel.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SITE_GUTTER_CLASS, SITE_MAX_WIDTH_CLASS } from '../constants/layout';
import { CATEGORIES, getSortedCities } from '../services/categories';
import { Icon } from './Icons';

const HERO_BG = `${process.env.PUBLIC_URL || ''}/logo.png`;

const CATEGORY_I18N_KEYS = {
  agriculture: 'categories.agriculture',
  'real-estate': 'categories.realEstate',
  vehicles: 'categories.vehicles',
  electronics: 'categories.electronics',
  fashion: 'categories.fashion',
  home: 'categories.homeGarden',
  'kids-baby': 'categories.kidsBaby',
  jobs: 'categories.jobs',
  services: 'categories.services',
  rugs: 'categories.rugs',
  other: 'categories.other',
};

const HERO_STAT_DEFS = [
  { id: 'ads', tKey: 'hero.stats.ads', icon: 'fileText', iconWrap: 'bg-orange-50 text-orange-600' },
  { id: 'users', tKey: 'hero.stats.users', icon: 'user', iconWrap: 'bg-violet-50 text-violet-600' },
  { id: 'cat', tKey: 'hero.stats.categories', icon: 'grid', iconWrap: 'bg-emerald-50 text-emerald-600' },
  { id: 'safe', tKey: 'hero.stats.safe', icon: 'shield', iconWrap: 'bg-sky-50 text-sky-600' },
];

export default function Hero({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedCity,
  onCityChange,
  onSubmit,
  onCreateAd,
}) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const sortedCities = useMemo(() => getSortedCities(t, i18n.language), [t, i18n.language]);
  return (
    <section
      className="relative isolate w-full overflow-hidden rounded-b-3xl bg-transparent"
      aria-label={t('hero.aria')}
    >
      {/* Layer 1 — full-quality background image, spanning the entire Hero.
          A native <img> tag preserves the full resolution of `/logo.png`.
          `object-cover` makes it fill any aspect ratio while `object-center`
          keeps the orange/beige tones visible across the whole width. */}
      <div aria-hidden className="absolute inset-y-0 start-0 end-0 z-0">
        <img
          src={HERO_BG}
          alt=""
          draggable="false"
          decoding="async"
          fetchPriority="high"
          className={
            'h-full w-full select-none object-cover ' +
            (isRtl
              ? 'origin-center -scale-x-100 object-left'
              : 'object-right')
          }
        />
      </div>

      {/* Layer 2 — content (title + search form + stat cards), lifted above
          the artwork. Every wrapper stays transparent so the image shows
          through everywhere; only the form and the stat cards themselves
          keep their own white background + shadow to "pop". */}
      <div
        className={`relative z-10 mx-auto bg-transparent ${SITE_MAX_WIDTH_CLASS} lg:min-h-[min(86vw,520px)]`}
      >
        <div className={`flex justify-start bg-transparent ${SITE_GUTTER_CLASS}`}>
          <div
            className={
              'w-full min-w-0 max-w-full bg-transparent pt-14 pb-10 text-start sm:pt-16 sm:pb-12 lg:max-w-[50%] lg:pt-20 lg:pb-14 ' +
              (isRtl ? 'lg:ps-8 xl:ps-12' : 'lg:pe-8 xl:pe-12')
            }
          >
            <h1
              className="text-balance text-4xl font-extrabold leading-[1.03] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
              style={{
                // Subtle white glow so the heading stays legible over the
                // colorful artwork without needing any solid background.
                textShadow:
                  '0 1px 2px rgba(255,255,255,0.85), 0 0 14px rgba(255,255,255,0.55)',
              }}
            >
              {t('hero.titlePart1')} <span className="text-brand-500">{t('hero.titleHighlight')}</span>
            </h1>
            <p
              className="mt-3 max-w-xl text-sm leading-relaxed text-slate-700 sm:text-[15px]"
              style={{
                textShadow: '0 1px 1px rgba(255,255,255,0.7)',
              }}
            >
              {t('hero.subtitle')}
            </p>

            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                onClick={() => onCreateAd?.()}
                className="inline-flex items-center gap-2.5 rounded-full bg-brand-500 px-7 py-3.5 text-base font-extrabold text-white shadow-[0_8px_28px_rgba(247,107,28,0.4)] transition hover:bg-brand-600 hover:shadow-[0_10px_32px_rgba(247,107,28,0.45)] sm:px-9 sm:py-4 sm:text-lg"
              >
                <Icon name="plus" className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
                {t('hero.cta')}
              </button>
              <p
                className="mt-2 text-xs text-slate-600 sm:text-sm"
                style={{
                  textShadow: '0 1px 1px rgba(255,255,255,0.7)',
                }}
              >
                {t('hero.ctaHint')}
              </p>
            </div>

            <form
              className="mt-6 sm:mt-7"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit?.();
              }}
            >
              <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_6px_26px_rgba(15,23,42,0.08)] sm:rounded-full">
                <div className="flex min-h-[38px] w-full flex-col divide-y divide-slate-100 sm:flex-row sm:items-stretch sm:divide-x sm:divide-y-0">
                  <label className="flex min-h-[38px] min-w-0 flex-1 shrink items-center gap-2 bg-white px-3 py-1.5 sm:min-w-[6.5rem]">
                    <Icon name="search" className="h-3.5 w-3.5 shrink-0 text-slate-400 sm:h-4 sm:w-4" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      placeholder={t('hero.searchPlaceholder')}
                      aria-label={t('hero.searchAria')}
                      className="min-h-0 min-w-0 flex-1 bg-transparent py-0.5 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none sm:text-sm"
                    />
                  </label>

                  <div className="relative min-h-[38px] min-w-0 flex-1 sm:max-w-[9.5rem] sm:shrink-0">
                    <select
                      value={selectedCategory || ''}
                      onChange={(e) => onCategoryChange(e.target.value || null)}
                      aria-label={t('hero.categoryAria')}
                      className="h-full min-h-[38px] w-full cursor-pointer appearance-none bg-white py-1.5 pe-8 ps-2.5 text-start text-[13px] font-medium text-slate-800 outline-none sm:text-sm"
                    >
                      <option value="">{t('hero.allCategories')}</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {CATEGORY_I18N_KEYS[c.id] ? t(CATEGORY_I18N_KEYS[c.id]) : c.label}
                        </option>
                      ))}
                    </select>
                    <Icon
                      name="chevronDown"
                      className="pointer-events-none absolute end-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500"
                    />
                  </div>

                  <div className="relative min-h-[38px] min-w-0 flex-1 sm:max-w-[7.5rem] sm:shrink-0">
                    <select
                      value={selectedCity || ''}
                      onChange={(e) => onCityChange?.(e.target.value || null)}
                      aria-label={t('hero.cityAria')}
                      className="h-full min-h-[38px] w-full cursor-pointer appearance-none bg-white py-1.5 pe-8 ps-2.5 text-start text-[13px] font-medium text-slate-800 outline-none sm:text-sm"
                    >
                      <option value="">{t('hero.allCities')}</option>
                      {sortedCities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <Icon
                      name="chevronDown"
                      className="pointer-events-none absolute end-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="min-h-[38px] shrink-0 bg-brand-500 px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-600 sm:rounded-e-full sm:px-7 sm:text-sm"
                  >
                    {t('hero.submit')}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-4 max-w-xl">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2">
              {HERO_STAT_DEFS.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200/70 bg-white px-2 py-1.5 shadow-[0_1px_8px_rgba(15,23,42,0.05)]"
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-md sm:h-7 sm:w-7 ${s.iconWrap}`}
                  >
                    <Icon name={s.icon} className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </span>
                  <span className="text-[9px] font-semibold leading-tight text-slate-800 sm:text-[10px]">
                    {t(s.tKey)}
                  </span>
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
