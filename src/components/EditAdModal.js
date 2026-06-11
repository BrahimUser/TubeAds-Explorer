import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateAd } from '../services/listings';

function coercePriceCentsFromInput(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return 0;
  const n = Number.parseFloat(raw.replace(',', '.'));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100));
}

export default function EditAdModal({ open, ad, onClose, onSaved }) {
  const { user } = useAuth();
  const isOwner = !!user && !!ad && user.uid === ad.ownerUid;

  const initial = useMemo(() => {
    return {
      title: ad?.title || '',
      price: typeof ad?.priceCents === 'number' ? String(ad.priceCents / 100) : '',
      videoUrl: ad?.videoUrl || '',
    };
  }, [ad]);

  const [title, setTitle] = useState(initial.title);
  const [price, setPrice] = useState(initial.price);
  const [videoUrl, setVideoUrl] = useState(initial.videoUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setTitle(initial.title);
    setPrice(initial.price);
    setVideoUrl(initial.videoUrl);
    setError('');
  }, [initial, open]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.();
    }
    if (!open) return undefined;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!ad?.id) return;
    if (!isOwner) {
      setError("You can only edit your own listing.");
      return;
    }
    const nextTitle = String(title ?? '').trim();
    if (!nextTitle) {
      setError('Title is required.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const patch = {
        title: nextTitle,
        priceCents: coercePriceCentsFromInput(price),
        videoUrl: String(videoUrl ?? '').trim(),
        // Avito-style moderation: any edit goes back to pending validation.
        status: 'pending',
      };
      await updateAd(ad.id, patch);
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="text-sm font-extrabold text-slate-900">Modifier mon annonce</div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-5">
          <label className="block">
            <div className="text-xs font-semibold text-slate-700">Title</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200"
              placeholder="Title"
              required
            />
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-slate-700">Price</div>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200"
              placeholder="0.00"
              inputMode="decimal"
            />
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-slate-700">Video URL</div>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200"
              placeholder="https://…"
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-extrabold text-white hover:bg-brand-600 disabled:opacity-60"
              disabled={busy}
            >
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

