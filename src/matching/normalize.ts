const COMBINING_DIACRITICS = /[̀-ͯ]/g;

/**
 * Normaliza un nombre de producto para poder compararlo:
 * minusculas, sin acentos, sin signos de puntuacion, espacios colapsados.
 */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
