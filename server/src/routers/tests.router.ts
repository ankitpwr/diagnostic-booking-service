import { Router } from "express";

import {
  adminAuthMiddleware,
  userAuthMiddleware,
} from "../middlewares/auth.middleware";
import { addTest, testDetails } from "../controllers/tests.controller";
import { rateLimitMiddleware } from "../middlewares/ratelimit.middleware";

export const testRouter = Router();

testRouter.get(
  "/:testId",
  rateLimitMiddleware,
  userAuthMiddleware,
  testDetails,
);
testRouter.post("/add", adminAuthMiddleware, addTest);
