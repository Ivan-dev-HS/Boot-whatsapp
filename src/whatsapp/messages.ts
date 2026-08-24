import { ProductComparison } from "../matching/compare";
import { Product } from "../products/repository";
import { STORE_LABELS } from "../scrapers/types";

export const HELP_MESSAGE = `*Bot comparador de la compra* 🛒

Comandos disponibles:
• *!añadir <producto>* — añade un producto a la lista compartida
• *!quitar <producto>* — elimina un producto de la lista
• *!lista* — muestra la lista de la compra actual
• *!vaciar confirmar* — vacía toda la lista
• *!comparar* — compara la lista ahora mismo contra las ofertas de Lidl, Aldi, Plus Fresc y Esclat
• *!ayuda* — muestra este mensaje

El bot también avisa automáticamente cuando detecta una oferta nueva que coincide con algo de tu lista.`;

export function formatProductList(products: Product[]): string {
  if (products.length === 0) {
    return "La lista de la compra está vacía. Añade productos con *!añadir <producto>*.";
  }
  const lines = products.map((p, i) => `${i + 1}. ${p.name}`);
  return `*Lista de la compra* (${products.length})\n${lines.join("\n")}`;
}

export function formatComparison(comparisons: ProductComparison[]): string {
  if (comparisons.length === 0) {
    return "Tu lista está vacía. Añade productos con *!añadir <producto>*.";
  }

  const blocks = comparisons.map(({ product, matches }) => {
    if (matches.length === 0) {
      return `▪️ *${product.name}*\n   Sin ofertas encontradas ahora mismo.`;
    }
    const [best, ...rest] = matches;
    const bestLine = `   🏆 ${STORE_LABELS[best.offer.store]}: ${formatPrice(best.offer.price)} — ${best.offer.product_name}`;
    const restLines = rest.map(
      (m) => `   • ${STORE_LABELS[m.offer.store]}: ${formatPrice(m.offer.price)} — ${m.offer.product_name}`
    );
    return [`▪️ *${product.name}*`, bestLine, ...restLines].join("\n");
  });

  return `*Comparativa de precios* 🛒\n\n${blocks.join("\n\n")}`;
}

export function formatAlert(chatAlerts: ProductComparison[]): string {
  const blocks = chatAlerts.map(({ product, matches }) => {
    const best = matches[0];
    return `▪️ *${product.name}* → ${STORE_LABELS[best.offer.store]} a ${formatPrice(best.offer.price)} (${best.offer.product_name})`;
  });
  return `*¡Nuevas ofertas para tu lista!* 🔔\n\n${blocks.join("\n")}`;
}

function formatPrice(price: number): string {
  return `${price.toFixed(2).replace(".", ",")} €`;
}
