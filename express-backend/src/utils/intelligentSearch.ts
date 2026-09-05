import { expandSearchTerms, normalizeSearchTerm } from './searchSynonyms';

/** Standard Levenshtein Distance for Typo Tolerance */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/** Check if query word fuzzy matches target word within acceptable distance */
export function isFuzzyMatch(queryWord: string, targetWord: string): boolean {
  if (!queryWord || !targetWord) return false;
  if (targetWord.includes(queryWord) || queryWord.includes(targetWord)) return true;

  const qLen = queryWord.length;
  const tLen = targetWord.length;

  // Short words (< 4 chars) require exact substring match
  if (qLen < 4 || tLen < 4) {
    return targetWord.startsWith(queryWord) || queryWord.startsWith(targetWord);
  }

  // Max allowed typo distance depends on length
  const maxDistance = qLen > 6 ? 2 : 1;
  return levenshteinDistance(queryWord, targetWord) <= maxDistance;
}

export type ScoredProduct = {
  product: Record<string, any>;
  score: number;
};

/**
 * Intelligent Search Engine for Grocery:
 * Computes relevance score based on:
 * 1. Exact / prefix match on Product Name (Score +100)
 * 2. Hindi / Hinglish Synonym matches (Score +60)
 * 3. Brand name match (Score +50)
 * 4. Primary & Secondary Category match (Score +40)
 * 5. Typo tolerance fuzzy match on words (Score +30)
 * 6. Search keywords & description match (Score +20)
 */
export function searchProductsWithIntelligence<T extends Record<string, any>>(
  products: T[],
  query: string,
  categoryFilter?: string,
  secondaryFilter?: string
): T[] {
  if (!products || products.length === 0) return [];
  const rawNormalized = normalizeSearchTerm(query);
  if (!rawNormalized) {
    // If no query, apply optional category filters directly
    return products.filter((p) => {
      if (categoryFilter && p.primary_category !== categoryFilter) return false;
      if (secondaryFilter && p.secondary_category !== secondaryFilter) return false;
      return true;
    });
  }

  const { tokens, expandedKeywords, matchedCategories } = expandSearchTerms(rawNormalized);

  const scored: ScoredProduct[] = [];

  for (const product of products) {
    // Check category filter if supplied
    if (categoryFilter && product.primary_category !== categoryFilter) {
      continue;
    }
    if (secondaryFilter && product.secondary_category !== secondaryFilter) {
      continue;
    }

    const name = normalizeSearchTerm(product.name);
    const brand = normalizeSearchTerm(product.brand);
    const company = normalizeSearchTerm(product.company);
    const primaryCategory = normalizeSearchTerm(product.primary_category);
    const secondaryCategory = normalizeSearchTerm(product.secondary_category);
    const searchKeywords = normalizeSearchTerm(product.search_keywords);
    const description = normalizeSearchTerm(product.description || product.short_description);

    const productWords = [
      ...name.split(/\s+/),
      ...brand.split(/\s+/),
      ...primaryCategory.split(/\s+/),
      ...secondaryCategory.split(/\s+/),
    ].filter((w) => w.length > 0);

    let score = 0;

    // 1. Exact Name match or prefix
    if (name === rawNormalized) {
      score += 200;
    } else if (name.startsWith(rawNormalized)) {
      score += 150;
    } else if (name.includes(rawNormalized)) {
      score += 100;
    }

    // 2. Brand match
    if (brand && (brand === rawNormalized || rawNormalized.includes(brand) || brand.includes(rawNormalized))) {
      score += 60;
    }

    // 3. Category match from query or expanded synonyms
    if (primaryCategory && (primaryCategory.includes(rawNormalized) || matchedCategories.has(primaryCategory))) {
      score += 50;
    }
    if (secondaryCategory && (secondaryCategory.includes(rawNormalized) || matchedCategories.has(secondaryCategory))) {
      score += 40;
    }

    // 4. Check expanded synonyms against product title & search keywords
    for (const kw of expandedKeywords) {
      if (kw.length >= 3) {
        if (name.includes(kw)) score += 35;
        if (brand.includes(kw)) score += 25;
        if (searchKeywords.includes(kw)) score += 20;
        if (primaryCategory.includes(kw)) score += 15;
      }
    }

    // 5. Check token-level fuzzy match & presence
    let tokenMatches = 0;
    for (const token of tokens) {
      if (token.length < 2) continue;

      let matchedThisToken = false;
      if (name.includes(token) || brand.includes(token) || searchKeywords.includes(token)) {
        matchedThisToken = true;
        score += 30;
      } else {
        // Try fuzzy typo match across product words
        for (const pw of productWords) {
          if (isFuzzyMatch(token, pw)) {
            matchedThisToken = true;
            score += 20;
            break;
          }
        }
      }

      if (matchedThisToken) tokenMatches++;
    }

    // 6. Bonus if all tokens from query matched
    if (tokens.length > 1 && tokenMatches === tokens.length) {
      score += 50;
    }

    // 7. Search keywords / description fallback
    if (searchKeywords.includes(rawNormalized)) score += 25;
    if (description.includes(rawNormalized)) score += 15;

    // Only include products that have meaningful match
    if (score > 0) {
      scored.push({ product, score });
    }
  }

  // Sort by score descending (highest relevance first)
  scored.sort((a, b) => b.score - a.score);

  return scored.map((item) => item.product as T);
}
