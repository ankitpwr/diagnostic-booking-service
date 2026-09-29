import type { Request, Response } from "express";
import { db } from "../db/db";
import { bookingsTable, paymentsTable } from "../db/schema";
import {
  initiatePaymentSchema,
  paymentIdSchema,
  webhookSchema,
} from "../lib/zod-schema";
import { and, desc, eq } from "drizzle-orm";
import type { CustomRequest } from "../middlewares/auth.middleware";
import { simulatePayment } from "../services/fakeProvider";
import { stat } from "fs";

export async function initiatePayments(req: Request, res: Response) {
  try {
    const parsedBody = initiatePaymentSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(401).json({
        error: parsedBody.error.issues[0]?.message,
      });
    }
    const userId = (req as CustomRequest).id;
    const result = await db.transaction(async (tx) => {
      const [booking] = await tx
        .select()
        .from(bookingsTable)
        .where(
          and(
            eq(bookingsTable.id, parsedBody.data.bookingId),
            eq(bookingsTable.userId, userId),
          ),
        )
        .for("update");
      if (!booking) return { kind: "not_found" as const };
      if (booking.bookingStatus !== "PENDING")
        return { kind: "not_payable" as const };

      const [pending] = await tx
        .select()
        .from(paymentsTable)
        .where(
          and(
            eq(paymentsTable.bookingId, booking.id),
            eq(paymentsTable.status, "PENDING"),
          ),
        )
        .orderBy(desc(paymentsTable.createdAt))
        .limit(1);
      if (pending) return { kind: "existing" as const, payment: pending };

      const [payment] = await tx
        .insert(paymentsTable)
        .values({
          bookingId: booking.id,
          amount: booking.amount,
        })
        .returning();
      return { kind: "created" as const, payment };
    });

    if (result.kind === "not_found") {
      return res.status(404).json({
        error: "booking not found",
      });
    }
    if (result.kind === "not_payable") {
      return res.status(409).json({
        error: "booking is not pending",
      });
    }

    const payment = result.payment;
    if (!payment) {
      return res.status(500).json({
        error: "payment could not be created",
      });
    }

    if (result.kind === "created") void simulatePayment(payment.id);
    return res.status(result.kind === "created" ? 201 : 200).json({
      paymentId: payment.id,
      bookingId: payment.bookingId,
      amount: payment.amount,
      status: payment.status,
    });
  } catch (error) {
    console.log("error in initiate payment controller", error);
    return res.status(500).json({
      error: "internal server error",
    });
  }
}

export async function getPayment(req: Request, res: Response) {
  try {
    const parsedParams = paymentIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        error: "invalid payment id",
      });
    }

    const [payment] = await db
      .select({ payment: paymentsTable, bookingUserId: bookingsTable.userId })
      .from(paymentsTable)
      .innerJoin(bookingsTable, eq(paymentsTable.bookingId, bookingsTable.id))
      .where(
        and(
          eq(paymentsTable.id, parsedParams.data.paymentId),
          eq(bookingsTable.userId, (req as CustomRequest).id),
        ),
      );
    if (!payment) {
      return res.status(404).json({
        error: "payment not found",
      });
    }

    return res.status(200).json({
      data: payment.payment,
    });
  } catch (error) {
    return res.status(500).json({
      error: "internal server error",
    });
  }
}

export async function paymentWebhook(req: Request, res: Response) {
  console.log("webhook controller has been called");
  if (
    !process.env.WEBHOOK_SECRET ||
    req.header("X-Webhook-Secret") !== process.env.WEBHOOK_SECRET
  ) {
    return res.status(401).json({
      error: "invalid webhook secret",
    });
  }

  const parsedBody = webhookSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(401).json({
      error: parsedBody.error.issues[0]?.message,
    });
  }

  const { eventId, paymentId, status } = parsedBody.data;
  console.log("status is ", status);
  try {
    const outcome = await db.transaction(async (tx) => {
      const [payment] = await tx
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.id, paymentId))
        .for("update");
      if (!payment) return "not_found" as const;
      if (payment.providerEventId || payment.status !== "PENDING")
        return "duplicate" as const;

      const [booking] = await tx
        .select()
        .from(bookingsTable)
        .where(eq(bookingsTable.id, payment.bookingId))
        .for("update");
      if (!booking || booking.bookingStatus !== "PENDING")
        return "ignored_invalid_transition" as const;

      await tx
        .update(paymentsTable)
        .set({ status, providerEventId: eventId, updatedAt: new Date() })
        .where(eq(paymentsTable.id, payment.id));

      await tx
        .update(bookingsTable)
        .set({
          bookingStatus: status === "SUCCESS" ? "CONFIRMED" : "FAILED",
          updatedAt: new Date(),
        })
        .where(eq(bookingsTable.id, booking.id));
      return "processed" as const;
    });

    console.log(JSON.stringify({ eventId, paymentId, outcome }));
    if (outcome === "not_found") {
      return res.status(404).json({
        error: "payment not found",
      });
    } else if (outcome === "ignored_invalid_transition") {
      return res.status(200).json({
        error: "Invalid booking",
      });
    }
    return res.status(200).json({
      status: outcome === "processed" ? "processed" : "already_processed",
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505")
      return res.json({ status: "already_processed" });
    console.log("webhook processing error", error);

    return res.status(500).json({
      error: "internal server error",
    });
  }
}
