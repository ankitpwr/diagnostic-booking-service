import { Router } from "express";

import {
  addCenter,
  getAvailableTests,
  getDiagnosticCenters,
  removeCenter,
} from "../controllers/diagnosticCenter.controller";
import {
  adminAuthMiddleware,
  userAuthMiddleware,
} from "../middlewares/auth.middleware";

export const diagnosticCenterRouter = Router();

diagnosticCenterRouter.post("/add-center", adminAuthMiddleware, addCenter);
diagnosticCenterRouter.get("/", userAuthMiddleware, getDiagnosticCenters);
diagnosticCenterRouter.get(
  "/:centerId/tests",
  userAuthMiddleware,
  getAvailableTests,
);
diagnosticCenterRouter.delete("/:centerId", adminAuthMiddleware, removeCenter);
