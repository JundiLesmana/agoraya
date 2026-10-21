export interface DuplicateCandidate {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly description: string;
  readonly location: Readonly<Record<string, unknown>> | null;
}
export interface DuplicateMatch {
  readonly reportId: string;
  readonly score: number;
}

function tokens(value: string): Set<string> {
  return new Set(
    value.toLocaleLowerCase("id-ID").match(/[\p{L}\p{N}]+/gu) ?? [],
  );
}

/** Conservative Jaccard similarity; category must match to prevent broad false positives. */
export function similarity(left: string, right: string): number {
  const a = tokens(left);
  const b = tokens(right);
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / union.size;
}

export function findDuplicate(
  input: Omit<DuplicateCandidate, "id">,
  candidates: readonly DuplicateCandidate[],
  threshold = 0.7,
): DuplicateMatch | null {
  let best: DuplicateMatch | null = null;
  for (const candidate of candidates) {
    if (candidate.category !== input.category) continue;
    const score = similarity(
      `${input.title} ${input.description}`,
      `${candidate.title} ${candidate.description}`,
    );
    if (score >= threshold && (!best || score > best.score))
      best = { reportId: candidate.id, score };
  }
  return best;
}
