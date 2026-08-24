import { RawOffer, Scraper, StoreId } from "./types";

// Catalogo de ofertas simulado para poder probar todo el flujo (comandos,
// matching, alertas) sin depender de las webs reales de los supermercados.
// Se activa con USE_MOCK_SCRAPERS=true en el .env.
const MOCK_CATALOG: Record<StoreId, RawOffer[]> = {
  lidl: [
    { productName: "Leche entera Pilgrim 1L", price: 0.89, unit: "1L" },
    { productName: "Papel higiénico Cien 24 rollos", price: 6.99, unit: "24u" },
    { productName: "Aceite de oliva virgen extra 1L", price: 4.49, unit: "1L" },
    { productName: "Pechuga de pollo 1kg", price: 5.5, unit: "1kg" },
  ],
  aldi: [
    { productName: "Leche entera Milsani 1L", price: 0.95, unit: "1L" },
    { productName: "Papel higiénico Camilla 24 rollos", price: 7.5, unit: "24u" },
    { productName: "Aceite de oliva virgen extra Casa Batlle 1L", price: 4.2, unit: "1L" },
    { productName: "Detergente Almat 40 lavados", price: 5.99, unit: "40 lav." },
  ],
  plusfresc: [
    { productName: "Llet sencera Plus Fresc 1L", price: 0.82, unit: "1L" },
    { productName: "Paper higienic 24 rotlles", price: 6.5, unit: "24u" },
    { productName: "Pit de pollastre 1kg", price: 5.2, unit: "1kg" },
  ],
  esclat: [
    { productName: "Llet sencera Esclat 1L", price: 0.85, unit: "1L" },
    { productName: "Oli d'oliva verge extra 1L", price: 4.75, unit: "1L" },
    { productName: "Detergent 40 rentats", price: 6.1, unit: "40 rent." },
  ],
};

export function createMockScraper(store: StoreId): Scraper {
  return {
    store,
    async fetchOffers(): Promise<RawOffer[]> {
      return MOCK_CATALOG[store];
    },
  };
}
