import type { Request, Response } from "express";
import {
  bookTestSchema,
  bookingIdSchema,
  cancelBookingSchema,
} from "../lib/zod-schema";
import { db } from "../db/db";
import { bookingsTable, paymentsTable, testsTable } from "../db/schema";
import { and, desc, eq } from "drizzle-orm";
import type { CustomRequest } from "../middlewares/auth.middleware";

export async function booking(req: Request, res: Response) {
  try {
    const parsedData = bookTestSchema.safeParse(req.body);
    const userId = (req as CustomRequest).id;
    if (!parsedData.success) {
      return res.status(400).json({
        error: parsedData.error.issues[0]?.message,
      });
    }

    const [test] = await db
      .select({
        centerId: testsTable.diagnosticCenterId,
        amount: testsTable.price,
      })
      .from(testsTable)
      .where(
        and(
          eq(testsTable.id, parsedData.data.testId),
          eq(testsTable.diagnosticCenterId, parsedData.data.diagnosticCenterId),
        ),
      );
    if (!test) {
      return res.status(404).json({
        error: "test is not available at this centre",
      });
    }

    const bookingId = await db
      .insert(bookingsTable)
      .values({
        amount: test.amount,
        userId: userId,
        testId: parsedData.data.testId,
        diagnosticCenterId: parsedData.data.diagnosticCenterId,
        appointmentAt: parsedData.data.appointmentTime,
      })
      .returning({ bookingId: bookingsTable.id });

    return res.status(201).json({
      message: "booking created; please pay to confirm the booking",
      bookingId: bookingId[0]?.bookingId,
    });
  } catch (error) {
    console.log("error in booking controller", error);
    return res.status(500).json({
      error: "internal server error",
    });
  }
}

export async function cancelBooking(req: Request, res: Response) {
  try {
    const parsedParams = cancelBookingSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        error: parsedParams.error.issues[0]?.message,
      });
    }
    const [data] = await db
      .update(bookingsTable)
      .set({ bookingStatus: "CANCELLED", updatedAt: new Date() })
      .where(
        and(
          eq(bookingsTable.id, parsedParams.data.bookingId),
          eq(bookingsTable.userId, (req as CustomRequest).id),
          eq(bookingsTable.bookingStatus, "PENDING"),
        ),
      )
      .returning({ bookingId: bookingsTable.id });

    if (!data) {
      return res.status(409).json({
        error: "booking is missing, not yours, or no longer pending",
      });
    }
    return res.status(200).json({
      message: "booking has been canceled successfully",
    });
  } catch (error) {
    console.log("error in cancel booking controller", error);
    return res.status(500).json({
      error: "internal server error",
    });
  }
}

export async function getBooking(req: Request, res: Response) {
  try {
    const parsedParams = bookingIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "invalid booking id" },
      });
    }

    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.id, parsedParams.data.bookingId),
          eq(bookingsTable.userId, (req as CustomRequest).id),
        ),
      );
    if (!booking) return res.status(404).json({ error: "booking not found" });

    const [payment] = await db
      .select({
        id: paymentsTable.id,
        status: paymentsTable.status,
        amount: paymentsTable.amount,
      })
      .from(paymentsTable)
      .where(eq(paymentsTable.bookingId, booking.id))
      .orderBy(desc(paymentsTable.createdAt))
      .limit(1);
    return res.status(200).json({ ...booking, payment: payment ?? null });
  } catch (error) {
    console.log("error in get booking controller", error);
    return res.status(500).json({
      error: "internal server error",
    });
  }
}
