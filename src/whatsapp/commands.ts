import { compareProductsWithOffers } from "../matching/compare";
import { addProduct, clearProducts, listProducts, removeProduct } from "../products/repository";
import { scrapeAllStores } from "../scrapers";
import { STORE_LABELS } from "../scrapers/types";
import { formatComparison, formatProductList, HELP_MESSAGE } from "./messages";

const ADD_ALIASES = ["añadir", "anadir", "add"];
const REMOVE_ALIASES = ["quitar", "eliminar", "borrar", "remove"];
const LIST_ALIASES = ["lista", "list"];
const COMPARE_ALIASES = ["comparar", "ofertas", "check"];
const HELP_ALIASES = ["ayuda", "help"];
const CLEAR_ALIASES = ["vaciar", "clear"];

interface ParsedCommand {
  command: string;
  args: string;
}

function parseCommand(text: string): ParsedCommand | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("!")) return null;
  const withoutPrefix = trimmed.slice(1);
  const spaceIndex = withoutPrefix.indexOf(" ");
  if (spaceIndex === -1) {
    return { command: withoutPrefix.toLowerCase(), args: "" };
  }
  return {
    command: withoutPrefix.slice(0, spaceIndex).toLowerCase(),
    args: withoutPrefix.slice(spaceIndex + 1).trim(),
  };
}

/**
 * Procesa un mensaje entrante y devuelve el texto de respuesta, o null si el
 * mensaje no era un comando reconocido (en cuyo caso no se responde nada).
 */
export async function handleCommand(chatId: string, text: string): Promise<string | null> {
  const parsed = parseCommand(text);
  if (!parsed) return null;
  const { command, args } = parsed;

  if (HELP_ALIASES.includes(command)) {
    return HELP_MESSAGE;
  }

  if (ADD_ALIASES.includes(command)) {
    if (!args) return "Indica qué producto quieres añadir. Ejemplo: *!añadir leche*";
    const { added } = addProduct(chatId, args);
    return added
      ? `✅ Añadido "${args}" a la lista.`
      : `"${args}" ya estaba en la lista.`;
  }

  if (REMOVE_ALIASES.includes(command)) {
    if (!args) return "Indica qué producto quieres quitar. Ejemplo: *!quitar leche*";
    const { removed } = removeProduct(chatId, args);
    return removed
      ? `🗑️ Eliminado "${args}" de la lista.`
      : `No encontré "${args}" en la lista.`;
  }

  if (LIST_ALIASES.includes(command)) {
    return formatProductList(listProducts(chatId));
  }

  if (CLEAR_ALIASES.includes(command)) {
    if (args !== "confirmar" && args !== "confirm") {
      return "Esto borrará toda la lista. Escribe *!vaciar confirmar* para confirmar.";
    }
    const count = clearProducts(chatId);
    return `🧹 Lista vaciada (${count} productos eliminados).`;
  }

  if (COMPARE_ALIASES.includes(command)) {
    const products = listProducts(chatId);
    if (products.length === 0) {
      return formatProductList(products);
    }
    await scrapeAllStores();
    const comparisons = compareProductsWithOffers(products);
    const storesChecked = Object.values(STORE_LABELS).join(", ");
    return `Comprobado en: ${storesChecked}\n\n${formatComparison(comparisons)}`;
  }

  return `Comando no reconocido. Escribe *!ayuda* para ver los comandos disponibles.`;
}
