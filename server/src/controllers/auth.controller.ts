import type { Request, Response } from "express";
import { loginSchema, signupSchema } from "../lib/zod-schema";
import { db } from "../db/db";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }
  return secret;
}

function setAuthCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 480,
  });
}

export async function signupController(req: Request, res: Response) {
  try {
    const parsedData = signupSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(401).json({
        error: parsedData.error.issues[0]?.message,
      });
    }

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, parsedData.data.email));

    if (user.length > 0) {
      return res.status(409).json({
        error: "email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);

    await db.insert(usersTable).values({
      name: parsedData.data.name,
      email: parsedData.data.email,
      password: hashedPassword,
      role: "USER",
    });

    return res.status(200).json({
      message: "signup successful",
    });
  } catch (error) {
    console.log("error in signup controller", error);
    return res.status(500).json({
      error: "internal server error",
    });
  }
}

export async function loginController(req: Request, res: Response) {
  try {
    const parsedData = loginSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(401).json({
        error: parsedData.error.issues[0]?.message,
      });
    }

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, parsedData.data.email));

    const existingUser = user[0];
    if (!existingUser) {
      return res.status(404).json({
        error: "email does not exists",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      parsedData.data.password,
      existingUser.password,
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        email: existingUser.email,
        id: existingUser.id,
        role: existingUser.role,
      },
      getJwtSecret(),
      { expiresIn: "7d" },
    );

    setAuthCookie(res, token);

    return res.status(200).json({ token, message: "login successful" });
  } catch (error) {
    console.log("error login controller", error);
    return res.status(500).json({
      error: "internal server error",
    });
  }
}

export async function adminLoginController(req: Request, res: Response) {
  try {
    const parsedData = loginSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(401).json({
        error: parsedData.error.issues[0]?.message,
      });
    }

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, parsedData.data.email));

    const existingUser = user[0];
    if (!existingUser) {
      return res.status(404).json({
        error: "email does not exists",
      });
    }

    if (existingUser.role !== "ADMIN") {
      return res.status(403).json({
        error: "this account is not an admin account",
      });
    }

    if (parsedData.data.password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({
        error: "invalid admin password",
      });
    }

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser.id, role: "ADMIN" },
      getJwtSecret(),
      { expiresIn: "7d" },
    );

    setAuthCookie(res, token);

    return res.status(200).json({ token, message: "admin login successful" });
  } catch (error) {
    console.log("error in admin login controller", error);
    return res.status(500).json({
      error: "internal server error",
    });
  }
}
