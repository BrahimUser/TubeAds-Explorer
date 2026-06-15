import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import Header from './components/Header';
import Home, { HOME_LISTINGS_PREVIEW } from './components/Home';
import Footer from './components/Footer';
import FooterInfoPage from './components/FooterInfoPage';
import LoginModal from './components/LoginModal';
import MessagesDrawer from './components/MessagesDrawer';
import MyAdsPage from './components/MyAdsPage';
import VideoPlayerModal from './components/VideoPlayerModal';
import EditAdModal from './components/EditAdModal';
import CreateAdModal from './components/CreateAdModal';
import AdminDashboard from './components/AdminDashboard';
import ShopPage from './components/ShopPage';
import ProductDetailPage from './components/ProductDetailPage';
import TopSellersPage from './components/TopSellersPage';
import {
  LOCALE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  applyLanguageToDocument,
  isRtlLanguage,
} from './i18n';
import {
  isAdminDashboardPath,
  matchShopPath,
  matchListingPath,
  listingPathForId,
  matchCheckoutPath,
  matchFooterInfoPath,
  normalizePathname,
  pushPath,
  shopPathForUser,
  subscribePathname,
  ADMIN_DASHBOARD_PATH,
  LISTINGS_PAGE_PATH,
  SELLERS_PAGE_PATH,
  MY_ADS_PAGE_PATH,
  isListingsPagePath,
  isSellersPagePath,
  isMyAdsPagePath,
} from './utils/routing';

const LISTING_PDP_RETURN_KEY = 'marketplace-listing-pdp-return';
const LOGIN_RETURN_PATH_KEY = 'marketplace-login-return-path';

export default function App() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </LoadingProvider>
  );
}

