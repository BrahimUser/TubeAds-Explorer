import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import useIsAdmin from '../hooks/useIsAdmin';
import { approveListing, listenPendingAds, rejectListing } from '../services/listings';
import { pushPath } from '../utils/routing';
import AdminModerationCard from './AdminModerationCard';
import VideoPlayerModal from './VideoPlayerModal';

function badge(text, tone) {
  const cls =
    tone === 'orange'
      ? 'bg-orange-50 text-orange-900 ring-orange-100'
      : 'bg-slate-50 text-slate-700 ring-slate-200';
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${cls}`}>{text}</span>;
}

export default function AdminDashboard({ onRequireLogin, onNavigateHome }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isAdmin, ready } = useIsAdmin();
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(() => new Map());
  const [error, setError] = useState(null);
  const [videoAd, setVideoAd] = useState(null);

  useEffect(() => {
    if (!user || !ready || !isAdmin) {
      setItems([]);
      return undefined;
    }
    const unsub = listenPendingAds(
      (pending) => {
        setItems(pending);
        setError(null);
      },
      setError,
    );
    return unsub;
  }, [user, ready, isAdmin]);

  async function runAction(adId, kind) {
    const key = `${adId}:${kind}`;
    setBusy((prev) => new Map(prev).set(key, true));
    setError(null);
    try {
      if (kind === 'approve') await approveListing(adId);
      else await rejectListing(adId);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setBusy((prev) => {
        const n = new Map(prev);
        n.delete(key);
        return n;
      });
    }
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-10">
        <div className="text-sm font-semibold text-slate-700">{t('adminModeration.checkingAccess')}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-[900px] space-y-4 px-4 py-10">
        <h1 className="text-xl font-extrabold text-slate-900">{t('adminModeration.title')}</h1>
        <p className="text-sm text-slate-600">{t('adminModeration.signInPrompt')}</p>
        <button
          type="button"
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-extrabold text-white hover:bg-brand-600"
          onClick={onRequireLogin}
        >
          {t('adminModeration.signIn')}
        </button>
        <HomeLink onNavigateHome={onNavigateHome} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-[900px] space-y-4 px-4 py-10">
        <h1 className="text-xl font-extrabold text-slate-900">{t('adminModeration.forbiddenTitle')}</h1>
        <p className="text-sm text-slate-600">{t('adminModeration.forbiddenBody')}</p>
        <HomeLink onNavigateHome={onNavigateHome} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{t('adminModeration.title')}</h1>
            {badge(t('adminModeration.badgeHidden'), 'orange')}
          </div>
          <p className="text-sm text-slate-600">{t('adminModeration.subtitle')}</p>
        </div>
        <HomeLink onNavigateHome={onNavigateHome} />
      </div>

      {error && (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 space-y-4">
        <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
          {t('adminModeration.pendingCount', { count: items.length })}
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-600 shadow-sm">
            {t('adminModeration.emptyQueue')}
            <div className="mt-2 text-xs text-slate-500">{t('adminModeration.emptyHint')}</div>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((ad) => {
              const busyApprove = busy.has(`${ad.id}:approve`);
              const busyReject = busy.has(`${ad.id}:reject`);
              const locked = busyApprove || busyReject;
              return (
                <AdminModerationCard
                  key={ad.id}
                  ad={ad}
                  busyApprove={busyApprove}
                  busyReject={busyReject}
                  locked={locked}
                  onApprove={() => runAction(ad.id, 'approve')}
                  onReject={() => runAction(ad.id, 'reject')}
                  onPlayVideo={setVideoAd}
                />
              );
            })}
          </div>
        )}
      </div>

      <VideoPlayerModal open={!!videoAd} ad={videoAd} onClose={() => setVideoAd(null)} />
    </div>
  );
}

function HomeLink({ onNavigateHome }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className="text-sm font-bold text-brand-600 hover:underline"
      onClick={() => {
        pushPath('/');
        onNavigateHome?.();
      }}
    >
      {t('adminModeration.backMarketplace')}
    </button>
  );
}
