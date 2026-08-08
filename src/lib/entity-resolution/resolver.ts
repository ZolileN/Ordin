import { normalizeName } from "@/lib/utils";

export interface EntityCandidate {
  id: string;
  externalId?: string | null;
  normalizedName: string;
  rawName: string;
}

export interface EntityMatchResult {
  entityId: string;
  confidence: number;
  method: "external_id" | "normalized_reference" | "normalized_name" | "fuzzy";
}

export interface EntityResolverOptions {
  fuzzyThreshold?: number;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b.charAt(i - 1) === a.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function fuzzyScore(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const distance = levenshtein(a, b);
  return 1 - distance / maxLen;
}

export function resolveEntity(
  query: { externalId?: string; reference?: string; name?: string },
  candidates: EntityCandidate[],
  options: EntityResolverOptions = {}
): EntityMatchResult | null {
  const threshold = options.fuzzyThreshold ?? 0.85;

  if (query.externalId) {
    const match = candidates.find((c) => c.externalId === query.externalId);
    if (match) {
      return { entityId: match.id, confidence: 1, method: "external_id" };
    }
  }

  if (query.reference) {
    const normalizedRef = normalizeName(query.reference);
    const match = candidates.find((c) => c.normalizedName === normalizedRef);
    if (match) {
      return { entityId: match.id, confidence: 1, method: "normalized_reference" };
    }
  }

  if (query.name) {
    const normalizedQuery = normalizeName(query.name);
    const exactMatch = candidates.find((c) => c.normalizedName === normalizedQuery);
    if (exactMatch) {
      return { entityId: exactMatch.id, confidence: 1, method: "normalized_name" };
    }

    let bestMatch: EntityCandidate | null = null;
    let bestScore = 0;
    for (const candidate of candidates) {
      const score = fuzzyScore(normalizedQuery, candidate.normalizedName);
      if (score > bestScore && score >= threshold) {
        bestScore = score;
        bestMatch = candidate;
      }
    }
    if (bestMatch) {
      return { entityId: bestMatch.id, confidence: bestScore, method: "fuzzy" };
    }
  }

  return null;
}

export function createEntityCandidate(
  id: string,
  rawName: string,
  externalId?: string
): EntityCandidate {
  return {
    id,
    externalId,
    rawName,
    normalizedName: normalizeName(rawName),
  };
}
