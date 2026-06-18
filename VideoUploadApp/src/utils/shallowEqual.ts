import type { Ad } from '../types/Ad';

/** Returns true when two ad arrays represent the same listing data. */
export function adsArraysEqual(a: Ad[], b: Ad[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const left = a[i];
    const right = b[i];
    if (
      left.id !== right.id ||
      left.title !== right.title ||
      left.priceCents !== right.priceCents ||
      left.status !== right.status ||
      left.thumbnailUrl !== right.thumbnailUrl ||
      left.youtubeVideoId !== right.youtubeVideoId ||
      left.createdAt !== right.createdAt
    ) {
      return false;
    }
  }
  return true;
}

/** Returns true when two string sets contain the same ids. */
export function stringSetsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a === b) return true;
  if (a.size !== b.size) return false;
  for (const id of a) {
    if (!b.has(id)) return false;
  }
  return true;
}
