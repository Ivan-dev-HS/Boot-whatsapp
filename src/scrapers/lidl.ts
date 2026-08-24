import * as cheerio from "cheerio";
import { http, parsePrice } from "./http";
import { RawOffer, Scraper } from "./types";

// NOTA: Lidl renderiza el catalogo de ofertas con JavaScript (React) y no expone
// una API publica estable. Estos selectores son la mejor aproximacion posible sin
// poder inspeccionar la pagina en vivo desde este entorno: revisalos con las
// herramientas de desarrollador del navegador (F12 -> Elements) sobre
// https://www.lidl.es/es/ofertas y ajusta las constantes de abajo si no
// devuelven resultados. Si la pagina requiere JS, sustituye este scraper por
// uno basado en Playwright (ya disponible como dependencia del sistema).
const OFFERS_URL = "https://www.lidl.es/es/ofertas";
const CARD_SELECTOR = "[data-testid='product-grid-box'], .product-grid-box, .ret-o-card";
const NAME_SELECTOR = ".ret-o-card__title, [data-testid='product-title'], h3";
const PRICE_SELECTOR = ".ret-o-card__price, [data-testid='product-price'], .price";

export const lidlScraper: Scraper = {
  store: "lidl",
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
