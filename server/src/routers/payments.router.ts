import { Router } from "express";
import {
  getPayment,
  initiatePayments,
  paymentWebhook,
} from "../controllers/payment.controller";
import { userAuthMiddleware } from "../middlewares/auth.middleware";

export const paymentsRouter = Router();

paymentsRouter.post("/", userAuthMiddleware, initiatePayments);
paymentsRouter.get("/:paymentId", userAuthMiddleware, getPayment);
paymentsRouter.post("/webhook", paymentWebhook);
