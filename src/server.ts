import express from "express";
import path from "node:path";
import "./db";
import { config } from "./config";
import { compareProductsWithOffers } from "./matching/compare";
import { addProduct, clearProducts, listProducts, removeProductById } from "./products/repository";
import { scrapeAllStores } from "./scrapers";
import { STORE_LABELS } from "./scrapers/types";

// Aplicación web de un único usuario/pareja: no hay chats ni cuentas, así
// que reutilizamos las tablas pensadas para el bot de WhatsApp (que están
// particionadas por "chat_id") con un identificador fijo para la lista.
const APP_LIST_ID = "web";

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/products", (_req, res) => {
  res.json(listProducts(APP_LIST_ID));
});

app.post("/api/products", (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    res.status(400).json({ error: "Falta el nombre del producto" });
    return;
  }
  const { added } = addProduct(APP_LIST_ID, name);
  res.status(201).json({ added, products: listProducts(APP_LIST_ID) });
});

app.delete("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Id inválido" });
    return;
  }
  removeProductById(APP_LIST_ID, id);
  res.json({ products: listProducts(APP_LIST_ID) });
});

app.delete("/api/products", (_req, res) => {
  clearProducts(APP_LIST_ID);
  res.json({ products: [] });
});

app.post("/api/compare", async (_req, res) => {
  try {
    const scrapeResults = await scrapeAllStores();
    const comparisons = compareProductsWithOffers(listProducts(APP_LIST_ID));

    res.json({
      scrapeResults,
      comparisons: comparisons.map(({ product, matches }) => ({
        product: { id: product.id, name: product.name },
        matches: matches.map(({ offer, score }) => ({
          store: offer.store,
          storeLabel: STORE_LABELS[offer.store],
          price: offer.price,
          offerName: offer.product_name,
          score,
        })),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.listen(config.port, () => {
  console.log(`🛒 Boot-whatsapp escuchando en http://localhost:${config.port}`);
  if (config.useMockScrapers) {
    console.log("ℹ️ Usando datos de ofertas simulados (USE_MOCK_SCRAPERS=true).");
  }
});
