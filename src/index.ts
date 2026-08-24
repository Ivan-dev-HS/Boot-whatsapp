import "./db"; // inicializa la base de datos y crea las tablas si no existen
import { scheduleAlerts } from "./alerts/scheduler";
import { config } from "./config";
import { createWhatsAppClient } from "./whatsapp/client";

async function main() {
  console.log("Iniciando Boot-whatsapp...");
  if (config.useMockScrapers) {
    console.log("ℹ️ Usando datos de ofertas simulados (USE_MOCK_SCRAPERS=true).");
  }

  const client = createWhatsAppClient();

  client.once("ready", () => {
    scheduleAlerts(client);
  });

  await client.initialize();
}

main().catch((error) => {
  console.error("Error fatal al iniciar el bot:", error);
  process.exit(1);
});
