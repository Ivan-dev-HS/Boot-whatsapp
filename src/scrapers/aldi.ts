import * as cheerio from "cheerio";
import { http, parsePrice } from "./http";
import { RawOffer, Scraper } from "./types";

// NOTA: igual que en el resto de scrapers, estos selectores son una mejor
// aproximacion sin poder inspeccionar https://www.aldi.es/ofertas.html en
// vivo desde este entorno (la red de este sandbox bloquea el dominio).
// Abre la pagina en el navegador, localiza las tarjetas de producto en
// oferta con el inspector y ajusta las constantes de abajo.
const OFFERS_URL = "https://www.aldi.es/ofertas.html";
const CARD_SELECTOR = ".product-tile, .m-offer-tile, [data-component='product-tile']";
const NAME_SELECTOR = ".product-tile__name, .m-offer-tile__title, h3";
const PRICE_SELECTOR = ".product-tile__price, .m-offer-tile__price, .price";

export const aldiScraper: Scraper = {
  store: "aldi",
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
