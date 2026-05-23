// Trust bar — copy aligned with marketplace reference.
import { useTranslation } from 'react-i18next';
import { SITE_GUTTER_CLASS, SITE_MAX_WIDTH_CLASS } from '../constants/layout';

const ITEM_DEFS = [
  { id: 'pay', titleKey: 'trust.securePayment', bodyKey: 'trust.securePaymentSub', tone: 'bg-emerald-50 text-emerald-600', icon: ShieldPayIcon },
  { id: 'ship', titleKey: 'trust.delivery', bodyKey: 'trust.deliverySub', tone: 'bg-amber-50 text-amber-600', icon: TruckIcon },
  { id: 'support', titleKey: 'trust.support', bodyKey: 'trust.supportSub', tone: 'bg-violet-50 text-violet-600', icon: HeadsetIcon },
  { id: 'return', titleKey: 'trust.moneyBack', bodyKey: 'trust.moneyBackSub', tone: 'bg-sky-50 text-sky-600', icon: RefreshIcon },
];

export default function TrustStrip() {
  const { t } = useTranslation();
  return (
    <section className="bg-slate-100/90">
      <div className={`mx-auto ${SITE_MAX_WIDTH_CLASS} py-8 ${SITE_GUTTER_CLASS}`}>
        <div className="grid grid-cols-1 divide-y divide-slate-200/90 rounded-2xl border border-slate-200/90 bg-white shadow-sm sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {ITEM_DEFS.map((item) => {
            const I = item.icon;
            return (
              <div key={item.id} className="flex items-center gap-3 px-4 py-4 sm:py-5">
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${item.tone}`}
                >
                  <I className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{t(item.titleKey)}</div>
                  <div className="text-xs text-slate-500">{t(item.bodyKey)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function ShieldPayIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function TruckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <path d="M10 17h8V8H2v9h3" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      <path d="M14 8V5h4l3 3v10" />
    </svg>
  );
}

function HeadsetIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <path d="M4 14v3a2 2 0 0 0 2 2h1" />
      <path d="M20 14v3a2 2 0 0 1-2 2h-1" />
      <path d="M5 14V9a7 7 0 0 1 14 0v5" />
    </svg>
  );
}

function RefreshIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  );
}
