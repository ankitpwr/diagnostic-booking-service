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

export const bookingRouter = Router();

bookingRouter.post("/", userAuthMiddleware, booking);
bookingRouter.get("/:bookingId", userAuthMiddleware, getBooking);
bookingRouter.patch("/:bookingId/cancel", userAuthMiddleware, cancelBooking);
bookingRouter.delete("/cancel/:bookingId", userAuthMiddleware, cancelBooking);
