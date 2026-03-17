import dotenv from "dotenv";

dotenv.config();

function parseCorsOrigins(value) {
  return String(value || "http://localhost:3000")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "",
  adminToken: process.env.FAMILY_ADMIN_TOKEN || "",
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-5-mini"
};
