import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { authRouter } from "./routers/auth.router";
import { diagnosticCenterRouter } from "./routers/diagnosticCenter.router";
import { bookingRouter } from "./routers/booking.router";
import { paymentsRouter } from "./routers/payments.router";
import { testRouter } from "./routers/tests.router";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/diagnostic-centers", diagnosticCenterRouter);
app.use("/api/v1/tests", testRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/payments", paymentsRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
