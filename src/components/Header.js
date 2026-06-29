/**
 * Marketplace header — reference layout: brand, centered search, Catégories / Messages + utilities.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import useIsAdmin from '../hooks/useIsAdmin';
import { APP_NAME } from '../constants/branding';
import { SITE_GUTTER_CLASS, SITE_MAX_WIDTH_CLASS } from '../constants/layout';
import { LOCALE_STORAGE_KEY, SUPPORTED_LANGUAGES, applyLanguageToDocument } from '../i18n';
import { useUnreadNotificationsCount } from '../queries/useNotifications';
import { Icon } from './Icons';
import HeaderSearch from './search/HeaderSearch';

const LANGS = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'ar', label: 'AR', flag: '🇲🇦' },
];

function accountLabel(user, fallback) {
  if (!user) return '';
  const phone = user.phoneNumber?.replace(/\s/g, '');
  if (phone) {
    const n = phone.replace(/^\+212/, '');
    if (n.length >= 4) return `+212 …${n.slice(-4)}`;
    return phone;
  }
  const d = user.displayName?.trim();
  if (d) return d.split(/\s+/)[0];
  const email = user.email?.trim();
  if (email) return email.split('@')[0];
  return fallback;
}

function accountSubtitle(user) {
  if (!user) return '';
  if (user.phoneNumber) return user.phoneNumber;
  return user.email || '';
}

function avatarLetter(user) {
  if (!user) return '?';
  const d = user.displayName?.trim();
  if (d) return d[0].toUpperCase();
  const em = user.email?.trim();
  if (em) return em[0].toUpperCase();
  const digits = user.phoneNumber?.replace(/\D/g, '') || '';
  if (digits.length) return digits.slice(-1);
  return '?';
}

export default function Header({
  activeNavId = 'home',
  onNavigate,
  onOpenMessages,
  onLogin,
  onCreateAd,
  onVisitOwnShop,
  onAdminDashboard,
  transparent = false,
  locale,
  onLocaleChange,
  onOpenListing,
}) {
  const { t, i18n } = useTranslation();
  const { user, signOut, role } = useAuth();
  const { isAdmin, ready } = useIsAdmin();
  const [accountOpen, setAccountOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langWrapRef = useRef(null);
  const accountWrapRef = useRef(null);
  const { data: unreadCount = 0 } = useUnreadNotificationsCount(user?.uid, { enabled: !!user });
  const [notifOpen, setNotifOpen] = useState(false);
  const notifWrapRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (langWrapRef.current && !langWrapRef.current.contains(e.target)) {
        setLangOpen(false);
      }
      if (notifWrapRef.current && !notifWrapRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (accountWrapRef.current && !accountWrapRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    if (!user) setNotifOpen(false);
  }, [user]);

  const MOBILE_NAV = [
    { id: 'home', label: t('navbar.home') },
    { id: 'categories', label: t('navbar.categories') },
    { id: 'listings', label: t('navbar.listings') },
    { id: 'messages', label: t('navbar.messages') },
  ];

  function handleNav(id) {
    if (id === 'messages') {
      onOpenMessages?.();
      return;
    }
    onNavigate?.(id);
  }

  const resolvedLocale =
    (locale && SUPPORTED_LANGUAGES.includes(locale) ? locale : null) ||
    i18n.language ||
    (typeof window !== 'undefined' ? localStorage.getItem(LOCALE_STORAGE_KEY) || 'fr' : 'fr');

  function pickLang(code) {
    if (!SUPPORTED_LANGUAGES.includes(code)) return;
    onLocaleChange?.(code);
    i18n.changeLanguage(code);
    applyLanguageToDocument(code);
    setLangOpen(false);
  }

  useEffect(() => {
    if (!locale) return;
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
    applyLanguageToDocument(locale);
  }, [locale, i18n]);

  const currentLang = LANGS.find((l) => l.code === resolvedLocale) || LANGS[1];
  const langLabel = currentLang.label;
  const langFlag = currentLang.flag;
  const isRtl = resolvedLocale === 'ar' || i18n.language === 'ar';

  const headerClass = transparent
    ? 'sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.05)]'
    : 'sticky top-0 z-50 border-b border-slate-200/80 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]';

  return (
    <header className={headerClass}>
      <div className={`mx-auto ${SITE_MAX_WIDTH_CLASS} ${SITE_GUTTER_CLASS}`}>
        <div className="flex flex-col gap-3 py-3 sm:py-0 sm:pb-0">
          <div className="flex h-[60px] items-center gap-3 sm:h-[72px] sm:gap-4">
            <a
              href="/"
              className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              aria-label={`${APP_NAME} · ${t('navbar.home')}`}
              onClick={(e) => {
                e.preventDefault();
                handleNav('home');
              }}
            >
              <img
                src={`${process.env.PUBLIC_URL || ''}/logosite.png`}
                alt=""
                className="h-10 w-auto shrink-0 object-contain"
                draggable="false"
              />
              <span className="hidden text-lg font-extrabold tracking-tight text-slate-900 min-[400px]:inline sm:text-xl">
                {APP_NAME}
              </span>
            </a>

            <HeaderSearch onOpenListing={onOpenListing} className="hidden md:block" />

            <div className="ms-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={() => onCreateAd?.()}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-3.5 py-2 text-sm font-extrabold text-white shadow-[0_4px_14px_rgba(247,107,28,0.35)] transition hover:bg-brand-600 sm:px-5 sm:py-2.5"
              >
                <Icon name="plus" className="h-4 w-4 shrink-0" />
                <span>{t('navbar.postAd')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNav('categories')}
                className={
                  'hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition sm:inline-flex ' +
                  (activeNavId === 'categories'
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-slate-700 hover:bg-slate-50')
                }
              >
                <Icon name="grid" className="h-4 w-4" />
                <span className="hidden lg:inline">{t('navbar.categories')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNav('messages')}
                className={
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition ' +
                  (activeNavId === 'messages'
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-slate-700 hover:bg-slate-50')
                }
              >
                <Icon name="message" className="h-4 w-4" />
                <span className="hidden lg:inline">{t('navbar.messages')}</span>
              </button>

              <div className="relative" ref={notifWrapRef}>
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen((v) => !v);
                  }}
                  className="relative grid h-11 w-11 place-items-center rounded-full text-slate-700 transition hover:bg-slate-50"
                  aria-label={t('navbar.notifications')}
                  aria-expanded={notifOpen}
                  aria-haspopup="menu"
                >
                  <Icon name="bell" className="h-5 w-5" />
                  {unreadCount > 0 && (
                    unreadCount <= 9 ? (
                      <span className="absolute -top-0.5 end-0.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-red-500 px-1 text-[11px] font-extrabold leading-none text-white shadow-sm">
                        {unreadCount}
                      </span>
                    ) : (
                      <span className="absolute -top-0.5 end-0.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold leading-none text-white shadow-sm">
                        9+
                      </span>
                    )
                  )}
                </button>

                {notifOpen && (
                  <div
                    role="menu"
                    className={
                      'absolute z-[999] mt-2 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ' +
                      (isRtl ? 'start-0' : 'end-0')
                    }
                  >
                    <div className="border-b border-slate-100 px-4 py-3">
                      <div className="text-sm font-extrabold text-slate-900">
                        {t('navbar.notifications')}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Aucune notification non lue'}
                      </div>
                    </div>

                    {/* Hardcoded test notification to validate UI/positioning. */}
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full px-4 py-3 text-start hover:bg-slate-50"
                      onClick={() => setNotifOpen(false)}
                    >
                      <div className="text-sm font-semibold text-slate-900">
                        Test: Vous avez un nouveau message
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">À l’instant</div>
                    </button>
                  </div>
                )}
              </div>

              <div className="relative" ref={langWrapRef}>
                <button
                  type="button"
                  aria-expanded={langOpen}
                  aria-haspopup="listbox"
                  onClick={() => setLangOpen((v) => !v)}
                  className="inline-flex h-11 items-center gap-1 rounded-full px-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-3"
                >
                  <span aria-hidden className="text-base leading-none">{langFlag}</span>
                  <span className="min-w-[28px] text-start">{langLabel}</span>
                  <Icon name="chevronDown" className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                </button>
                {langOpen && (
                  <ul
                    role="listbox"
                    className="absolute end-0 z-[60] mt-1 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg"
                  >
                    {LANGS.map((l) => (
                      <li key={l.code}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={resolvedLocale === l.code}
                          onClick={() => pickLang(l.code)}
                          className={
                            'flex w-full items-center gap-2 px-3 py-2 text-start hover:bg-slate-50 ' +
                            (resolvedLocale === l.code ? 'font-semibold text-brand-600' : '')
                          }
                        >
                          <span aria-hidden className="text-base leading-none">{l.flag}</span>
                          <span>{l.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="relative" ref={accountWrapRef}>
                <button
                  type="button"
                  onClick={() => setAccountOpen((o) => !o)}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  className="flex max-w-[160px] items-center gap-1.5 rounded-full py-1 ps-1 pe-2 transition hover:bg-orange-50/80"
                  aria-label={t('navbar.account')}
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-orange-100 text-sm font-semibold text-brand-700 ring-2 ring-white">
                    {user ? avatarLetter(user) : <Icon name="user" className="h-4 w-4" />}
                  </span>
                  {user && (
                    <span className="hidden max-w-[88px] truncate text-sm font-semibold text-slate-800 min-[900px]:inline">
                      {accountLabel(user, t('navbar.account'))}
                    </span>
                  )}
                  <Icon name="chevronDown" className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                </button>

                {accountOpen && (
                  <div
                    role="menu"
                    className={
                      'absolute z-[90] mt-2 w-[min(100vw-2rem,260px)] overflow-hidden rounded-2xl border border-orange-100 bg-white py-1.5 text-sm shadow-xl ring-1 ring-orange-50 ' +
                      (isRtl ? 'start-0' : 'end-0')
                    }
                  >
                    {user ? (
                      <>
                        <div className="border-b border-orange-50 px-3 py-2.5">
                          <div className="truncate text-xs font-medium text-slate-500">
                            {accountSubtitle(user)}
                          </div>
                          {role === 'admin' && (
                            <button
                              type="button"
                              className="mt-2 w-full rounded-lg bg-orange-500 px-2 py-2.5 text-center text-xs font-extrabold uppercase tracking-wide text-white shadow-sm ring-1 ring-orange-600 hover:bg-orange-600"
                              onClick={() => {
                                setAccountOpen(false);
                                onAdminDashboard?.();
                              }}
                            >
                              ACCÈS ADMIN
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-start font-medium text-slate-800 transition hover:bg-orange-50/80"
                          onClick={() => {
                            setAccountOpen(false);
                            onVisitOwnShop?.();
                          }}
                        >
                          <Icon name="user" className="h-4 w-4 shrink-0 text-brand-600" />
                          {t('navbar.myProfile')}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-start font-medium text-slate-800 transition hover:bg-orange-50/80"
                          onClick={() => {
                            setAccountOpen(false);
                            onNavigate?.('myads');
                          }}
                        >
                          <Icon name="fileText" className="h-4 w-4 shrink-0 text-brand-600" />
                          {t('navbar.myAds')}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-start font-medium text-slate-800 transition hover:bg-orange-50/80"
                          onClick={() => {
                            setAccountOpen(false);
                            onNavigate?.('myfavourites');
                          }}
                        >
                          <Icon name="heartFilled" className="h-4 w-4 shrink-0 text-brand-600" />
                          {t('navbar.myFavourites')}
                        </button>
                        {ready && isAdmin && (
                          <button
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-start font-medium text-slate-800 transition hover:bg-orange-50/80"
                            onClick={() => {
                              setAccountOpen(false);
                              onAdminDashboard?.();
                            }}
                          >
                            <Icon name="shield" className="h-4 w-4 shrink-0 text-brand-600" />
                            {t('navbar.adminDashboard')}
                          </button>
                        )}
                        <div className="my-1 border-t border-orange-50" />
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-start font-medium text-slate-700 transition hover:bg-orange-50/80"
                          onClick={() => {
                            setAccountOpen(false);
                            signOut();
                          }}
                        >
                          <Icon name="logout" className="h-4 w-4 shrink-0 text-brand-600" />
                          {t('navbar.logout')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-start font-semibold text-slate-800 transition hover:bg-orange-50/80"
                          onClick={() => {
                            setAccountOpen(false);
                            onLogin?.('signin');
                          }}
                        >
                          <Icon name="user" className="h-4 w-4 shrink-0 text-brand-600" />
                          {t('navbar.profileSignIn')}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-start font-semibold text-slate-800 transition hover:bg-orange-50/80"
                          onClick={() => {
                            setAccountOpen(false);
                            onLogin?.('signup');
                          }}
                        >
                          <Icon name="plus" className="h-4 w-4 shrink-0 text-brand-600" />
                          {t('navbar.profileSignUp')}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <HeaderSearch onOpenListing={onOpenListing} className="pb-2 md:hidden" />
        </div>

        <nav
          className="flex gap-1 overflow-x-auto pb-3 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={t('navbar.mobileNav')}
        >
          {MOBILE_NAV.map((item) => {
            const active = activeNavId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={
                  'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition ' +
                  (active ? 'bg-brand-50 text-brand-600' : 'bg-white text-slate-700 ring-1 ring-slate-200/80')
                }
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
