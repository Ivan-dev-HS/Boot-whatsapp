import { config } from "../config";
import { replaceOffers } from "../offers/repository";
import { aldiScraper } from "./aldi";
import { esclatScraper } from "./esclat";
import { lidlScraper } from "./lidl";
import { createMockScraper } from "./mock";
import { plusfrescScraper } from "./plusfresc";
import { Scraper, StoreId } from "./types";

const REAL_SCRAPERS: Scraper[] = [lidlScraper, aldiScraper, plusfrescScraper, esclatScraper];
const MOCK_SCRAPERS: Scraper[] = (["lidl", "aldi", "plusfresc", "esclat"] as StoreId[]).map(
  createMockScraper
);

function activeScrapers(): Scraper[] {
  return config.useMockScrapers ? MOCK_SCRAPERS : REAL_SCRAPERS;
}

export interface ScrapeResult {
  store: StoreId;
  offersFound: number;
  error?: string;
}

/** Ejecuta todos los scrapers y guarda sus resultados en la base de datos. */
export async function scrapeAllStores(): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  for (const scraper of activeScrapers()) {
    try {
      const offers = await scraper.fetchOffers();
      const saved = replaceOffers(scraper.store, offers);
      results.push({ store: scraper.store, offersFound: saved });
    } catch (error) {
      results.push({
        store: scraper.store,
        offersFound: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}
