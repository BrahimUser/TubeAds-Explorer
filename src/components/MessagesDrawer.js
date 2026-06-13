// Slide-in messages panel. Reads from the same `chatThreads` collection the
// mobile app uses, so unread conversations show up wherever the user signs in.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  listenChatThreads,
  listenThreadMessages,
  sendChatMessage,
} from '../services/chat';
import { useSellerProfiles } from '../hooks/useSellerProfiles';
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

function formatRelative(ts) {
  const ms = tsMs(ts);
  if (ms == null) return '';
  const minutes = Math.round((Date.now() - ms) / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const h = Math.round(minutes / 60);
  if (h < 24) return `Il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 14) return `Il y a ${d} j`;
  return `Il y a ${Math.round(d / 7)} sem.`;
}

/**
 * Firestore returns `failed-precondition` while a composite index is still
 * being provisioned (or hasn't been created yet). We use this to render a
 * "building index" loader instead of the scarier red error banner.
 */
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

function displayNameFor(uid, profile) {
  const name = profile?.shopName?.trim();
  if (name) return name;
  if (!uid) return 'Vendeur';
  return `Vendeur · ${uid.slice(0, 6)}…`;
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
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

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
    setLoading(true);
    setError(null);

    // The inbox listener is recreated every time it errors out so the UI
    // recovers automatically once a freshly-created Firestore composite
    // index finishes building (Firestore otherwise terminates onSnapshot
    // after the first error).
    let unsubscribe = null;
    let retryTimer = null;
    let cancelled = false;

    const subscribe = () => {
      if (cancelled) return;
      unsubscribe = listenChatThreads(
        user.uid,
        (list) => {
          // Each successful snapshot wipes any previous index/permission
          // error so the loading state disappears once the listener
          // recovers.
          setError(null);
          setThreads(list);
          setLoading(false);
          setActiveId((prev) => {
            if (initialThreadId && list.some((t) => t.id === initialThreadId)) {
              return initialThreadId;
            }
            return prev ?? list[0]?.id ?? null;
          });
        },
        (err) => {
          setError(err);
          setLoading(false);
          // Polling retry: while the index is provisioning, keep trying
          // every 30s so the drawer self-heals when Firestore is ready.
          if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
          }
          retryTimer = window.setTimeout(subscribe, 30000);
        },
      );
    };

    subscribe();

    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      if (unsubscribe) unsubscribe();
    };
  }, [open, user, onClose, onRequireLogin, initialThreadId]);

  // If a specific thread is requested (e.g. from "Contacter le vendeur"),
  // make it the active one as soon as it shows up in the live thread list.
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
          'absolute right-0 top-0 h-full w-full sm:w-[796px] max-w-full bg-white shadow-2xl flex flex-col ' +
          'transition-transform duration-300 ease-out motion-reduce:transition-none ' +
          (visible ? 'translate-x-0' : 'translate-x-full')
        }
      >
        <header className="flex items-center justify-between px-5 h-14 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">Messages</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close messages"
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
          loading={loading}
          error={error}
        />
      </aside>
    </div>
  );
}

function DrawerBody({ user, threads, activeId, setActiveId, loading, error }) {
  // Resolve the "other person" on every thread once, so the list and the
  // active-chat header can both display their name/avatar without redundant
  // fetches.
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
      />
      <ChatPane
        key={activeId || 'empty'}
        user={user}
        thread={threads.find((t) => t.id === activeId) || null}
        profiles={profiles}
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

function IndexBuildingNotice() {
  return (
    <div className="border-r border-slate-200 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className="inline-block h-3 w-3 rounded-full border-2 border-brand-500 border-r-transparent animate-spin" />
        Préparation de la boîte de réception…
      </div>
      <p className="text-xs leading-relaxed text-slate-500">
        Firestore est en train de créer l’index pour la liste de vos
        conversations. Cela prend généralement&nbsp;1&nbsp;à&nbsp;5&nbsp;minutes.
        La page se mettra à jour automatiquement dès que ce sera prêt — pas
        besoin de rafraîchir.
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

function ThreadList({ user, profiles, threads, activeId, onSelect, loading, error }) {
  if (loading) return <ThreadListSkeleton />;

  // While the composite index is still being provisioned by Firestore,
  // show a friendly progress notice instead of the red "couldn't load" error.
  if (error && isIndexBuildingError(error)) {
    return <IndexBuildingNotice />;
  }
  if (error) {
    return (
      <div className="border-r border-slate-200 p-4 text-sm text-red-700">
        Impossible de charger les conversations : {error.message}
      </div>
    );
  }
  if (threads.length === 0) {
    return (
      <div className="border-r border-slate-200 p-4 text-sm text-slate-500">
        Aucune conversation pour l’instant. Cliquez sur « Contacter le vendeur » depuis une annonce.
      </div>
    );
  }
  return (
    <ul className="border-r border-slate-200 overflow-y-auto">
      {threads.map((t) => {
        const active = t.id === activeId;
        const otherUid = otherUidFor(t, user?.uid);
        const profile = profiles?.[otherUid];
        const name = displayNameFor(otherUid, profile);
        const time = formatRelative(t.lastMessageAt || t.updatedAt || t.createdAt);
        const subtitle = t.lastMessageText?.trim() || t.productTitle || t.priceLabel || '';
        return (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onSelect(t.id)}
              className={
                'w-full flex items-center gap-3 px-3 py-3 text-left border-b border-slate-100 transition ' +
                (active ? 'bg-brand-50/60' : 'hover:bg-slate-50')
              }
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden">
                  {t.productThumb ? (
                    <img
                      src={t.productThumb}
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
                {t.productTitle && (
                  <div className="text-[11px] font-medium text-slate-500 truncate">
                    {t.productTitle}
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

function ChatPane({ user, thread, profiles }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const scrollerRef = useRef(null);

  const otherUid = thread ? otherUidFor(thread, user?.uid) : '';
  const otherProfile = otherUid ? profiles?.[otherUid] : null;
  const otherName = displayNameFor(otherUid, otherProfile);

  useEffect(() => {
    setMessages([]);
    if (!thread) return undefined;
    // Real-time messages: onSnapshot pushes any new message into state as
    // soon as Firestore commits it, so the chat updates without a refresh.
    return listenThreadMessages(thread.id, setMessages, (err) =>
      console.warn('messages listener', err),
    );
  }, [thread]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sortedMessages = useMemo(() => messages.slice(), [messages]);

  if (!thread) {
    return (
      <div className="grid place-items-center text-sm text-slate-500 p-6">
        Sélectionnez une conversation pour afficher les messages.
      </div>
    );
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setSendError(null);
    try {
      await sendChatMessage(thread.id, text, {
        listingId: thread.listingId || thread.adId || null,
        recipientId: otherUid,
        senderName: user?.displayName || user?.email || '',
      });
      setDraft('');
    } catch (err) {
      console.error('sendChatMessage', err);
      setSendError(err);
    } finally {
      setSending(false);
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
            {thread.productTitle ? `À propos de : ${thread.productTitle}` : 'Conversation'}
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
                  {formatTime(m.createdAt || m.timestamp) || (mine ? 'Envoi…' : '')}
                </div>
              </div>
            </div>
          );
        })}
        {sortedMessages.length === 0 && (
          <div className="text-center text-xs text-slate-400 py-6">
            Dites bonjour au vendeur — votre message lui arrivera aussi sur mobile.
          </div>
        )}
      </div>

      {sendError && (
        <div className="px-4 pb-1 text-xs font-medium text-red-600">
          Échec de l’envoi : {sendError.message || String(sendError)}
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
          placeholder="Écrivez un message…"
          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white px-4 h-10 text-sm font-bold disabled:opacity-50 transition"
          aria-label="Envoyer"
        >
          <Icon name="send" className="w-4 h-4" />
          <span className="hidden sm:inline">{sending ? 'Envoi…' : 'Envoyer'}</span>
        </button>
      </form>
    </div>
  );
}
