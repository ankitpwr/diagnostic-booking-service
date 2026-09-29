import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export type UserRole = "USER" | "ADMIN";

export interface CustomPayload extends JwtPayload {
  email: string;
  id: number;
  role: UserRole;
}

export interface CustomRequest extends Request {
  email: string;
  id: number;
  role: UserRole;
}

function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction,
  requiredRole: UserRole,
) {
  try {
    const cookieName = requiredRole === "ADMIN" ? "adminToken" : "userToken";
    const token = req.cookies?.[cookieName] || "";
    if (!token) {
      return res.status(401).json({
        error: requiredRole
          ? "unauthorized to access admin endpoint"
          : "Unauthorized User, please login first",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "server misconfiguration" });
    }

    const decode = jwt.verify(token, secret) as CustomPayload;
    if (!decode?.email || !decode?.id || !decode?.role) {
      return res.status(401).json({
        error: requiredRole
          ? "unauthorized to access admin endpoint"
          : "Unauthorized User, please login first",
      });
    }

    if (requiredRole && decode.role !== requiredRole) {
      return res.status(401).json({
        error:
          requiredRole === "ADMIN"
            ? "unauthorized to access admin endpoint"
            : "Unauthorized User",
      });
    }

    (req as CustomRequest).email = decode.email;
    (req as CustomRequest).id = decode.id;
    (req as CustomRequest).role = decode.role;

    next();
  } catch (error) {
    console.log("auth middleware error", error);
    return res.status(401).json({
      error: requiredRole
        ? "unauthorized to access admin endpoint"
        : "Unauthorized User, please login first",
    });
  }
}

export function userAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  return authenticateRequest(req, res, next, "USER");
}

export function adminAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  return authenticateRequest(req, res, next, "ADMIN");
}
