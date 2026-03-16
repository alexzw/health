import { Router } from "express";
import multer from "multer";
import { createAppleHealthController } from "../controllers/apple-health-controller.js";

const upload = multer({
  storage: multer.memoryStorage()
});

export function createAppleHealthRoutes(service) {
  const router = Router();
  const controller = createAppleHealthController(service);

  router.post("/preview", upload.single("file"), controller.previewFile);
  router.post("/import", upload.single("file"), controller.importFile);

  return router;
}
