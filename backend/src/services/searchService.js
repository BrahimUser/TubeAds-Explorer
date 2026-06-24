import { listingRepository } from '../repositories/listingRepository.js';
import { mapListingSearchHit } from '../utils/mappers.js';
import {
  buildBooleanModeQuery,
  normalizeSearchQuery,
  rankSearchHits,
  tokenizeQuery,
} from '../utils/searchRanking.js';

const INTERNAL_CANDIDATE_LIMIT = 25;

export const searchService = {
  async search(query = {}) {
    const q = normalizeSearchQuery(query.q);
    const limit = Math.min(10, Math.max(1, Number(query.limit) || 10));
    const tokens = tokenizeQuery(q);

    if (tokens.length === 0) {
      return { items: [], query: q };
    }

    const booleanQuery = buildBooleanModeQuery(tokens);
    let candidates = await listingRepository.searchFulltext({
      booleanQuery,
      limit: INTERNAL_CANDIDATE_LIMIT,
    });

    if (candidates.length < 3) {
      const prefix = tokens[0];
      const fallback = await listingRepository.searchPrefix({
        prefix,
        excludeIds: candidates.map((c) => c.id),
        limit: INTERNAL_CANDIDATE_LIMIT - candidates.length,
      });
      candidates = [...candidates, ...fallback];
    }

    const ranked = rankSearchHits(candidates, q, limit);
    return {
      items: ranked.map(mapListingSearchHit),
      query: q,
    };
  },
};
