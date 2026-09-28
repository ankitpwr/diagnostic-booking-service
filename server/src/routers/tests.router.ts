import { Router } from "express";

import {
  adminAuthMiddleware,
  userAuthMiddleware,
} from "../middlewares/auth.middleware";
import { addTest, testDetails } from "../controllers/tests.controller";

export const testRouter = Router();

testRouter.get("/:testId", userAuthMiddleware, testDetails);
testRouter.post("/add", adminAuthMiddleware, addTest);
