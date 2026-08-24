import { db } from "../db";
import { normalize } from "../matching/normalize";

export interface Product {
  id: number;
  list_id: string;
  name: string;
  normalized_name: string;
  created_at: string;
}

const insertStmt = db.prepare(
  `INSERT INTO products (list_id, name, normalized_name) VALUES (@list_id, @name, @normalized_name)
   ON CONFLICT (list_id, normalized_name) DO NOTHING`
);

const listStmt = db.prepare(`SELECT * FROM products WHERE list_id = ? ORDER BY created_at ASC`);

const deleteByIdStmt = db.prepare(`DELETE FROM products WHERE list_id = ? AND id = ?`);

const clearStmt = db.prepare(`DELETE FROM products WHERE list_id = ?`);

export function addProduct(listId: string, name: string): { added: boolean } {
  const normalized_name = normalize(name);
  const result = insertStmt.run({ list_id: listId, name: name.trim(), normalized_name });
  return { added: result.changes > 0 };
}

export function listProducts(listId: string): Product[] {
  return listStmt.all(listId) as Product[];
}

export function removeProductById(listId: string, id: number): { removed: boolean } {
  const result = deleteByIdStmt.run(listId, id);
  return { removed: result.changes > 0 };
}

export function clearProducts(listId: string): number {
  return clearStmt.run(listId).changes;
}
