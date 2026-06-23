import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, CITIES, categoryFirestoreValue } from '../services/categories';
import { useUpdateListing } from '../mutations/useUpdateListing';
import { useUploadFiles } from '../mutations/useUpload';
import { useUploadVideo } from '../mutations/useUploadVideo';
import { MAX_VIDEO_BYTES, validateVideoFile } from '../services/youtube';

function coercePriceCentsFromInput(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return 0;
  const n = Number.parseFloat(raw.replace(',', '.'));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100));
}

function categoryIdFromStored(stored) {
  if (!stored) return '';
  const byId = CATEGORIES.find((c) => c.id === stored);
  if (byId) return byId.id;
  const byLabel = CATEGORIES.find((c) => c.label === stored);
  if (byLabel) return byLabel.id;
  return '';
}

function fileKey(file) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function appendUniqueFiles(prev, incoming) {
  const existing = new Set(prev.map(fileKey));
  const toAdd = incoming.filter((file) => !existing.has(fileKey(file)));
  return [...prev, ...toAdd];
}

export default function EditAdModal({ open, ad, onClose, onSaved }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const updateListing = useUpdateListing();
  const uploadFiles = useUploadFiles();
  const uploadVideo = useUploadVideo();
  const isOwner = !!user && !!ad && user.uid === ad.ownerUid;

  const initial = useMemo(() => {
    const imageUrls = Array.isArray(ad?.imageUrls)
      ? ad.imageUrls.filter((u) => typeof u === 'string' && u.trim())
      : ad?.thumbnailUrl
        ? [ad.thumbnailUrl]
        : [];
    return {
      title: ad?.title || '',
      description: ad?.description || '',
      price: typeof ad?.priceCents === 'number' ? String(ad.priceCents / 100) : '',
      category: categoryIdFromStored(ad?.category),
      city: ad?.city || '',
      videoUrl: ad?.videoUrl || '',
      youtubeVideoId: ad?.youtubeVideoId || '',
      imageUrls,
    };
  }, [ad]);

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [price, setPrice] = useState(initial.price);
  const [category, setCategory] = useState(initial.category);
  const [city, setCity] = useState(initial.city);
  const [videoUrl, setVideoUrl] = useState(initial.videoUrl);
  const [existingYoutubeVideoId, setExistingYoutubeVideoId] = useState(initial.youtubeVideoId);
  const [videoFile, setVideoFile] = useState(null);
  const [existingImageUrls, setExistingImageUrls] = useState(initial.imageUrls);
  const [newPhotos, setNewPhotos] = useState([]);
  const [error, setError] = useState('');

  const busy = updateListing.isPending || uploadFiles.isPending || uploadVideo.isPending;
  const loadingPhase = uploadVideo.isPending
    ? 'uploadingVideo'
    : uploadFiles.isPending
      ? 'uploading'
      : updateListing.isPending
        ? 'saving'
        : null;

  useEffect(() => {
    setTitle(initial.title);
    setDescription(initial.description);
    setPrice(initial.price);
    setCategory(initial.category);
    setCity(initial.city);
    setVideoUrl(initial.videoUrl);
    setExistingYoutubeVideoId(initial.youtubeVideoId);
    setVideoFile(null);
    setExistingImageUrls(initial.imageUrls);
    setNewPhotos([]);
    setError('');
  }, [initial, open]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape' && !busy) onClose?.();
    }
    if (!open) return undefined;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, busy]);

  const [newPhotoPreviewUrls, setNewPhotoPreviewUrls] = useState([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');

  useEffect(() => {
    const urls = newPhotos.map((file) => URL.createObjectURL(file));
    setNewPhotoPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newPhotos]);

  useEffect(() => {
    if (!videoFile) {
      setVideoPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  function handlePhotosChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setNewPhotos((prev) => appendUniqueFiles(prev, files));
    e.target.value = '';
  }

  function removeExistingImage(url) {
    setExistingImageUrls((prev) => prev.filter((u) => u !== url));
  }

  function removeNewPhoto(index) {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleVideoChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const validationError = validateVideoFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setVideoFile(file);
    setVideoUrl('');
    setExistingYoutubeVideoId('');
  }

  function removeVideoFile() {
    setVideoFile(null);
  }

  function removeExistingVideo() {
    setExistingYoutubeVideoId('');
    setVideoUrl('');
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!ad?.id) return;
    if (!isOwner) {
      setError(t('editAd.notOwner'));
      return;
    }
    const nextTitle = String(title ?? '').trim();
    if (!nextTitle) {
      setError(t('createAd.titleRequired'));
      return;
    }

    setError('');
    try {
      let youtubeVideoId = existingYoutubeVideoId;
      let resolvedVideoUrl = String(videoUrl ?? '').trim();
      let thumbnailFromVideo = '';

      if (videoFile) {
        const uploaded = await uploadVideo.mutateAsync({
          file: videoFile,
          title: nextTitle,
          description: String(description ?? '').trim(),
        });
        youtubeVideoId = uploaded.youtubeVideoId;
        resolvedVideoUrl = uploaded.videoUrl;
        thumbnailFromVideo = uploaded.thumbnailUrl;
      }

      const uploadedUrls =
        newPhotos.length > 0 ? await uploadFiles.mutateAsync(newPhotos) : [];
      const imageUrls = [...existingImageUrls, ...uploadedUrls];

      const patch = {
        title: nextTitle,
        description: String(description ?? '').trim(),
        priceCents: coercePriceCentsFromInput(price),
        category: category ? categoryFirestoreValue(category) : '',
        city: city || '',
        youtubeVideoId,
        videoUrl: resolvedVideoUrl,
        imageUrls,
        thumbnailUrl: imageUrls[0] || thumbnailFromVideo || '',
        status: 'pending',
      };
      await updateListing.mutateAsync({ adId: ad.id, patch });
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(String(err?.message || err));
    }
  }

  const loadingMessage =
    loadingPhase === 'uploadingVideo'
      ? t('createAd.uploadingVideo')
      : loadingPhase === 'uploading'
        ? t('createAd.uploadingPhotos')
        : t('editAd.saving');

  const maxVideoMb = Math.round(MAX_VIDEO_BYTES / (1024 * 1024));
  const existingVideoThumb = existingYoutubeVideoId
    ? `https://i.ytimg.com/vi/${existingYoutubeVideoId}/hqdefault.jpg`
    : '';

  const fieldDisabled = busy ? 'pointer-events-none opacity-60' : '';

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        aria-label={t('createAd.close')}
        className="absolute inset-0 bg-black/40"
        disabled={busy}
        onClick={() => !busy && onClose?.()}
      />
      <div className="absolute left-1/2 top-1/2 max-h-[90vh] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {busy && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/90 px-6 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-500" />
            <p className="text-center text-sm font-semibold text-slate-800">{loadingMessage}</p>
            <p className="text-center text-xs text-slate-500">{t('createAd.pleaseWait')}</p>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="text-sm font-extrabold text-slate-900">{t('editAd.title')}</div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            onClick={onClose}
            disabled={busy}
          >
            {t('createAd.close')}
          </button>
        </div>

        <form onSubmit={onSubmit} className={`max-h-[calc(90vh-4rem)] space-y-4 overflow-y-auto p-5 ${fieldDisabled}`}>
          <p className="text-xs text-slate-500">{t('editAd.pendingHint')}</p>

          <label className="block">
            <div className="text-xs font-semibold text-slate-700">{t('createAd.fieldTitle')}</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50"
              placeholder={t('createAd.fieldTitlePlaceholder')}
              required
            />
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-slate-700">{t('createAd.fieldDescription')}</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={busy}
              className="mt-1 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50"
              placeholder={t('createAd.fieldDescriptionPlaceholder')}
            />
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-slate-700">{t('createAd.fieldPrice')}</div>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={busy}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50"
              placeholder="0"
              inputMode="decimal"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <div className="text-xs font-semibold text-slate-700">{t('createAd.fieldCategory')}</div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={busy}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50"
              >
                <option value="">{t('createAd.fieldCategoryPlaceholder')}</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="text-xs font-semibold text-slate-700">{t('createAd.fieldCity')}</div>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={busy}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50"
              >
                <option value="">{t('createAd.fieldCityPlaceholder')}</option>
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="block">
            <div className="text-xs font-semibold text-slate-700">{t('createAd.fieldPhotos')}</div>
            {existingImageUrls.length > 0 || newPhotos.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {existingImageUrls.map((url) => (
                  <li key={url} className="relative">
                    <img
                      src={url}
                      alt=""
                      className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeExistingImage(url)}
                      className="absolute -end-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow"
                      aria-label={t('editAd.removePhoto')}
                    >
                      ×
                    </button>
                  </li>
                ))}
                {newPhotos.map((file, index) => (
                  <li key={fileKey(file)} className="relative">
                    <img
                      src={newPhotoPreviewUrls[index]}
                      alt=""
                      className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeNewPhoto(index)}
                      className="absolute -end-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow"
                      aria-label={t('editAd.removePhoto')}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <label
              className={`mt-2 inline-flex cursor-pointer rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 ${busy ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                disabled={busy}
                onChange={handlePhotosChange}
                className="hidden"
              />
              {t('createAd.choosePhotos')}
            </label>
            {(existingImageUrls.length > 0 || newPhotos.length > 0) && (
              <p className="mt-1 text-xs text-slate-500">
                {t('createAd.photosSelected', {
                  count: existingImageUrls.length + newPhotos.length,
                })}
              </p>
            )}
          </div>

          <div className="block">
            <div className="text-xs font-semibold text-slate-700">{t('createAd.fieldVideo')}</div>
            {videoFile && videoPreviewUrl ? (
              <div className="relative mt-2 inline-block">
                <video
                  src={videoPreviewUrl}
                  className="max-h-32 rounded-lg border border-slate-200"
                  controls
                  muted
                  playsInline
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={removeVideoFile}
                  className="absolute -end-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow"
                  aria-label={t('createAd.removeVideo')}
                >
                  ×
                </button>
              </div>
            ) : existingYoutubeVideoId && existingVideoThumb ? (
              <div className="relative mt-2 inline-block">
                <img
                  src={existingVideoThumb}
                  alt=""
                  className="h-20 rounded-lg border border-slate-200 object-cover"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={removeExistingVideo}
                  className="absolute -end-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow"
                  aria-label={t('createAd.removeVideo')}
                >
                  ×
                </button>
                <p className="mt-1 text-xs text-slate-500">{t('createAd.existingVideo')}</p>
              </div>
            ) : null}
            <label
              className={`mt-2 inline-flex cursor-pointer rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 ${busy ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,.mp4,.webm,.mov,.avi"
                disabled={busy}
                onChange={handleVideoChange}
                className="hidden"
              />
              {t('createAd.chooseVideo')}
            </label>
            {videoFile ? (
              <p className="mt-1 text-xs text-slate-500">
                {t('createAd.videoSelected', { name: videoFile.name })}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                {t('createAd.videoFormatHint', { maxMb: maxVideoMb })}
              </p>
            )}
            {!videoFile && !existingYoutubeVideoId ? (
              <label className="mt-3 block">
                <div className="text-xs font-semibold text-slate-700">{t('createAd.fieldVideoUrl')}</div>
                <input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  disabled={busy}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50"
                  placeholder="https://…"
                />
              </label>
            ) : null}
          </div>

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
              {t('createAd.cancel')}
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-extrabold text-white hover:bg-brand-600 disabled:opacity-60"
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {loadingMessage}
                </>
              ) : (
                t('editAd.save')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
