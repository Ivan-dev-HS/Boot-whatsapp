import axios from "axios";

export const http = axios.create({
  timeout: 15000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "es-ES,es;q=0.9,ca;q=0.8",
  },
});

/**
 * Extrae un precio en euros de un texto tipo "1,99 €" o "2,50 EUR".
 * Asume formato español (coma decimal). Devuelve null si no encuentra un numero valido.
 */
export function parsePrice(text: string): number | null {
  const match = text.replace(/\s+/g, " ").match(/(\d+[.,]\d{1,2}|\d+)\s*(?:€|eur)?/i);
  if (!match) return null;
  const normalized = match[1].replace(".", "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
