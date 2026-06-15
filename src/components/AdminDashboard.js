import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import useIsAdmin from '../hooks/useIsAdmin';
import { usePendingListings } from '../queries/useListings';
import { useApproveListing, useRejectListing } from '../mutations/useModerateListing';
import { pushPath } from '../utils/routing';
import AdminModerationCard from './AdminModerationCard';
import AdminModerationConfirmDialog from './AdminModerationConfirmDialog';
import AdminToast from './AdminToast';
import { Icon } from './Icons';
import VideoPlayerModal from './VideoPlayerModal';

export default function AdminDashboard({ onRequireLogin, onNavigateHome }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isAdmin, ready } = useIsAdmin();
  const { data: items = [], error: queryError } = usePendingListings({
    enabled: !!user && ready && isAdmin,
  });
  const approveListing = useApproveListing();
  const rejectListing = useRejectListing();
  const [videoAd, setVideoAd] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [actionError, setActionError] = useState(null);

  const busy = new Map();
  if (approveListing.isPending && approveListing.variables) {
    busy.set(`${approveListing.variables}:approve`, true);
  }
  if (rejectListing.isPending && rejectListing.variables) {
    busy.set(`${rejectListing.variables}:reject`, true);
  }

  const error = actionError || queryError?.message || null;

  async function runAction(ad, kind) {
    const adId = ad?.id;
    if (!adId) return false;
    setActionError(null);
    try {
      if (kind === 'approve') await approveListing.mutateAsync(adId);
      else await rejectListing.mutateAsync(adId);
      setToast({
        tone: 'success',
        message:
          kind === 'approve'
            ? t('adminModeration.approvedSuccess', { title: ad.title || t('common.untitled') })
            : t('adminModeration.rejectedSuccess', { title: ad.title || t('common.untitled') }),
      });
      return true;
    } catch (e) {
      const message = String(e?.message || e);
      setActionError(message);
      setToast({ tone: 'error', message });
      return false;
    }
  }

  function requestAction(ad, kind) {
    setConfirm({ ad, kind });
  }

  async function handleConfirm() {
    if (!confirm?.ad) return;
    const ok = await runAction(confirm.ad, confirm.kind);
    if (ok) setConfirm(null);
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-10">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
          {t('adminModeration.checkingAccess')}
        </div>
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
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
            <Icon name="shield" className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">{t('adminModeration.forbiddenTitle')}</h1>
            <p className="mt-1 text-sm text-slate-600">{t('adminModeration.forbiddenBody')}</p>
          </div>
        </div>
        <HomeLink onNavigateHome={onNavigateHome} />
      </div>
    );
  }

  const confirmBusy = confirm ? busy.has(`${confirm.ad.id}:${confirm.kind}`) : false;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <Icon name="shield" className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{t('adminModeration.title')}</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">{t('adminModeration.subtitle')}</p>
            </div>
          </div>
        </div>
        <HomeLink onNavigateHome={onNavigateHome} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 shadow-sm">
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-amber-800/80">
            {t('adminModeration.queueLabel')}
          </div>
          <div className="mt-1 flex flex-wrap items-end gap-3">
            <div className="text-3xl font-extrabold tabular-nums text-amber-950">{items.length}</div>
            <div className="pb-1 text-sm font-semibold text-amber-900/80">
              {t('adminModeration.pendingCount', { count: items.length })}
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-amber-900/70">{t('adminModeration.queueHint')}</p>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <Icon name="close" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-8 space-y-5">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <Icon name="check" className="h-7 w-7" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-800">{t('adminModeration.emptyQueue')}</p>
            <p className="mt-2 text-xs text-slate-500">{t('adminModeration.emptyHint')}</p>
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
                  onApprove={() => requestAction(ad, 'approve')}
                  onReject={() => requestAction(ad, 'reject')}
                  onPlayVideo={setVideoAd}
                />
              );
            })}
          </div>
        )}
      </div>

      <AdminModerationConfirmDialog
        open={!!confirm}
        kind={confirm?.kind}
        adTitle={confirm?.ad?.title}
        busy={confirmBusy}
        onConfirm={handleConfirm}
        onCancel={() => {
          if (!confirmBusy) setConfirm(null);
        }}
      />

      <AdminToast message={toast?.message} tone={toast?.tone} onDismiss={() => setToast(null)} />
      <VideoPlayerModal open={!!videoAd} ad={videoAd} onClose={() => setVideoAd(null)} />
    </div>
  );
}

function HomeLink({ onNavigateHome }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      onClick={() => {
        pushPath('/');
        onNavigateHome?.();
      }}
    >
      <span aria-hidden="true">←</span>
      {t('adminModeration.backMarketplace')}
    </button>
  );
}
