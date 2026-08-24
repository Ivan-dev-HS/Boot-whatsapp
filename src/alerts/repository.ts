import { db } from "../db";
import { Offer } from "../offers/repository";

export function offerSignature(offer: Offer): string {
  return `${offer.store}|${offer.normalized_name}|${offer.price}`;
}

const existsStmt = db.prepare(
  `SELECT 1 FROM sent_alerts WHERE chat_id = ? AND product_id = ? AND offer_signature = ?`
);

const insertStmt = db.prepare(
  `INSERT OR IGNORE INTO sent_alerts (chat_id, product_id, store, offer_signature)
   VALUES (@chat_id, @product_id, @store, @offer_signature)`
);

export function wasAlertSent(chatId: string, productId: number, signature: string): boolean {
  return existsStmt.get(chatId, productId, signature) !== undefined;
}

export function markAlertSent(
  chatId: string,
  productId: number,
  store: string,
  signature: string
): void {
  insertStmt.run({ chat_id: chatId, product_id: productId, store, offer_signature: signature });
}
