import { expandSearchTerms, normalizeSearchTerm } from './searchSynonyms';

/** Fast Levenshtein distance algorithm for typo tolerance */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      let val: number;
      if (a[i - 1] === b[j - 1]) {
        val = row[j - 1];
      } else {
        val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }

  return row[b.length];
}

/** Check if two words are fuzzy match (handles 1-2 character typos for words >= 4 chars) */
export function isFuzzyMatch(wordA: string, wordB: string): boolean {
  const a = wordA.toLowerCase();
  const b = wordB.toLowerCase();
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const minLen = Math.min(a.length, b.length);
  const maxLen = Math.max(a.length, b.length);

  if (maxLen - minLen > 2) return false;
  if (minLen <= 3) return false; // short words require exact match

  const dist = levenshteinDistance(a, b);
  const maxAllowedDist = minLen >= 6 ? 2 : 1;
  return dist <= maxAllowedDist;
}

export type ScoredProduct = {
  product: Record<string, any>;
  score: number;
};

/** Compute an intelligent relevance score for a product against a search query */
export function calculateRelevanceScore(
  product: Record<string, any>,
  query: string,
): number {
  const normQuery = normalizeSearchTerm(query);
  if (!normQuery) return 100;

  const { tokens, expandedKeywords, matchedCategories } = expandSearchTerms(query);

  const name = normalizeSearchTerm(product.name || '');
  const brand = normalizeSearchTerm(product.brand || '');
  const company = normalizeSearchTerm(product.company || '');
  const primCat = normalizeSearchTerm(product.primary_category || '');
  const secCat = normalizeSearchTerm(product.secondary_category || '');
  const desc = normalizeSearchTerm(`${product.description || ''} ${product.short_description || ''}`);
  const keywords = normalizeSearchTerm(product.search_keywords || '');

  const nameTokens = name.split(/\s+/).filter(Boolean);
  const brandTokens = brand.split(/\s+/).filter(Boolean);

  let score = 0;

  // 1. Exact Full Match in Title
  if (name === normQuery) {
    score += 150;
  } else if (name.startsWith(normQuery)) {
    score += 120;
  } else if (name.includes(normQuery)) {
    score += 100;
  }

  // 2. Token Matches in Title & Brand
  for (const token of tokens) {
    if (token.length < 2) continue;

    // Exact word in title
    if (nameTokens.includes(token)) {
      score += 50;
    } else if (nameTokens.some((nt) => nt.startsWith(token) || nt.includes(token))) {
      score += 35;
    } else if (nameTokens.some((nt) => isFuzzyMatch(token, nt))) {
      score += 28;
    }

    // Exact word in brand
    if (brandTokens.includes(token) || brand === token) {
      score += 60;
    } else if (brand.includes(token) || brandTokens.some((bt) => isFuzzyMatch(token, bt))) {
      score += 30;
    }
  }

  // 3. Synonym & Transliteration Matches (e.g. "gehu" -> matches "wheat", "atta", "chakki")
  for (const expKw of expandedKeywords) {
    if (expKw.length < 2) continue;

    if (nameTokens.includes(expKw) || name.includes(expKw)) {
      score += 45;
    } else if (nameTokens.some((nt) => isFuzzyMatch(expKw, nt))) {
      score += 30;
    }

    if (brand.includes(expKw)) {
      score += 35;
    }
  }

  // 4. Category and Subcategory Alignment
  if (matchedCategories.size > 0) {
    for (const cat of matchedCategories) {
      if (primCat.includes(cat) || cat.includes(primCat)) {
        score += 50;
      }
      if (secCat && (secCat.includes(cat) || cat.includes(secCat))) {
        score += 40;
      }
    }
  }

  // Query token directly matches category name
  for (const token of tokens) {
    if (token.length >= 3) {
      if (primCat.includes(token)) score += 35;
      if (secCat.includes(token)) score += 30;
    }
  }

  // 5. Description & Search Keywords Matches
  for (const token of tokens) {
    if (keywords.includes(token)) score += 30;
    if (desc.includes(token)) score += 15;
  }

  // Also check expanded keywords in description / keywords
  for (const expKw of expandedKeywords) {
    if (expKw.length >= 3 && keywords.includes(expKw)) {
      score += 25;
    }
  }

  return score;
}

/** Filter and rank products using the Intelligent Search Engine */
export function filterAndRankProducts(
  products: Record<string, any>[],
  query?: string,
  minScoreThreshold = 25,
): Record<string, any>[] {
  const cleanQuery = normalizeSearchTerm(query);
  if (!cleanQuery) {
    return products;
  }

  const scored: ScoredProduct[] = [];

  for (const product of products) {
    const score = calculateRelevanceScore(product, cleanQuery);
    if (score >= minScoreThreshold) {
      scored.push({ product, score });
    }
  }

  // Sort by highest score first, then by discount/price
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const da = a.product.discount_percent || 0;
    const db = b.product.discount_percent || 0;
    return db - da;
  });

  return scored.map((s) => s.product);
}
