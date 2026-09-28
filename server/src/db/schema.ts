import {
  integer,
  pgTable,
  varchar,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN"]);
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  role: userRoleEnum().default("USER").notNull(),
  password: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const diagnosticCenterTable = pgTable("diagnostic_center_table", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  location: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const testsTable = pgTable("tests", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  price: integer().notNull(),
  diagnosticCenterId: integer("diagnostic_center_id")
    .notNull()
    .references(() => diagnosticCenterTable.id, { onDelete: "cascade" }),
});

export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "CONFIRMED",
  "FAILED",
  "CANCELLED",
]);

export const bookingsTable = pgTable("bookings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  testId: integer("test_id")
    .notNull()
    .references(() => testsTable.id, { onDelete: "restrict" }),

  diagnosticCenterId: integer("diagnostic_center_id")
    .notNull()
    .references(() => diagnosticCenterTable.id, { onDelete: "restrict" }),

  appointmentAt: timestamp().notNull(),
  amount: integer().notNull(),

  bookingStatus: bookingStatusEnum().default("PENDING").notNull(),

  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "SUCCESS",
  "FAILED",
]);

export const paymentsTable = pgTable("payments", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookingsTable.id, { onDelete: "restrict" }),

  amount: integer().notNull(),
  status: paymentStatusEnum().default("PENDING").notNull(),
  providerEventId: varchar("provider_event_id", { length: 255 }).unique(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});
