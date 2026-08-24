import * as cheerio from "cheerio";
import { http, parsePrice } from "./http";
import { RawOffer, Scraper } from "./types";

// NOTA: Bonpreu i Esclat son la misma cadena (dos marcas del mismo grupo),
// con la misma tienda online. Selectores de mejor aproximacion, sin poder
// verificarlos contra el HTML real de bonpreuesclat.cat (bloqueada desde
// este entorno). Ajustalos tras inspeccionar la pagina real: es probable
// que el catalogo de ofertas requiera JavaScript, en cuyo caso habra que
// sustituir este scraper por uno basado en Playwright.
const OFFERS_URL = "https://www.bonpreuesclat.cat/ca/ofertes";
const CARD_SELECTOR = ".product-item, .card-producte, article.product";
const NAME_SELECTOR = ".product-item__title, .card-producte__nom, h2, h3";
const PRICE_SELECTOR = ".product-item__price, .card-producte__preu, .price";

export const bonpreuEsclatScraper: Scraper = {
  store: "bonpreuesclat",
  async fetchOffers(): Promise<RawOffer[]> {
    const { data } = await http.get<string>(OFFERS_URL);
    const $ = cheerio.load(data);
    const offers: RawOffer[] = [];

    $(CARD_SELECTOR).each((_, el) => {
      const card = $(el);
      const name = card.find(NAME_SELECTOR).first().text().trim();
      const priceText = card.find(PRICE_SELECTOR).first().text().trim();
      const price = parsePrice(priceText);
      if (name && price !== null) {
        offers.push({ productName: name, price, url: OFFERS_URL });
      }
    });

    return offers;
  },
};
