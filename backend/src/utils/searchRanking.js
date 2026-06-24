import { CATEGORY_LABELS } from '../constants/categories.js';

function norm(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ');
}

export function normalizeSearchQuery(raw) {
  return String(raw ?? '')
    .trim()
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 100);
}

export function tokenizeQuery(q) {
  const normalized = norm(q);
  if (!normalized) return [];
  return normalized.split(' ').filter((t) => t.length >= 1);
}

export function buildBooleanModeQuery(tokens) {
  if (!tokens.length) return '';
  return tokens.map((t) => `+${t}*`).join(' ');
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[b.length];
}

function categoryMatchBonus(queryNorm, category) {
  const catNorm = norm(category);
  if (!catNorm) return 0;
  if (catNorm.includes(queryNorm) || queryNorm.includes(catNorm)) return 8;
  for (const label of CATEGORY_LABELS) {
    const labelNorm = norm(label);
    if (labelNorm.includes(queryNorm) || queryNorm.includes(labelNorm)) {
      if (catNorm === labelNorm) return 12;
      return 4;
    }
  }
  return 0;
}

export function rankSearchHits(items, query, limit = 10) {
  const qNorm = norm(query);
  const tokens = tokenizeQuery(query);

  const scored = items.map((item) => {
    const titleNorm = norm(item.title);
    const catNorm = norm(item.category);
    let score = Number(item.ftScore) || 0;

    if (titleNorm.startsWith(qNorm)) score += 20;
    else if (titleNorm.includes(qNorm)) score += 10;

    if (catNorm.includes(qNorm) || qNorm.includes(catNorm)) score += 6;
    score += categoryMatchBonus(qNorm, item.category);

    for (const token of tokens) {
      if (token.length < 4) continue;
      const titleTokens = titleNorm.split(' ');
      for (const tt of titleTokens) {
        if (tt.length < 4) continue;
        if (levenshtein(token, tt) <= 2) {
          score += 5;
          break;
        }
      }
    }

    return { item, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aTs = a.item.createdAt ? new Date(a.item.createdAt).getTime() : 0;
    const bTs = b.item.createdAt ? new Date(b.item.createdAt).getTime() : 0;
    return bTs - aTs;
  });

  return scored.slice(0, limit).map((s) => s.item);
}
