/**
 * Relative time labels for marketplace listings (English).
 */
export function formatRelativeTimeEn(ms: number | null | undefined): string {
  if (ms == null) return '';
  const sec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (sec < 45) return 'Just now';
  if (sec < 3600) {
    const m = Math.floor(sec / 60);
    return m <= 1 ? '1 min ago' : `${m} min ago`;
  }
  if (sec < 86400) {
    const h = Math.floor(sec / 3600);
    return h <= 1 ? '1 h ago' : `${h} h ago`;
  }
  if (sec < 86400 * 7) {
    const d = Math.floor(sec / 86400);
    return d <= 1 ? '1 day ago' : `${d} days ago`;
  }
  const w = Math.floor(sec / (86400 * 7));
  return w <= 1 ? '1 week ago' : `${w} weeks ago`;
}
