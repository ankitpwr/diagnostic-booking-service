import type { Request, Response } from "express";
import {
  addCenterSchema,
  diagnosticCenterIdSchema,
  getDiagnosticCentersSchema,
} from "../lib/zod-schema";
import { db } from "../db/db";
import { diagnosticCenterTable, testsTable } from "../db/schema";
import { asc, eq } from "drizzle-orm";
import { clearDiagnosticCentersCache, redisClient } from "../lib/redis";

export async function addCenter(req: Request, res: Response) {
  try {
    const parsedData = addCenterSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(401).json({
        error: parsedData.error.issues[0]?.message,
      });
    }
    await db.insert(diagnosticCenterTable).values({
      name: parsedData.data.name,
      location: parsedData.data.location,
    });
    await clearDiagnosticCentersCache();
    return res.status(200).json({
      message: "diagnostic center added successfully",
    });
  } catch (error) {
    console.log("error in add center controller");
    return res.status(500).json({
      error: "internal server error",
    });
  }
}

export async function removeCenter(req: Request, res: Response) {
  try {
    const parsedParams = diagnosticCenterIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        error: parsedParams.error.issues[0]?.message,
      });
    }

    await db
      .delete(diagnosticCenterTable)
      .where(eq(diagnosticCenterTable.id, parsedParams.data.centerId));

    await clearDiagnosticCentersCache();
    return res.status(200).json({
      message: "center deleted",
    });
  } catch (error) {
    console.log("error in remove center controller");
    return res.status(500).json({
      error: "internal server error",
    });
  }
}

export async function getDiagnosticCenters(req: Request, res: Response) {
  try {
    const parsedQuery = getDiagnosticCentersSchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res.status(401).json({
        error: parsedQuery.error.issues[0]?.message,
      });
    }

    const cachedData = await redisClient.get(
      `diagnostic-centers-${parsedQuery.data.pageNumber}`,
    );

    if (cachedData) {
      return res.status(200).json({
        data: JSON.parse(cachedData),
      });
    }

    const pageSize = 10;
    const centers = await db
      .select()
      .from(diagnosticCenterTable)
      .orderBy(asc(diagnosticCenterTable.id))
      .limit(pageSize)
      .offset((parsedQuery.data.pageNumber - 1) * pageSize);

    await redisClient.set(
      `diagnostic-centers-${parsedQuery.data.pageNumber}`,
      JSON.stringify(centers),
      "EX",
      900,
    );

    return res.status(200).json({
      data: centers,
    });
  } catch (error) {
    console.log("error in get diagnostic center ", error);
    return res.status(500).json({
      error: "internal server error",
    });
  }
}

export async function getAvailableTests(req: Request, res: Response) {
  try {
    const parsedParams = diagnosticCenterIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        error: parsedParams.error.issues[0]?.message,
      });
    }
    const tests = await db
      .select({ name: testsTable.name, id: testsTable.id })
      .from(testsTable)
      .where(eq(testsTable.diagnosticCenterId, parsedParams.data.centerId));

    return res.status(200).json({
      data: tests,
    });
  } catch (error) {
    console.log("error in get Available Tests controller", error);
    return res.status(500).json({
      error: "internal server error",
    });
  }
}
