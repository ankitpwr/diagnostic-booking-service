import { Router } from "express";

import {
  adminAuthMiddleware,
  userAuthMiddleware,
} from "../middlewares/auth.middleware";
import {
  booking,
  cancelBooking,
  getBooking,
} from "../controllers/booking.controller";
import { rateLimitMiddleware } from "../middlewares/ratelimit.middleware";

export const bookingRouter = Router();

bookingRouter.post("/", userAuthMiddleware, booking);
bookingRouter.get(
  "/:bookingId",
  rateLimitMiddleware,
  userAuthMiddleware,
  getBooking,
);
bookingRouter.patch("/:bookingId/cancel", userAuthMiddleware, cancelBooking);
bookingRouter.delete("/cancel/:bookingId", userAuthMiddleware, cancelBooking);
