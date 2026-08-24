import "dotenv/config";
import path from "node:path";

export const config = {
  databasePath: process.env.DATABASE_PATH ?? path.join("data", "boot-whatsapp.sqlite"),
  port: Number(process.env.PORT ?? 3000),
  matchThreshold: Number(process.env.MATCH_THRESHOLD ?? 0.6),
  useMockScrapers: process.env.USE_MOCK_SCRAPERS === "true",
};