function Shell() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [pathname, setPathname] = useState(() => normalizePathname(window.location.pathname));
  const [page, setPage] = useState('listings');
  const [navId, setNavId] = useState(() => {
    if (typeof window === 'undefined') return 'home';
    return isListingsPagePath(normalizePathname(window.location.pathname))
      ? 'listings'
      : 'home';
  });
  const [locale, setLocaleState] = useState(() => {
    if (typeof window === 'undefined') return 'fr';
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;
    return i18n.language && SUPPORTED_LANGUAGES.includes(i18n.language) ? i18n.language : 'fr';
  });

  const setLocale = useCallback(
    (next) => {
      if (!next || !SUPPORTED_LANGUAGES.includes(next)) return;
      setLocaleState(next);
      if (i18n.language !== next) {
        i18n.changeLanguage(next);
      }
      applyLanguageToDocument(next);
    },
    [i18n],
  );

  useEffect(() => {
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
    applyLanguageToDocument(locale);
  }, [locale, i18n]);

  // Keep local state in sync if i18n.changeLanguage() is invoked from elsewhere
  // (e.g. another component). This guarantees that `dir` and the active locale
  // always reflect the real i18next state, so the whole tree re-renders.
  useEffect(() => {
    function onLanguageChanged(lang) {
      if (!lang || !SUPPORTED_LANGUAGES.includes(lang)) return;
      setLocaleState((prev) => (prev === lang ? prev : lang));
      applyLanguageToDocument(lang);
    }
    i18n.on('languageChanged', onLanguageChanged);
    return () => i18n.off('languageChanged', onLanguageChanged);
  }, [i18n]);

  const isRtl = isRtlLanguage(locale);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState(null);
  const [cityFilter, setCityFilter] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginAuthIntent, setLoginAuthIntent] = useState('signin');
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [messagesThreadId, setMessagesThreadId] = useState(null);
  const [activeAd, setActiveAd] = useState(null);
  const [editingAd, setEditingAd] = useState(null);
  const [createAdOpen, setCreateAdOpen] = useState(false);

  const openMessages = useCallback((threadId) => {
    if (threadId && typeof threadId === 'string') {
      setMessagesThreadId(threadId);
    } else {
      setMessagesThreadId(null);
    }
    setNavId('messages');
    setMessagesOpen(true);
  }, []);

  const closeMessages = useCallback(() => {
    setMessagesOpen(false);
    setMessagesThreadId(null);
  }, []);

  const openLoginModal = useCallback((intent = 'signin') => {
    try {
      sessionStorage.setItem(
        LOGIN_RETURN_PATH_KEY,
        normalizePathname(window.location.pathname),
      );
    } catch {
      /* private mode / quota */
    }
    setLoginAuthIntent(intent === 'signup' ? 'signup' : 'signin');
    setLoginOpen(true);
  }, []);

  const requireLogin = useCallback(() => openLoginModal('signin'), [openLoginModal]);

  const openCreateAd = useCallback(() => {
    if (!user) {
      requireLogin();
      return;
    }
    setCreateAdOpen(true);
  }, [user, requireLogin]);

  const resetPathToHome = useCallback(() => {
    pushPath('/');
    setPathname(normalizePathname('/'));
  }, []);

  const goShop = useCallback((uid) => {
    if (!uid) return;
    const path = shopPathForUser(uid);
    pushPath(path);
    setPathname(normalizePathname(path));
  }, []);

  const goListingsPage = useCallback(() => {
    pushPath(LISTINGS_PAGE_PATH);
    setPathname(normalizePathname(LISTINGS_PAGE_PATH));
    setNavId('listings');
    setPage('listings');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goAdminDashboard = useCallback(() => {
    pushPath(ADMIN_DASHBOARD_PATH);
    setPathname(normalizePathname(ADMIN_DASHBOARD_PATH));
  }, []);

  const goListingDetail = useCallback((adId) => {
    if (!adId) return;
    try {
      const cur = normalizePathname(window.location.pathname);
      if (!matchListingPath(cur)) {
        sessionStorage.setItem(LISTING_PDP_RETURN_KEY, cur);
      }
    } catch {
      /* ignore private mode / quota */
    }
    const path = listingPathForId(adId);
    pushPath(path);
    setPathname(normalizePathname(path));
    window.scrollTo(0, 0);
  }, []);

  const closeListingDetail = useCallback(() => {
    let ret = '/';
    try {
      const stored = sessionStorage.getItem(LISTING_PDP_RETURN_KEY);
      if (stored) {
        const n = normalizePathname(stored);
        if (!matchListingPath(n)) ret = n;
      }
      sessionStorage.removeItem(LISTING_PDP_RETURN_KEY);
    } catch {
      /* ignore */
    }
    pushPath(ret);
    setPathname(normalizePathname(ret));
    if (isListingsPagePath(normalizePathname(ret))) setNavId('listings');
    else if (normalizePathname(ret) === '/') setNavId('home');
    window.scrollTo(0, 0);
  }, []);

  const goSellersPage = useCallback(() => {
    pushPath(SELLERS_PAGE_PATH);
    setPathname(normalizePathname(SELLERS_PAGE_PATH));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goHome = useCallback(() => {
    resetPathToHome();
    setPage('listings');
    setNavId('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [resetPathToHome]);

  const navigateToPath = useCallback((nextPath) => {
    const next = normalizePathname(nextPath || '/');
    pushPath(next);
    setPathname(next);
    window.scrollTo(0, 0);
  }, []);

  /** After phone OTP sign-in: return to the page the user was on, or home. */
  const navigateAfterPhoneLogin = useCallback(() => {
    let path = '/';
    try {
      const stored = sessionStorage.getItem(LOGIN_RETURN_PATH_KEY);
      sessionStorage.removeItem(LOGIN_RETURN_PATH_KEY);
      if (stored) path = normalizePathname(stored);
    } catch {
      /* ignore */
    }
    if (!path) path = '/';
    pushPath(path);
    setPathname(path);
    if (path === '/' || path === '') {
      setPage('listings');
      setNavId('home');
    } else if (isListingsPagePath(path)) {
      setPage('listings');
      setNavId('listings');
    } else if (matchListingPath(path)?.listingId) {
      setPage('listings');
    } else if (matchCheckoutPath(path)?.listingId) {
      setPage('listings');
    } else if (isSellersPagePath(path)) {
      setPage('listings');
    } else if (isAdminDashboardPath(path)) {
      setPage('listings');
    } else if (matchShopPath(path)?.userId) {
      setPage('listings');
    } else if (matchFooterInfoPath(path)) {
      setPage('listings');
    } else if (isMyAdsPagePath(path)) {
      setPage('listings');
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    return subscribePathname(() =>
      setPathname(normalizePathname(window.location.pathname)),
    );
  }, []);

  // Checkout removed: old /checkout/:id links go to the listing PDP.
  useLayoutEffect(() => {
    const m = matchCheckoutPath(pathname);
    if (!m?.listingId) return;
    const target = listingPathForId(m.listingId);
    if (normalizePathname(pathname) === normalizePathname(target)) return;
    pushPath(target);
    setPathname(normalizePathname(target));
    window.scrollTo(0, 0);
  }, [pathname]);

  function scrollToId(id) {
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function handleNavigate(id) {
    if (
      isAdminDashboardPath(pathname) ||
      matchShopPath(pathname) ||
      matchListingPath(pathname) ||
      matchCheckoutPath(pathname) ||
      isSellersPagePath(pathname) ||
      isMyAdsPagePath(pathname) ||
      matchFooterInfoPath(pathname)
    ) {
      resetPathToHome();
    }

    if (id === 'messages') {
      if (!user) {
        requireLogin();
        return;
      }
      openMessages();
      return;
    }

    if (id === 'myads') {
      if (!user) {
        requireLogin();
        return;
      }
      pushPath(MY_ADS_PAGE_PATH);
      setPathname(normalizePathname(MY_ADS_PAGE_PATH));
      setNavId('myads');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setPage('listings');
    if (id === 'home') {
      if (normalizePathname(pathname) !== '/') {
        pushPath('/');
        setPathname(normalizePathname('/'));
      }
      setNavId('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (id === 'categories') {
      if (normalizePathname(pathname) !== '/') {
        pushPath('/');
        setPathname(normalizePathname('/'));
      }
      setNavId('categories');
      scrollToId('categories');
    } else if (id === 'listings') {
      setNavId('listings');
      pushPath(LISTINGS_PAGE_PATH);
      setPathname(normalizePathname(LISTINGS_PAGE_PATH));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setNavId('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const adminRoute = isAdminDashboardPath(pathname);
  const shopMatch = matchShopPath(pathname);
  const shopRoute = !!shopMatch?.userId;
  const listingMatch = matchListingPath(pathname);
  const listingRoute = !!listingMatch?.listingId;
  const checkoutMatch = matchCheckoutPath(pathname);
  const checkoutRoute = !!checkoutMatch?.listingId;
  const sellersRoute = isSellersPagePath(pathname);
  const myAdsRoute = isMyAdsPagePath(pathname);
  const footerInfoPath = matchFooterInfoPath(pathname);
  const footerInfoRoute = !!footerInfoPath;
  const isListings = page === 'listings';
  const pathNorm = normalizePathname(pathname);
  const isHomeMarketplace =
    !shopRoute &&
    !adminRoute &&
    !listingRoute &&
    !checkoutRoute &&
    !sellersRoute &&
    !myAdsRoute &&
    !footerInfoRoute &&
    isListings &&
    pathNorm === '/';
  const isListingsStandalone =
    !shopRoute &&
    !adminRoute &&
    !listingRoute &&
    !checkoutRoute &&
    !sellersRoute &&
    !myAdsRoute &&
    !footerInfoRoute &&
    isListings &&
    isListingsPagePath(pathname);
  const headerNavId =
    !isListings ||
    adminRoute ||
    shopRoute ||
    listingRoute ||
    checkoutRoute ||
    sellersRoute ||
    myAdsRoute ||
    footerInfoRoute
      ? ''
      : isListingsStandalone
        ? 'listings'
        : navId;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      lang={locale}
      className="min-h-screen bg-slate-50 text-slate-900 antialiased"
    >
      <Header
        activeNavId={headerNavId}
        locale={locale}
        onLocaleChange={setLocale}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => scrollToId('listings')}
        onOpenMessages={() => {
          if (!user) {
            requireLogin();
            return;
          }
          openMessages();
        }}
        onLogin={openLoginModal}
        onVisitOwnShop={() => {
          if (!user?.uid) return;
          goShop(user.uid);
        }}
        onAdminDashboard={goAdminDashboard}
        transparent={isHomeMarketplace}
      />

      {shopRoute && !footerInfoRoute && (
        <ShopPage
          sellerId={shopMatch.userId}
          onRequireLogin={requireLogin}
          onPlay={(ad) => setActiveAd(ad)}
          onOpenListing={goListingDetail}
          onEdit={(ad) => {
            if (!user) {
              requireLogin();
              return;
            }
            setEditingAd(ad);
          }}
          onCreateAd={openCreateAd}
          onNavigateHome={resetPathToHome}
          onVisitShop={goShop}
        />
      )}

      {!shopRoute &&
        !adminRoute &&
        !checkoutRoute &&
        !sellersRoute &&
        !footerInfoRoute &&
        listingRoute && (
        <ProductDetailPage
          listingId={listingMatch.listingId}
          onBack={closeListingDetail}
          onPlay={(ad) => setActiveAd(ad)}
          onVisitShop={goShop}
          onRequireLogin={requireLogin}
          onOpenMessages={(threadId) => openMessages(threadId)}
          onEdit={(ad) => {
            if (!user) {
              requireLogin();
              return;
            }
            setEditingAd(ad);
          }}
        />
      )}

      {!shopRoute &&
        !adminRoute &&
        !checkoutRoute &&
        !listingRoute &&
        !footerInfoRoute &&
        sellersRoute && (
        <TopSellersPage
          onClose={resetPathToHome}
          onNavigateHome={resetPathToHome}
          onVisitShop={goShop}
        />
      )}

      {!shopRoute && !checkoutRoute && !sellersRoute && !footerInfoRoute && adminRoute && (
        <main className="min-h-screen">
          <AdminDashboard onRequireLogin={requireLogin} onNavigateHome={resetPathToHome} />
        </main>
      )}

      {!shopRoute &&
        !adminRoute &&
        !listingRoute &&
        !checkoutRoute &&
        !sellersRoute &&
        !myAdsRoute &&
        !footerInfoRoute &&
        isListings && (
        <main>
          <Home
            isHomeMarketplace={isHomeMarketplace}
            isListingsStandalone={isListingsStandalone}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            category={category}
            onCategoryChange={setCategory}
            cityFilter={cityFilter}
            onCityChange={setCityFilter}
            onHeroSearchSubmit={() => scrollToId('listings')}
            onRequireLogin={requireLogin}
            onPlay={(ad) => setActiveAd(ad)}
            onOpenListing={goListingDetail}
            onEditAd={(ad) => {
              if (!user) {
                requireLogin();
                return;
              }
              setEditingAd(ad);
            }}
            onVisitShop={goShop}
            previewLimitHome={isHomeMarketplace ? HOME_LISTINGS_PREVIEW : undefined}
            onViewAllHome={isHomeMarketplace ? goListingsPage : undefined}
            onViewAllSellers={goSellersPage}
          />
        </main>
      )}

      {!shopRoute &&
        !adminRoute &&
        !listingRoute &&
        !checkoutRoute &&
        !sellersRoute &&
        !footerInfoRoute &&
        myAdsRoute && (
        <main className="min-h-screen pt-4">
          <MyAdsPage
            onRequireLogin={requireLogin}
            onEditAd={(ad) => {
              if (!user) {
                requireLogin();
                return;
              }
              setEditingAd(ad);
            }}
            onCreateAd={openCreateAd}
          />
        </main>
      )}

      {!shopRoute && !adminRoute && footerInfoRoute && (
        <FooterInfoPage
          path={footerInfoPath}
          onBack={goHome}
          onNavigate={navigateToPath}
        />
      )}

      {!adminRoute && (
        <Footer onHome={goHome} onNavigatePath={navigateToPath} />
      )}

      <LoginModal
        open={loginOpen}
        authIntent={loginAuthIntent}
        onClose={() => setLoginOpen(false)}
        onSignedIn={navigateAfterPhoneLogin}
      />
      <MessagesDrawer
        open={messagesOpen}
        onClose={closeMessages}
        initialThreadId={messagesThreadId}
        onRequireLogin={requireLogin}
      />
      <VideoPlayerModal open={!!activeAd} ad={activeAd} onClose={() => setActiveAd(null)} />
      <EditAdModal
        open={!!editingAd}
        ad={editingAd}
        onClose={() => setEditingAd(null)}
        onSaved={() => {}}
      />
      <CreateAdModal
        open={createAdOpen}
        onClose={() => setCreateAdOpen(false)}
        onCreated={() => {}}
      />
    </div>
  );
}
