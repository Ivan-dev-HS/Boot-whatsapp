import { normalize } from "./normalize";

function bigrams(text: string): string[] {
  const clean = text.replace(/\s+/g, "");
  const result: string[] = [];
  for (let i = 0; i < clean.length - 1; i++) {
    result.push(clean.slice(i, i + 2));
  }
  return result;
}

/** Coeficiente de similitud de Sorensen-Dice sobre bigramas (0 a 1). */
function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  const bigramsA = bigrams(a);
  const bigramsB = bigrams(b);
  if (bigramsA.length === 0 || bigramsB.length === 0) return 0;

  const counts = new Map<string, number>();
  for (const bg of bigramsA) counts.set(bg, (counts.get(bg) ?? 0) + 1);

  let intersection = 0;
  for (const bg of bigramsB) {
    const count = counts.get(bg) ?? 0;
    if (count > 0) {
      intersection++;
      counts.set(bg, count - 1);
    }
  }
  return (2 * intersection) / (bigramsA.length + bigramsB.length);
}

/**
 * Similitud entre un producto de la lista y el nombre de una oferta.
 * Combina Dice sobre bigramas con un bonus si todas las palabras del texto
 * mas corto aparecen como sub-palabra en el mas largo (p.ej. "leche" dentro
 * de "leche entera pascal 1l").
 */
export function similarity(productName: string, offerName: string): number {
  const a = normalize(productName);
  const b = normalize(offerName);
  if (!a || !b) return 0;

  const dice = diceCoefficient(a, b);

  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  const words = shorter.split(" ").filter(Boolean);
  const allWordsContained =
    words.length > 0 && words.every((word) => longer.includes(word));

  return allWordsContained ? Math.max(dice, 0.85) : dice;
}

export interface MatchCandidate {
  id: number;
  name: string;
}

export interface Match<T extends MatchCandidate> {
  candidate: T;
  score: number;
}

/** Devuelve las mejores coincidencias (score >= threshold), ordenadas de mayor a menor score. */
export function findMatches<T extends MatchCandidate>(
  productName: string,
  candidates: T[],
  threshold: number
): Match<T>[] {
  return candidates
    .map((candidate) => ({ candidate, score: similarity(productName, candidate.name) }))
    .filter((match) => match.score >= threshold)
    .sort((a, b) => b.score - a.score);
}
