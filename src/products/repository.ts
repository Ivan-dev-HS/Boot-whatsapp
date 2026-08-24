import { db } from "../db";
import { normalize } from "../matching/normalize";

export interface Product {
  id: number;
  chat_id: string;
  name: string;
  normalized_name: string;
  created_at: string;
}

const insertStmt = db.prepare(
  `INSERT INTO products (chat_id, name, normalized_name) VALUES (@chat_id, @name, @normalized_name)
   ON CONFLICT (chat_id, normalized_name) DO NOTHING`
);

const listStmt = db.prepare(
  `SELECT * FROM products WHERE chat_id = ? ORDER BY created_at ASC`
);

const deleteByNormalizedNameStmt = db.prepare(
  `DELETE FROM products WHERE chat_id = ? AND normalized_name = ?`
);

const deleteByIdStmt = db.prepare(`DELETE FROM products WHERE chat_id = ? AND id = ?`);

const clearStmt = db.prepare(`DELETE FROM products WHERE chat_id = ?`);

const distinctChatIdsStmt = db.prepare(`SELECT DISTINCT chat_id FROM products`);

export function addProduct(chatId: string, name: string): { added: boolean } {
  const normalized_name = normalize(name);
  const result = insertStmt.run({ chat_id: chatId, name: name.trim(), normalized_name });
  return { added: result.changes > 0 };
}

export function listProducts(chatId: string): Product[] {
  return listStmt.all(chatId) as Product[];
}

export function removeProduct(chatId: string, name: string): { removed: boolean } {
  const result = deleteByNormalizedNameStmt.run(chatId, normalize(name));
  return { removed: result.changes > 0 };
}

export function removeProductById(chatId: string, id: number): { removed: boolean } {
  const result = deleteByIdStmt.run(chatId, id);
  return { removed: result.changes > 0 };
}

export function clearProducts(chatId: string): number {
  return clearStmt.run(chatId).changes;
}

/** Chats que tienen al menos un producto en su lista (para recorrer en el scheduler). */
export function listChatsWithProducts(): string[] {
  const rows = distinctChatIdsStmt.all() as { chat_id: string }[];
  return rows.map((r) => r.chat_id);
}
