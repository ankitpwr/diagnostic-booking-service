import type { Request, Response } from "express";
import { addTestsSchema, testIdSchema } from "../lib/zod-schema";
import { db } from "../db/db";
import { diagnosticCenterTable, testsTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { redisClient } from "../lib/redis";

export async function addTest(req: Request, res: Response) {
  try {
    const parsedData = addTestsSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(401).json({
        error: parsedData.error.issues[0]?.message,
      });
    }

    const center = await db
      .select()
      .from(diagnosticCenterTable)
      .where(eq(diagnosticCenterTable.id, parsedData.data.diagnosticCenterId));

    if (center.length == 0) {
      return res.status(404).json({
        error: "diagnostic center is not present",
      });
    }

    await db.insert(testsTable).values({
      name: parsedData.data.name,
      price: parsedData.data.price,
      diagnosticCenterId: parsedData.data.diagnosticCenterId,
    });

    return res.status(200).json({
      message: "test added successfully",
    });
  } catch (error) {
    console.log("error in add test controller", error);
    return res.status(500).json({
      error: "internal server error",
    });
  }
}

export async function testDetails(req: Request, res: Response) {
  try {
    const parsedParams = testIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        error: parsedParams.error.issues[0]?.message,
      });
    }

    const cachedData = await redisClient.get(
      `test-details-${parsedParams.data.testId}`,
    );

    if (cachedData) {
      return res.status(200).json({
        data: JSON.parse(cachedData),
      });
    }
    const [test] = await db
      .select()
      .from(testsTable)
      .where(eq(testsTable.id, parsedParams.data.testId));

    if (!test) {
      return res.status(404).json({
        error: "test does not exists",
      });
    }

    await redisClient.set(
      `test-details-${parsedParams.data.testId}`,
      JSON.stringify(test),
      "EX",
      900,
    );
    return res.status(200).json({
      data: test,
    });
  } catch (error) {
    console.log("error in test details controller", error);
    return res.status(500).json({
      error: "internal server error",
    });
  }
}
