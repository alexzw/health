import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { createAppleHealthRoutes } from "./routes/apple-health-routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { createFamilyMemberRepository } from "./repositories/family-member-repository.js";
import { createFamilyMemberRoutes } from "./routes/family-member-routes.js";
import { AppleHealthImportService } from "./services/apple-health-import-service.js";
import { FamilyMemberService } from "./services/family-member-service.js";

const repository = createFamilyMemberRepository();
const familyMemberService = new FamilyMemberService(repository);
const appleHealthImportService = new AppleHealthImportService(familyMemberService);

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("CORS origin not allowed"));
      }
    })
  );
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({
      status: "ok",
      database: env.databaseUrl ? "postgres" : "seeded-memory"
    });
  });

  app.use("/api/v1/family-members", createFamilyMemberRoutes(familyMemberService));
  app.use("/api/v1/apple-health", createAppleHealthRoutes(appleHealthImportService));
  app.use(errorHandler);

  return app;
}
