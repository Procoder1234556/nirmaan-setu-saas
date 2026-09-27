// ponytail: Fast subword/token cosine matching with upgrade path to pgvector <=> operator or @xenova/transformers.
import type {
  SemanticCandidate,
  SemanticMatchOutput,
  MatchScoreResult,
  MatchStatus,
} from '../types';

export const AUTO_MATCH_THRESHOLD = 0.85;
export const REVIEW_QUEUE_THRESHOLD = 0.60;

/**
 * Builds standard contextual representation for an activity.
 */
export function formatActivityEmbeddingText(activity: {
  discipline: string;
  wbsPath: string;
  name: string;
}): string {
  return `Discipline: ${activity.discipline} | WBS: ${activity.wbsPath} | Task: ${activity.name}`;
}

/**
 * Native in-process Vectorizer producing normalized sparse/dense vectors
 * using subwords, character 3-grams, and domain token weights.
 */
export class LightweightVectorizer {
  private vocab = new Map<string, number>();
  private idf = new Map<string, number>();

  constructor(corpus: string[] = []) {
    if (corpus.length > 0) {
      this.train(corpus);
    }
  }

  public train(corpus: string[]) {
    const docCount = corpus.length;
    const docFreq = new Map<string, number>();

    for (const doc of corpus) {
      const { words } = this.tokenize(doc);
      for (const t of words) {
        docFreq.set(t, (docFreq.get(t) || 0) + 1);
      }
    }

    let index = 0;
    for (const [token, count] of docFreq.entries()) {
      this.vocab.set(token, index++);
      this.idf.set(token, Math.log((docCount + 1) / (count + 1)) + 1);
    }
  }

  public tokenize(text: string): { words: Set<string>; subwords: Set<string> } {
    const cleaned = text.toLowerCase();
    const rawTokens = cleaned.split(/[^a-z0-9]+/).filter(t => t.length > 0);
    const words = new Set<string>();
    const subwords = new Set<string>();

    for (const token of rawTokens) {
      words.add(token);

      if (token === 'pipeline' || token === 'piping') words.add('pipe');
      if (token.endsWith('ction')) words.add(token.replace(/ction$/, 'ct'));
      if (token.endsWith('ation')) words.add(token.replace(/ation$/, 'at'));
      if (token.endsWith('ing')) words.add(token.replace(/ing$/, ''));
      if (token.endsWith('ed')) words.add(token.replace(/ed$/, ''));
      if (token.endsWith('s')) words.add(token.replace(/s$/, ''));

      // Character 3-grams for typo tolerance
      if (token.length >= 3) {
        for (let i = 0; i <= token.length - 3; i++) {
          subwords.add(token.substring(i, i + 3));
        }
      }
    }
    return { words, subwords };
  }

  public embed(text: string): Map<string, number> {
    const { words, subwords } = this.tokenize(text);
    const vector = new Map<string, number>();

    for (const w of words) {
      let weight = this.idf.get(w) || 1.0;
      if (/line[-_\s]?\d+/i.test(w) || /\d+/.test(w)) weight *= 3.0; // Line numbers
      if (['spool', 'hydrotest', 'weld', 'trench', 'pipe', 'pipeline', 'valve', 'erect'].includes(w)) {
        weight *= 2.5;
      }
      vector.set(w, (vector.get(w) || 0) + weight);
    }

    for (const sw of subwords) {
      if (!vector.has(sw)) {
        vector.set(sw, 0.2); // Low weight for subwords
      }
    }

    // Compute L2 norm
    let norm = 0;
    for (const val of vector.values()) {
      norm += val * val;
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (const [k, v] of vector.entries()) {
        vector.set(k, v / norm);
      }
    }

    return vector;
  }
}

/**
 * Computes cosine similarity between two sparse vector representations.
 */
export function cosineSimilaritySparse(
  vecA: Map<string, number>,
  vecB: Map<string, number>
): number {
  if (vecA.size === 0 || vecB.size === 0) return 0.0;

  let dotProduct = 0.0;
  // Iterate smaller map
  const [smaller, larger] = vecA.size <= vecB.size ? [vecA, vecB] : [vecB, vecA];

  for (const [term, valA] of smaller.entries()) {
    const valB = larger.get(term);
    if (valB !== undefined) {
      dotProduct += valA * valB;
    }
  }

  return Math.min(1.0, Math.max(0.0, dotProduct));
}

/**
 * Computes cosine similarity between two dense numeric vector arrays (e.g. pgvector).
 */
export function cosineSimilarityDense(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0.0;
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const valA = a[i]!;
    const valB = b[i]!;
    dot += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0.0;
  return Math.min(1.0, Math.max(0.0, dot / denominator));
}

