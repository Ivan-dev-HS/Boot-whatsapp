import { db } from "../db";
import { normalize } from "../matching/normalize";
import { RawOffer, StoreId } from "../scrapers/types";

export interface Offer {
  id: number;
  store: StoreId;
  product_name: string;
  normalized_name: string;
  price: number;
  unit: string | null;
  valid_until: string | null;
  url: string | null;
  scraped_at: string;
}

const deleteByStoreStmt = db.prepare(`DELETE FROM offers WHERE store = ?`);

const insertStmt = db.prepare(
  `INSERT INTO offers (store, product_name, normalized_name, price, unit, valid_until, url)
   VALUES (@store, @product_name, @normalized_name, @price, @unit, @valid_until, @url)`
);

const listAllStmt = db.prepare(`SELECT * FROM offers`);

const listByStoreStmt = db.prepare(`SELECT * FROM offers WHERE store = ?`);

/** Sustituye el catalogo de ofertas de una tienda por el resultado de un nuevo scrape. */
export function replaceOffers(store: StoreId, offers: RawOffer[]): number {
  const tx = db.transaction((items: RawOffer[]) => {
    deleteByStoreStmt.run(store);
    for (const offer of items) {
      insertStmt.run({
        store,
        product_name: offer.productName.trim(),
        normalized_name: normalize(offer.productName),
        price: offer.price,
        unit: offer.unit ?? null,
        valid_until: offer.validUntil ?? null,
        url: offer.url ?? null,
      });
    }
  });
  tx(offers);
  return offers.length;
}

export function listAllOffers(): Offer[] {
  return listAllStmt.all() as Offer[];
}

export function listOffersByStore(store: StoreId): Offer[] {
  return listByStoreStmt.all(store) as Offer[];
}
