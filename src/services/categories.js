// Mirrors VideoUploadApp/src/config/marketplace.ts (CATEGORIES + CITIES).
// Keep in sync if the mobile taxonomy changes — same English `label` is
// what gets stored in `listings.category`.

export const CATEGORIES = [
  { id: 'vehicles', label: 'Vehicles', icon: 'car', tone: 'bg-sky-50 text-sky-600' },
  { id: 'real-estate', label: 'Real Estate', icon: 'home', tone: 'bg-emerald-50 text-emerald-600' },
  { id: 'electronics', label: 'Electronics', icon: 'cpu', tone: 'bg-violet-50 text-violet-600' },
  { id: 'fashion', label: 'Fashion', icon: 'tshirt', tone: 'bg-pink-50 text-pink-600' },
  { id: 'home', label: 'Home', icon: 'sofa', tone: 'bg-amber-50 text-amber-600' },
  { id: 'kids-baby', label: 'Kids & Baby', icon: 'baby', tone: 'bg-sky-100 text-sky-600' },
  { id: 'jobs', label: 'Jobs', icon: 'briefcase', tone: 'bg-violet-50 text-violet-600' },
  { id: 'services', label: 'Services', icon: 'wrench', tone: 'bg-teal-50 text-teal-600' },
  { id: 'rugs', label: 'Rugs', icon: 'rug', tone: 'bg-rose-50 text-rose-600' },
  { id: 'other', label: 'Others', icon: 'grid', tone: 'bg-slate-100 text-slate-600' },
];

export const CITIES = [
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

const CITY_LABEL_BY_ID = Object.fromEntries(CITIES.map((c) => [c.id, c.label]));

export function cityLabel(id) {
  if (!id) return '';
  return CITY_LABEL_BY_ID[id] || id;
}

export function categoryLabel(stored) {
  if (!stored) return '';
  const byId = CATEGORIES.find((c) => c.id === stored);
  if (byId) return byId.label;
  const byLabel = CATEGORIES.find((c) => c.label === stored);
  if (byLabel) return byLabel.label;
  return stored;
}

/** Value to put into a `where('category', '==', …)` query — English label. */
export function categoryFirestoreValue(id) {
  const row = CATEGORIES.find((c) => c.id === id);
  return row ? row.label : id;
}