/**
 * Computes asymmetric target recall/coverage: what fraction of the target's terms
 * are captured by the incoming field event note.
 */
export function asymmetricCoverage(
  eventVec: Map<string, number>,
  targetVec: Map<string, number>
): number {
  if (targetVec.size === 0) return 0.0;
  let matchedWeight = 0;
  let totalTargetWeight = 0;

  for (const [term, weight] of targetVec.entries()) {
    totalTargetWeight += weight;
    if (eventVec.has(term)) {
      matchedWeight += weight;
    }
  }

  return totalTargetWeight > 0 ? Math.min(1.0, matchedWeight / totalTargetWeight) : 0.0;
}

/**
 * Performs Semantic Matching against candidate baseline activities
 * with Three-Tier Confidence Routing (Auto-Match, Reviewer Queue, Unmatched).
 */
export function matchFieldEventToActivities(
  rawEventText: string,
  candidates: SemanticCandidate[],
  vectorizer?: LightweightVectorizer
): SemanticMatchOutput {
  if (candidates.length === 0) {
    return {
      status: 'UNMATCHED',
      confidenceScore: 0,
      alternateCandidates: [],
      matchRationale: 'No candidate baseline activities available for project.',
    };
  }

  const v = vectorizer || new LightweightVectorizer(
    candidates.map(c => formatActivityEmbeddingText(c))
  );

  const eventVec = v.embed(rawEventText);
  const scoredList: MatchScoreResult[] = [];

  for (const candidate of candidates) {
    const taskVec = v.embed(candidate.name);
    const candText = formatActivityEmbeddingText(candidate);
    const candVec = v.embed(candText);

    const taskCosine = cosineSimilaritySparse(eventVec, taskVec);
    const contextCosine = cosineSimilaritySparse(eventVec, candVec);
    const taskCoverage = asymmetricCoverage(eventVec, taskVec);
    const contextCoverage = asymmetricCoverage(eventVec, candVec);
    const reverseCoverage = asymmetricCoverage(taskVec, eventVec);

    // ponytail: In field logging, supervisor notes contain status suffixes ("completed", "done")
    // or partial task mentions ("Line 24 pipeline pipe erection ongoing").
    // Blend cosine similarity with query & target coverage to achieve accurate confidence tier routing.
    const directScore = Math.max(
      taskCosine,
      contextCosine,
      contextCoverage,
      taskCoverage,
      reverseCoverage,
      taskCosine * 0.4 + taskCoverage * 0.6,
      contextCosine * 0.4 + contextCoverage * 0.6
    );

    scoredList.push({
      candidate,
      score: Math.round(directScore * 1000) / 1000,
    });
  }

  // Sort descending
  scoredList.sort((a, b) => b.score - a.score);

  const top = scoredList[0];
  const topScore = top ? top.score : 0;
  const alternates = scoredList.slice(1, 4);

  let status: MatchStatus = 'UNMATCHED';
  let matchRationale = '';

  if (topScore >= AUTO_MATCH_THRESHOLD) {
    status = 'AUTO_MATCHED';
    matchRationale = `High confidence match (${(topScore * 100).toFixed(1)}%) with activity ${top?.candidate.activityCode} based on discipline [${top?.candidate.discipline}] and task description alignment.`;
  } else if (topScore >= REVIEW_QUEUE_THRESHOLD) {
    status = 'PENDING_REVIEW';
    matchRationale = `Moderate semantic confidence (${(topScore * 100).toFixed(1)}%). Requires human verification between candidate ${top?.candidate.activityCode} and alternates.`;
  } else {
    status = 'UNMATCHED';
    matchRationale = `Top similarity score (${(topScore * 100).toFixed(1)}%) fell below review threshold (${(REVIEW_QUEUE_THRESHOLD * 100).toFixed(0)}%).`;
  }

  return {
    status,
    confidenceScore: topScore,
    topCandidate: top ? top.candidate : undefined,
    alternateCandidates: alternates,
    matchRationale,
  };
}

/**
 * Extracts estimated progress delta from field event note (e.g. "completed 100%", "50% done").
 */
export function extractProgressDelta(rawText: string): number {
  const pctMatch = rawText.match(/(\d{1,3})\s*%/);
  if (pctMatch && pctMatch[1]) {
    const val = parseInt(pctMatch[1], 10);
    if (!isNaN(val) && val >= 0 && val <= 100) return val;
  }

  const lower = rawText.toLowerCase();
  if (lower.includes('complete') || lower.includes('finished') || lower.includes('done') || lower.includes('erected')) {
    return 100;
  }
  if (lower.includes('halfway') || lower.includes('half done') || lower.includes('50 percent')) {
    return 50;
  }
  if (lower.includes('started') || lower.includes('commenced') || lower.includes('ongoing')) {
    return 20;
  }

  return 10;
}
