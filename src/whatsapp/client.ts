import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { config } from "../config";
import { handleCommand } from "./commands";

export function createWhatsAppClient(): Client {
  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", (qr) => {
    console.log("Escanea este código QR con WhatsApp (Ajustes > Dispositivos vinculados):");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    console.log("✅ Bot de WhatsApp conectado y listo.");
  });

  client.on("auth_failure", (message) => {
    console.error("❌ Fallo de autenticación de WhatsApp:", message);
  });

  client.on("disconnected", (reason) => {
    console.error("⚠️ WhatsApp desconectado:", reason);
  });

  client.on("message", (message) => onMessage(client, message));

  return client;
}

function isChatAllowed(chatId: string): boolean {
  return config.allowedChatIds.length === 0 || config.allowedChatIds.includes(chatId);
}

async function onMessage(client: Client, message: Message): Promise<void> {
  const chatId = message.from;

  if (!isChatAllowed(chatId)) {
    if (message.body.trim().startsWith("!")) {
      console.log(`Mensaje ignorado de chat no autorizado: ${chatId}`);
    }
    return;
  }

  try {
    const reply = await handleCommand(chatId, message.body);
    if (reply) {
      await client.sendMessage(chatId, reply);
    }
  } catch (error) {
    console.error("Error procesando el mensaje:", error);
    await client.sendMessage(chatId, "⚠️ Ha ocurrido un error procesando tu comando.");
  }
}
