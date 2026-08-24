import "dotenv/config";
import path from "node:path";

function parseAllowedChatIds(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export const config = {
  databasePath: process.env.DATABASE_PATH ?? path.join("data", "boot-whatsapp.sqlite"),
  allowedChatIds: parseAllowedChatIds(process.env.ALLOWED_CHAT_IDS),
  alertsCron: process.env.ALERTS_CRON ?? "0 9 * * *",
  matchThreshold: Number(process.env.MATCH_THRESHOLD ?? 0.6),
  useMockScrapers: process.env.USE_MOCK_SCRAPERS === "true",
};
