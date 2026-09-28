import { Router } from "express";

import {
  adminLoginController,
  loginController,
  signupController,
} from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.post("/signup", signupController);
authRouter.post("/login", loginController);
authRouter.post("/admin/login", adminLoginController);
