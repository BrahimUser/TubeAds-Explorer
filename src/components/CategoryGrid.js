/**
 * Category strip — 9 rounded tiles + overflow (“Plus”) per marketplace reference.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SITE_GUTTER_CLASS, SITE_MAX_WIDTH_CLASS } from '../constants/layout';
import { Icon } from './Icons';

const ROW_DEFS = [
  { id: null, tKey: 'categories.all', icon: 'grid', squareClass: 'bg-orange-50 text-orange-600 ring-1 ring-orange-100/90', isAll: true },
  { id: 'vehicles', tKey: 'categories.vehicles', icon: 'car', squareClass: 'bg-sky-50 text-sky-600 ring-1 ring-sky-100/80' },
  { id: 'real-estate', tKey: 'categories.realEstate', icon: 'home', squareClass: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/80' },
  { id: 'electronics', tKey: 'categories.electronics', icon: 'smartphone', squareClass: 'bg-violet-50 text-violet-600 ring-1 ring-violet-100/80' },
  { id: 'home', tKey: 'categories.homeGarden', icon: 'sofa', squareClass: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100/80' },
  { id: 'fashion', tKey: 'categories.fashion', icon: 'tshirt', squareClass: 'bg-pink-50 text-pink-600 ring-1 ring-pink-100/80' },
  { id: 'kids-baby', tKey: 'categories.kidsBaby', icon: 'baby', squareClass: 'bg-sky-100 text-sky-700 ring-1 ring-sky-100/80' },
  { id: 'other', tKey: 'categories.leisureSport', icon: 'soccer', squareClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100/80' },
];

const MORE_DEFS = [
  { id: 'services', tKey: 'categories.services', icon: 'wrench', squareClass: 'bg-teal-50 text-teal-600' },
  { id: 'jobs', tKey: 'categories.jobs', icon: 'briefcase', squareClass: 'bg-indigo-50 text-indigo-600' },
  { id: 'rugs', tKey: 'categories.rugs', icon: 'rug', squareClass: 'bg-rose-50 text-rose-600' },
];

export default function CategoryGrid({ selected, onSelect }) {
  const { t } = useTranslation();
  return (
    <section
      id="category-section"
      className={`mx-auto ${SITE_MAX_WIDTH_CLASS} py-10 ${SITE_GUTTER_CLASS}`}
    >
      <div className="mb-8 border-b border-slate-100 pb-6">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
          {t('categories.title')}
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 lg:gap-4">
        {ROW_DEFS.map((tile) => {
          const selectedHere = tile.isAll ? !selected : selected === tile.id;
          return (
            <CatTile
              key={String(tile.id ?? 'all')}
              label={t(tile.tKey)}
              icon={tile.icon}
              squareClass={tile.squareClass}
              selected={selectedHere}
              isAll={tile.isAll}
              onClick={() => onSelect?.(tile.id)}
            />
          );
        })}
        <MorePopover selected={selected} onSelect={onSelect} extras={MORE_DEFS} />
      </div>
    </section>
  );
}

function CatTile({ label, icon, squareClass, selected, isAll, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="flex flex-col items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
    >
      <span
        className={
          'flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded-2xl transition md:h-[4.75rem] md:w-[4.75rem] ' +
          squareClass +
          (selected && isAll
            ? ' ring-2 ring-brand-500 ring-offset-[3px] ring-offset-white shadow-sm '
            : selected && !isAll
              ? ' ring-2 ring-brand-500 ring-offset-[3px] ring-offset-white shadow-md '
              : ' hover:-translate-y-0.5 hover:shadow-md ')
        }
      >
        <Icon
          name={icon}
          className={`h-7 w-7 md:h-8 md:w-8 ${selected && isAll ? '' : ''}`}
        />
      </span>
      <span
        className={
          'max-w-[5.5rem] text-center text-[11px] font-semibold leading-tight md:text-xs ' +
          (selected ? 'text-brand-600' : 'font-medium text-slate-700')
        }
      >
        {label}
      </span>
    </button>
  );
}

function MorePopover({ selected, onSelect, extras }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const openFromSelection = extras.some((e) => e.id === selected);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full flex-col items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        <span
          className={
            'flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-2xl transition md:h-[4.75rem] md:w-[4.75rem] ' +
            (openFromSelection
              ? 'bg-brand-500 text-white ring-2 ring-brand-400 ring-offset-2 ring-offset-white shadow-md'
              : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200/80 hover:-translate-y-0.5 hover:shadow-md')
          }
        >
          <span className="flex items-end gap-[3px]" aria-hidden>
            {[0, 1, 2].map((k) => (
              <span key={k} className="block h-[5px] w-[5px] rounded-full bg-current" />
            ))}
          </span>
        </span>
        <span
          className={
            'max-w-[5.5rem] text-center text-[11px] font-semibold md:text-xs ' +
            (openFromSelection ? 'text-brand-600' : 'font-medium text-slate-700')
          }
        >
          {t('categories.more')}
        </span>
      </button>
      {open && (
        <div className="absolute end-0 top-full z-30 mt-2 w-max min-w-[12rem] max-w-[16rem] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          {extras.map((extra) => {
            const on = selected === extra.id;
            return (
              <button
                key={extra.id}
                type="button"
                className={
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm hover:bg-slate-50 ' +
                  (on ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-700')
                }
                onClick={() => {
                  onSelect?.(extra.id);
                  setOpen(false);
                }}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${extra.squareClass} ring-1 ring-black/5`}
                >
                  <Icon name={extra.icon} className="h-[18px] w-[18px]" />
                </span>
                {t(extra.tKey)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
