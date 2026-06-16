/**
 * Marketplace taxonomy: categories and cities.
 *
 * Single source of truth for the "structured" parts of an ad. The form
 * and Home filter use the same `CategoryId` keys; **`categoryFirestoreValue`**
 * is what gets written to Firestore and used in `where('category', '==', …)`
 * — English labels (e.g. `Electronics`, `Real Estate`) so they match the UI.
 *
 * `id` — stable key in app code (icons, chip order, dropdown values).
 * `label` — English string stored in Firestore and shown in the UI.
 */

export type CategoryId =
  | 'rugs'
  | 'electronics'
  | 'vehicles'
  | 'real-estate'
  | 'fashion'
  | 'home'
  | 'jobs'
  | 'services'
  | 'other';

export type Category = { id: CategoryId; label: string };

/**
 * Ordered category list. The first entry doubles as the default "All"
 * filter on the Home feed (handled separately — see `HomeScreen`).
 */
export const CATEGORIES: ReadonlyArray<Category> = [
  { id: 'rugs', label: 'Rugs' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'real-estate', label: 'Real Estate' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'home', label: 'Home' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'services', label: 'Services' },
  { id: 'other', label: 'Others' },
];

/** Label for the “all categories” Home filter (no `category` in Firestore query). */
export const CATEGORY_ALL_LABEL = 'All';

/** Value to persist on `listings.category` and to use in Firestore equality queries. */
export function categoryFirestoreValue(id: CategoryId): string {
  const row = CATEGORIES.find((c) => c.id === id);
  if (!row) return id;
  return row.label;
}

/**
 * Display label for a stored `category` (English), a legacy slug id, or
 * any unknown string (pass-through).
 */
export function categoryLabel(stored: string): string {
  const byId = CATEGORIES.find((c) => c.id === stored);
  if (byId) return byId.label;
  const byLabel = CATEGORIES.find((c) => c.label === stored);
  if (byLabel) return byLabel.label;
  return stored;
}

/**
 * Major Moroccan cities. Sorted by approximate population so the most
 * common picks are at the top of the dropdown. Add more as needed —
 * existing ads tagged with a removed city won't break (we just show
 * the raw id as a fallback).
 */
export type CityId =
  | 'casablanca'
  | 'rabat'
  | 'fes'
  | 'marrakech'
  | 'tangier'
  | 'agadir'
  | 'meknes'
  | 'oujda'
  | 'kenitra'
  | 'tetouan'
  | 'sale'
  | 'sale-el-jadida'
  | 'nador'
  | 'mohammedia'
  | 'beni-mellal'
  | 'el-jadida'
  | 'taza'
  | 'settat'
  | 'laayoune'
  | 'dakhla'
  | 'other';

export type City = { id: CityId; label: string };

export const CITIES: ReadonlyArray<City> = [
  { id: 'casablanca', label: 'Casablanca' },
  { id: 'rabat', label: 'Rabat' },
  { id: 'fes', label: 'Fès' },
  { id: 'marrakech', label: 'Marrakech' },
  { id: 'tangier', label: 'Tangier' },
  { id: 'agadir', label: 'Agadir' },
  { id: 'meknes', label: 'Meknès' },
  { id: 'oujda', label: 'Oujda' },
  { id: 'kenitra', label: 'Kenitra' },
  { id: 'tetouan', label: 'Tétouan' },
  { id: 'sale', label: 'Salé' },
  { id: 'nador', label: 'Nador' },
  { id: 'mohammedia', label: 'Mohammedia' },
  { id: 'beni-mellal', label: 'Beni Mellal' },
  { id: 'el-jadida', label: 'El Jadida' },
  { id: 'taza', label: 'Taza' },
  { id: 'settat', label: 'Settat' },
  { id: 'laayoune', label: 'Laâyoune' },
  { id: 'dakhla', label: 'Dakhla' },
  { id: 'other', label: 'Other' },
];

export function cityLabel(id: string): string {
  return CITIES.find((c) => c.id === id)?.label ?? id;
}
