import { Router } from "express";

import {
  adminLoginController,
  loginController,
  signupController,
} from "../controllers/auth.controller";
import { rateLimitMiddleware } from "../middlewares/ratelimit.middleware";

export const authRouter = Router();

authRouter.post("/signup", rateLimitMiddleware, signupController);
authRouter.post("/login", rateLimitMiddleware, loginController);
authRouter.post("/admin/login", adminLoginController);
