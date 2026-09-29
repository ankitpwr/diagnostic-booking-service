import { z } from "zod";

export const signupSchema = z.object({
  name: z.string({ message: "username must be present" }),
  email: z.email({ message: "email must be present" }),
  password: z.string({ message: "password must be present" }),
});

export const loginSchema = z.object({
  email: z.email({ message: "email must be present" }),
  password: z.string({ message: "password must be present" }),
});

export const addCenterSchema = z.object({
  name: z
    .string({ message: "name of the diagnostic center must be present" })
    .min(3, { message: "name should be atleast 3 character log" }),
  location: z.string({ message: "location of the center must be present" }),
});

export const getDiagnosticCentersSchema = z.object({
  pageNumber: z.coerce
    .number()
    .int({ message: "invalid page number" })
    .gt(0, { message: "invalid page number" })
    .default(1),
});

export const diagnosticCenterIdSchema = z.object({
  centerId: z.coerce
    .number()
    .int({ message: "invalid diagnostic center id" })
    .gt(0, { message: "invalid diagnostic center id" }),
});

export const testIdSchema = z.object({
  testId: z.coerce
    .number()
    .int({ message: "invalid test id" })
    .gt(0, { message: "invalid test id" }),
});

export const addTestsSchema = z.object({
  name: z.string({ message: "test name must be present" }),
  price: z
    .number({ message: "price must be a number" })
    .gte(0, { message: "price cannot be negative" }),
  diagnosticCenterId: z.number({ message: "invalid center id" }),
});

export const bookTestSchema = z.object({
  testId: z.number({ message: "Invalid test Id" }).int().positive(),
  diagnosticCenterId: z
    .number({ message: "Invalid center Id" })
    .int()
    .positive(),
  appointmentTime: z.coerce.date({ message: "Invalid apointment time" }),
});

export const cancelBookingSchema = z.object({
  bookingId: z.coerce
    .number()
    .int({ message: "invalid booking id" })
    .gt(0, { message: "invalid booking id" }),
});

export const initiatePaymentSchema = z.object({
  bookingId: z
    .number({ message: "booking Id  should be a number" })
    .int({ message: "booking Id should be an integer" })
    .positive({ message: "booking Id should be a positive number" }),
});

export const paymentIdSchema = z.object({
  paymentId: z.coerce.number().int().positive(),
});

export const bookingIdSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
});

export const webhookSchema = z.object({
  eventId: z.string().min(1),
  paymentId: z.number().int().positive(),
  status: z.enum(["SUCCESS", "FAILED"]),
});
