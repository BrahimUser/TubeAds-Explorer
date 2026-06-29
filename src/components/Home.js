/**
 * Accueil marketplace : Hero + catégories + rangée annonces (~75 %) + sidebar widgets (~25 %).
 */
import { useTranslation } from 'react-i18next';
import Hero from './Hero';
import CategoryGrid from './CategoryGrid';
import RecentListings from './RecentListings';
import { SITE_GUTTER_CLASS, SITE_MAX_WIDTH_CLASS } from '../constants/layout';

/** Aperçu accueil : 15 annonces max (5 rangées × 3 colonnes) + sidebar sticky. */
export const HOME_LISTINGS_PREVIEW = 15;

export default function Home({
  isHomeMarketplace,
  isListingsStandalone,
  searchQuery,
  onSearchChange,
  category,
  onCategoryChange,
  cityFilter,
  onCityChange,
  onHeroSearchSubmit,
  onCreateAd,
  onRequireLogin,
  onPlay,
  onOpenListing,
  onEditAd,
  onVisitShop,
  previewLimitHome,
  onViewAllHome,
  onViewAllSellers,
}) {
  const { t } = useTranslation();
  return (
    <>
      {isHomeMarketplace && (
        <>
          <Hero
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            selectedCategory={category}
            onCategoryChange={onCategoryChange}
            selectedCity={cityFilter}
            onCityChange={onCityChange}
            onSubmit={onHeroSearchSubmit}
            onCreateAd={onCreateAd}
          />
          <div id="categories">
            <CategoryGrid selected={category} onSelect={onCategoryChange} />
          </div>
        </>
      )}

      {isListingsStandalone && (
        <div className="border-b border-slate-200 bg-white">
          <div className={`mx-auto ${SITE_MAX_WIDTH_CLASS} py-8 ${SITE_GUTTER_CLASS}`}>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[1.75rem]">
              {t('listings.pageTitle')}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {t('listings.pageSubtitle')}
            </p>
          </div>
        </div>
      )}

      <div id="listings">
        <RecentListings
          searchQuery={searchQuery}
          category={category}
          cityFilter={cityFilter}
          onRequireLogin={onRequireLogin}
          onPlay={onPlay}
          onOpenListing={onOpenListing}
          onEdit={onEditAd}
          onVisitShop={onVisitShop}
          previewLimit={typeof previewLimitHome === 'number' ? previewLimitHome : null}
          onViewAll={onViewAllHome}
          onViewAllSellers={onViewAllSellers}
          showSectionTitle={!isListingsStandalone}
        />
      </div>
    </>
  );
}
