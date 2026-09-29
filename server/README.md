# Diagnostic Booking API

TypeScript, Express, PostgreSQL, and Drizzle ORM backend for diagnostic-centre bookings with a simulated payment provider.

## Run locally

Create a PostgreSQL database, set `DATABASE_URL`, `JWT_SECRET`, and `WEBHOOK_SECRET`, then run:

```bash
npm install
npm run build
npm run dev
```

The API listens on port `5000` by default. The fake provider uses a hardcoded 2-second delay, an 80/20 random success/failure outcome, and one webhook delivery per payment. It uses these environment variables for connection and authentication:

```env
APP_BASE_URL=http://localhost:5000
WEBHOOK_SECRET=change-me
```

Provider delivery retries reuse the same event ID.

## Payment flow

```text
POST /api/v1/bookings -> PENDING booking; amount comes from the database test price
POST /api/v1/payments -> PENDING payment; fake provider starts asynchronously
POST /api/v1/payments/webhook -> payment and booking transition in one transaction
```

## API examples

Authenticated routes use the JWT cookie set by login.

```bash
curl -X POST http://localhost:5000/api/v1/bookings ^
	-H "Content-Type: application/json" ^
	-H "Cookie: token=YOUR_JWT" ^
	-d '{"testId":1,"diagnosticCenterId":1,"apointmentTime":"2026-10-01T10:00:00.000Z"}'
```

The payment amount is deliberately not accepted from the client:

```bash
curl -X POST http://localhost:5000/api/v1/payments ^
	-H "Content-Type: application/json" ^
	-H "Cookie: token=YOUR_JWT" ^
	-d '{"bookingId":1}'
```

```bash
curl -X POST http://localhost:5000/api/v1/payments/webhook ^
	-H "Content-Type: application/json" ^
	-H "X-Webhook-Secret: change-me" ^
	-d '{"eventId":"evt_manual_1","paymentId":1,"status":"SUCCESS"}'
```

Supporting routes are `GET /api/v1/bookings/:id`, `PATCH /api/v1/bookings/:id/cancel`, and `GET /api/v1/payments/:id`.

## Data and state rules

Bookings reference a user, test, diagnostic centre, appointment time, and a price snapshot from the test. Payments reference bookings and have `PENDING`, `SUCCESS`, or `FAILED` states. Bookings have `PENDING`, `CONFIRMED`, `FAILED`, or `CANCELLED` states.

Payment creation locks the booking row, scopes it to the authenticated owner, and reuses an existing pending payment. Webhooks lock payment and booking rows in one transaction. The unique `providerEventId`, final-state check, and `PENDING`-only state transition make repeated and concurrent webhook deliveries harmless.

Invalid IDs and non-owner resources return 404 without revealing whether another user's resource exists. Confirmed-booking cancellation and refunds are outside this assignment.

## What I would improve next

- Replace the shared webhook secret with HMAC signature and timestamp verification.
- Move provider delivery and retry handling to a durable background queue.
- Expire stale pending bookings and add refunds for confirmed bookings.
- Add a dedicated integration-test database and CI coverage for concurrent webhook delivery.
