import cron from "node-cron";
import { Client } from "whatsapp-web.js";
import { config } from "../config";
import { compareProductsWithOffers, ProductComparison } from "../matching/compare";
import { listChatsWithProducts, listProducts } from "../products/repository";
import { scrapeAllStores } from "../scrapers";
import { formatAlert } from "../whatsapp/messages";
import { markAlertSent, offerSignature, wasAlertSent } from "./repository";

/** Compara las listas de todos los chats contra las ofertas y envía avisos de las que sean nuevas. */
export async function checkAndSendAlerts(client: Client): Promise<void> {
  console.log("🔍 Comprobando ofertas...");
  const scrapeResults = await scrapeAllStores();
  for (const result of scrapeResults) {
    if (result.error) {
      console.warn(`  ⚠️ ${result.store}: fallo al obtener ofertas (${result.error})`);
    } else {
      console.log(`  ${result.store}: ${result.offersFound} ofertas obtenidas`);
    }
  }

  for (const chatId of listChatsWithProducts()) {
    const products = listProducts(chatId);
    const comparisons = compareProductsWithOffers(products);
    const newAlerts: ProductComparison[] = [];

    for (const comparison of comparisons) {
      const best = comparison.matches[0];
      if (!best) continue;

      const signature = offerSignature(best.offer);
      if (wasAlertSent(chatId, comparison.product.id, signature)) continue;

      markAlertSent(chatId, comparison.product.id, best.offer.store, signature);
      newAlerts.push({ product: comparison.product, matches: [best] });
    }

    if (newAlerts.length > 0) {
      await client.sendMessage(chatId, formatAlert(newAlerts));
    }
  }
}

export function scheduleAlerts(client: Client): void {
  cron.schedule(config.alertsCron, () => {
    checkAndSendAlerts(client).catch((error) => {
      console.error("Error comprobando ofertas programadas:", error);
    });
  });
  console.log(`⏰ Comprobación automática de ofertas programada (${config.alertsCron}).`);
}
