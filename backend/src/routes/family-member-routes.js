import { Router } from "express";
import { createFamilyMemberController } from "../controllers/family-member-controller.js";

export function createFamilyMemberRoutes(service) {
  const router = Router();
  const controller = createFamilyMemberController(service);

  router.get("/", controller.list);
  router.get("/:id/growth-tracking", controller.getGrowthTracking);
  router.get("/:id", controller.getById);
  router.patch("/:id", controller.updateById);
  router.post("/:id/health-records", controller.createHealthRecord);
  router.patch("/:id/health-records/:recordId", controller.updateHealthRecord);
  router.delete("/:id/health-records/:recordId", controller.deleteHealthRecord);
  router.post("/:id/growth-tracking", controller.createGrowthMeasurement);
  router.patch("/:id/growth-tracking/:measurementId", controller.updateGrowthMeasurement);
  router.delete("/:id/growth-tracking/:measurementId", controller.deleteGrowthMeasurement);
  router.post("/:id/exercise-logs", controller.createExerciseLog);
  router.patch("/:id/exercise-logs/:exerciseLogId", controller.updateExerciseLog);
  router.delete("/:id/exercise-logs/:exerciseLogId", controller.deleteExerciseLog);

  return router;
}
