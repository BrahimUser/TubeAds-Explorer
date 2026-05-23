/**
 * Deterministic seller rating derived from the uid.
 *
 * The marketplace has no reviews collection yet, so we synthesize a
 * stable rating + review count per seller. The function is pure: same uid
 * always produces the same numbers, which keeps cards from "shuffling"
 * between renders.
 */
export function hashUid(uid) {
  const s = String(uid || 'x');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function ratingMeta(uid) {
  const h = hashUid(uid);
  const rating = Number((4.2 + (h % 8) / 10).toFixed(1));
  const reviews = 8 + (h % 52);
  return { rating, reviews };
}
