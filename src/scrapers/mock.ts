import { RawOffer, Scraper, StoreId } from "./types";

// Catalogo de ofertas simulado para poder probar todo el flujo (lista,
// matching, comparativa) sin depender de las webs reales de los
// supermercados. Se activa con USE_MOCK_SCRAPERS=true en el .env, y es el
// mismo catalogo que usa el frontend cuando no hay servidor (GitHub Pages).
export const MOCK_CATALOG: Record<StoreId, RawOffer[]> = {
  lidl: [
    { productName: "Leche entera Pilgrim 1L", price: 0.89, unit: "1L" },
    { productName: "Papel higiénico Cien 24 rollos", price: 6.99, unit: "24u" },
    { productName: "Aceite de oliva virgen extra 1L", price: 4.49, unit: "1L" },
    { productName: "Pechuga de pollo 1kg", price: 5.5, unit: "1kg" },
    { productName: "Huevos camperos docena", price: 2.29, unit: "12u" },
    { productName: "Pan de molde integral", price: 1.19, unit: "460g" },
  ],
  plusfresc: [
    { productName: "Llet sencera Plus Fresc 1L", price: 0.82, unit: "1L" },
    { productName: "Paper higienic 24 rotlles", price: 6.5, unit: "24u" },
    { productName: "Pit de pollastre 1kg", price: 5.2, unit: "1kg" },
    { productName: "Ous camperos dotzena", price: 2.15, unit: "12u" },
    { productName: "Detergent 40 rentats", price: 5.99, unit: "40 rent." },
  ],
  bonpreuesclat: [
    { productName: "Llet sencera Bonpreu 1L", price: 0.85, unit: "1L" },
    { productName: "Oli d'oliva verge extra 1L", price: 4.75, unit: "1L" },
    { productName: "Paper higienic 24 rotlles", price: 6.79, unit: "24u" },
    { productName: "Pa de motlle integral", price: 1.25, unit: "460g" },
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
