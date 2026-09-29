import type { NextFunction, Request, Response } from "express";
import type { CustomRequest } from "./auth.middleware";
import { RateLimit } from "../lib/rate-limit";

export async function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req as CustomRequest;

    const rateLimitter = new RateLimit(3, 10000, String(id));
    const check = await rateLimitter.checkLimit();

    res.setHeader("X-RateLimit-Limit", 3);
    res.setHeader("X-RateLimit-Remaining", check.remainingRequests);

    if (!check.allowed) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Rate limit exceeded",
      });
    }

    next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    next(); //fail-open approach
  }
}
