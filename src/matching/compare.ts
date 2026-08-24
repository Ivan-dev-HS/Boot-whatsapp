import { config } from "../config";
import { listAllOffers, Offer } from "../offers/repository";
import { Product } from "../products/repository";
import { findMatches } from "./matcher";

export interface ProductComparison {
  product: Product;
  /** Ofertas que coinciden con el producto, ordenadas de mas barata a mas cara. */
  matches: Array<{ offer: Offer; score: number }>;
}

/** Compara la lista de productos de un chat contra todas las ofertas conocidas. */
export function compareProductsWithOffers(products: Product[]): ProductComparison[] {
  const offers = listAllOffers();

  return products.map((product) => {
    const scored = findMatches(
      product.name,
      offers.map((offer) => ({ id: offer.id, name: offer.product_name, ref: offer })),
      config.matchThreshold
    );

    // Nos quedamos con la mejor oferta encontrada por tienda (puede haber varias
    // coincidencias en el mismo supermercado) y ordenamos por precio ascendente.
    const bestPerStore = new Map<string, { offer: Offer; score: number }>();
    for (const match of scored) {
      const offer = match.candidate.ref;
      const current = bestPerStore.get(offer.store);
      if (!current || offer.price < current.offer.price) {
        bestPerStore.set(offer.store, { offer, score: match.score });
      }
    }

    const matches = [...bestPerStore.values()].sort((a, b) => a.offer.price - b.offer.price);
    return { product, matches };
  });
}
