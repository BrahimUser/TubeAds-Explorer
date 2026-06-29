// Slide-in messages panel. Thread list and messages update in real time via Socket.IO.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useChatThreads, useChatMessages } from '../queries/useChat';
import { useSendMessage } from '../mutations/useChat';
import { useSellerProfiles } from '../queries/useUsers';
import { Icon } from './Icons';

function tsMs(ts) {
  if (!ts) return null;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.seconds === 'number') return ts.seconds * 1000;
  if (ts instanceof Date) return ts.getTime();
  return null;
}

function formatTime(ts) {
  const ms = tsMs(ts);
  if (ms == null) return '';
  return new Date(ms).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelative(ts, translate) {
  const ms = tsMs(ts);
  if (ms == null) return '';
  const minutes = Math.round((Date.now() - ms) / 60000);
  if (minutes < 1) return translate('card.timeJustNow');
  if (minutes < 60) return translate('card.timeMinutesAgo', { minutes });
  const h = Math.round(minutes / 60);
  if (h < 24) return translate('card.timeHoursAgo', { hours: h });
  const d = Math.round(h / 24);
  if (d < 14) return translate('card.timeDaysAgo', { days: d });
  return translate('card.timeWeeksAgo', { weeks: Math.round(d / 7) });
}

function isIndexBuildingError(err) {
  if (!err) return false;
  if (err.code === 'failed-precondition') return true;
  const msg = String(err.message || '').toLowerCase();
  return (
    msg.includes('requires an index') ||
    msg.includes('currently building') ||
    msg.includes('index is currently building')
  );
}

function otherUidFor(thread, myUid) {
  if (!thread || !myUid) return '';
  if (thread.sellerUid && thread.sellerUid !== myUid) return thread.sellerUid;
  if (thread.buyerUid && thread.buyerUid !== myUid) return thread.buyerUid;
  if (Array.isArray(thread.participantIds)) {
    return thread.participantIds.find((u) => u && u !== myUid) || '';
  }
  return '';
}

function displayNameFor(uid, profile, translate) {
  const name = profile?.shopName?.trim();
  if (name) return name;
  if (!uid) return translate('messages.sellerFallback');
  return translate('messages.sellerWithId', { id: uid.slice(0, 6) });
}

function avatarInitial(name) {
  const c = (name || '?').trim()[0];
  return c ? c.toUpperCase() : '?';
}

const DRAWER_TRANSITION_MS = 300;

export default function MessagesDrawer({
  open,
  onClose,
  onRequireLogin,
  initialThreadId = null,
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeId, setActiveId] = useState(null);
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  const {
    data: threads = [],
    isLoading,
    isError,
    error,
  } = useChatThreads(user?.uid, { enabled: open && !!user });

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), DRAWER_TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    if (!user) {
      onRequireLogin?.();
      onClose();
      return undefined;
    }
    return undefined;
  }, [open, user, onClose, onRequireLogin]);

  useEffect(() => {
    if (!open || !threads.length) return;
    setActiveId((prev) => {
      if (initialThreadId && threads.some((t) => t.id === initialThreadId)) {
        return initialThreadId;
      }
      return prev ?? threads[0]?.id ?? null;
    });
  }, [open, initialThreadId, threads]);

  useEffect(() => {
    if (!open || !initialThreadId) return;
    setActiveId(initialThreadId);
  }, [open, initialThreadId]);

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-hidden={!visible}
      className={
        'fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out motion-reduce:transition-none ' +
        (visible ? 'opacity-100' : 'opacity-0')
      }
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <aside
        className={
          'absolute end-0 top-0 h-full w-full sm:w-[796px] max-w-full bg-white shadow-2xl flex flex-col ' +
          'transition-transform duration-300 ease-out motion-reduce:transition-none ' +
          (visible ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full')
        }
      >
        <header className="flex items-center justify-between px-5 h-14 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">{t('messages.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('messages.closeAria')}
            className="p-2 -m-2 text-slate-500 hover:text-slate-800"
          >
            <Icon name="close" />
          </button>
        </header>

        <DrawerBody
          user={user}
          threads={threads}
          activeId={activeId}
          setActiveId={setActiveId}
          loading={isLoading}
          error={isError ? error : null}
          t={t}
        />
      </aside>
    </div>
  );
}

function DrawerBody({ user, threads, activeId, setActiveId, loading, error, t }) {
  const otherUids = useMemo(() => {
    const set = new Set();
    for (const t of threads) {
      const u = otherUidFor(t, user?.uid);
      if (u) set.add(u);
    }
    return Array.from(set);
  }, [threads, user?.uid]);
  const profiles = useSellerProfiles(otherUids);

  return (
    <div className="flex-1 grid grid-cols-1 sm:grid-cols-[280px_1fr] min-h-0">
      <ThreadList
        user={user}
        profiles={profiles}
        threads={threads}
        activeId={activeId}
        onSelect={setActiveId}
        loading={loading}
        error={error}
        t={t}
      />
      <ChatPane
        key={activeId || 'empty'}
        user={user}
        thread={threads.find((t) => t.id === activeId) || null}
        profiles={profiles}
        t={t}
      />
    </div>
  );
}

function ThreadListSkeleton() {
  return (
    <div className="border-r border-slate-200 p-3 space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 rounded-lg bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

function IndexBuildingNotice({ t }) {
  return (
    <div className="border-r border-slate-200 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className="inline-block h-3 w-3 rounded-full border-2 border-brand-500 border-r-transparent animate-spin" />
        {t('messages.preparingInbox')}
      </div>
      <p className="text-xs leading-relaxed text-slate-500">
        {t('messages.indexBuilding')}
      </p>
      <ul className="space-y-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <li
            key={i}
            className="h-14 rounded-lg bg-slate-100 animate-pulse"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </ul>
    </div>
  );
}

function ThreadList({ user, profiles, threads, activeId, onSelect, loading, error, t }) {
  if (loading) return <ThreadListSkeleton />;

  if (error && isIndexBuildingError(error)) {
    return <IndexBuildingNotice t={t} />;
  }
  if (error) {
    return (
      <div className="border-r border-slate-200 p-4 text-sm text-red-700">
        {t('messages.loadFailed', { message: error.message })}
      </div>
    );
  }
  if (threads.length === 0) {
    return (
      <div className="border-r border-slate-200 p-4 text-sm text-slate-500">
        {t('messages.emptyThreads')}
      </div>
    );
  }
  return (
    <ul className="border-r border-slate-200 overflow-y-auto">
      {threads.map((thread) => {
        const active = thread.id === activeId;
        const otherUid = otherUidFor(thread, user?.uid);
        const profile = profiles?.[otherUid];
        const name = displayNameFor(otherUid, profile, t);
        const time = formatRelative(
          thread.lastMessageAt || thread.updatedAt || thread.createdAt,
          t,
        );
        const subtitle =
          thread.lastMessageText?.trim() || thread.productTitle || thread.priceLabel || '';
        return (
          <li key={thread.id}>
            <button
              type="button"
              onClick={() => onSelect(thread.id)}
              className={
                'w-full flex items-center gap-3 px-3 py-3 text-left border-b border-slate-100 transition ' +
                (active ? 'bg-brand-50/60' : 'hover:bg-slate-50')
              }
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden">
                  {thread.productThumb ? (
                    <img
                      src={thread.productThumb}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-slate-300">
                      <Icon name="tag" className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full ring-2 ring-white bg-slate-100 overflow-hidden">
                  {profile?.shopLogoUrl ? (
                    <img
                      src={profile.shopLogoUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-brand-100 text-[10px] font-bold text-brand-700">
                      {avatarInitial(name)}
                    </div>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 truncate flex-1">
                    {name}
                  </span>
                  {time && (
                    <span className="text-[10px] font-medium text-slate-400 shrink-0">
                      {time}
                    </span>
                  )}
                </div>
                {thread.productTitle && (
                  <div className="text-[11px] font-medium text-slate-500 truncate">
                    {thread.productTitle}
                  </div>
                )}
                <div className="text-xs text-slate-500 truncate">
                  {subtitle}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ChatPane({ user, thread, profiles, t }) {
  const [draft, setDraft] = useState('');
  const scrollerRef = useRef(null);
  const sendMessage = useSendMessage();

  const { data: messages = [] } = useChatMessages(thread?.id, {
    enabled: !!thread?.id,
  });

  const otherUid = thread ? otherUidFor(thread, user?.uid) : '';
  const otherProfile = otherUid ? profiles?.[otherUid] : null;
  const otherName = displayNameFor(otherUid, otherProfile, t);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sortedMessages = useMemo(() => messages.slice(), [messages]);
  const sendError = sendMessage.error;

  if (!thread) {
    return (
      <div className="grid place-items-center text-sm text-slate-500 p-6">
        {t('messages.selectThread')}
      </div>
    );
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sendMessage.isPending) return;
    try {
      await sendMessage.mutateAsync({
        threadId: thread.id,
        text,
        options: {
          listingId: thread.listingId || thread.adId || null,
          recipientId: otherUid,
          senderName: user?.displayName || user?.email || '',
        },
      });
      setDraft('');
    } catch (err) {
      console.error('sendChatMessage', err);
    }
  }

  return (
    <div className="flex flex-col min-h-0">
      <div className="px-4 h-16 border-b border-slate-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 ring-2 ring-slate-100">
          {otherProfile?.shopLogoUrl ? (
            <img
              src={otherProfile.shopLogoUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-brand-100 text-sm font-bold text-brand-700">
              {avatarInitial(otherName)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900 truncate">
            {otherName}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {thread.productTitle
              ? t('messages.aboutProduct', { title: thread.productTitle })
              : t('messages.conversation')}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {thread.productThumb && (
            <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden">
              <img
                src={thread.productThumb}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {thread.priceLabel && (
            <span className="text-xs font-bold text-slate-700">{thread.priceLabel}</span>
          )}
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-slate-50/40"
      >
        {sortedMessages.map((m) => {
          const senderId = m.senderUid || m.senderId;
          const mine = !!user && senderId === user.uid;
          return (
            <div
              key={m.id}
              className={'flex w-full ' + (mine ? 'justify-end' : 'justify-start')}
            >
              <div
                className={
                  'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ' +
                  (mine
                    ? 'bg-brand-500 text-white rounded-br-md'
                    : 'bg-slate-200 text-slate-800 rounded-bl-md')
                }
              >
                {m.text && (
                  <div className="whitespace-pre-wrap break-words leading-snug">
                    {m.text}
                  </div>
                )}
                {m.imageUrl && (
                  <img
                    src={m.imageUrl}
                    alt=""
                    className="mt-1 max-w-full rounded-lg"
                  />
                )}
                <div
                  className={
                    'mt-1 text-[10px] tabular-nums ' +
                    (mine ? 'text-white/80 text-right' : 'text-slate-500')
                  }
                >
                  {formatTime(m.createdAt || m.timestamp) || (mine ? t('messages.sending') : '')}
                </div>
              </div>
            </div>
          );
        })}
        {sortedMessages.length === 0 && (
          <div className="text-center text-xs text-slate-400 py-6">
            {t('messages.emptyChat')}
          </div>
        )}
      </div>

      {sendError && (
        <div className="px-4 pb-1 text-xs font-medium text-red-600">
          {t('messages.sendFailed', {
            message: sendError.message || String(sendError),
          })}
        </div>
      )}

      <form
        onSubmit={handleSend}
        className="border-t border-slate-200 p-3 flex items-center gap-2 bg-white"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('messages.placeholder')}
          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sendMessage.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white px-4 h-10 text-sm font-bold disabled:opacity-50 transition"
          aria-label={t('messages.send')}
        >
          <Icon name="send" className="w-4 h-4" />
          <span className="hidden sm:inline">
            {sendMessage.isPending ? t('messages.sending') : t('messages.send')}
          </span>
        </button>
      </form>
    </div>
  );
}
