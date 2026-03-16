import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "",
  adminToken: process.env.FAMILY_ADMIN_TOKEN || "",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000"
};

