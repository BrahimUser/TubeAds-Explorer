/**
 * Relative time strings for marketplace cards (French), matching common
 * classified apps ("Il y a 1h").
 */
export function formatRelativeTimeFr(ms: number | null | undefined): string {
  if (ms == null) return '';
  const sec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (sec < 45) return "À l'instant";
  if (sec < 3600) {
    const m = Math.floor(sec / 60);
    return m <= 1 ? 'Il y a 1 min' : `Il y a ${m} min`;
  }
  if (sec < 86400) {
    const h = Math.floor(sec / 3600);
    return h <= 1 ? 'Il y a 1 h' : `Il y a ${h} h`;
  }
  if (sec < 86400 * 7) {
    const d = Math.floor(sec / 86400);
    return d <= 1 ? 'Il y a 1 jour' : `Il y a ${d} jours`;
  }
  const w = Math.floor(sec / (86400 * 7));
  return w <= 1 ? 'Il y a 1 semaine' : `Il y a ${w} semaines`;
}
