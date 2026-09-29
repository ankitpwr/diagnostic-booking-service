import { setTimeout as delay } from "node:timers/promises";
import axios from "axios";

const PROVIDER_DELAY_MS = 2000;
const PROVIDER_OUTCOME = "RANDOM" as const;
const SEND_DUPLICATE_EVENTS = false;

export async function simulatePayment(paymentId: number) {
  await delay(PROVIDER_DELAY_MS);
  const status = Math.random() < 0.9 ? "SUCCESS" : "FAILED";
  const eventId = `evt_${crypto.randomUUID()}`;
  const baseUrl =
    process.env.APP_BASE_URL ??
    `http://localhost:${process.env.PORT ?? "5000"}`;
  const repeats = SEND_DUPLICATE_EVENTS ? 3 : 1;
  for (let attempt = 0; attempt < repeats; attempt += 1) {
    let delivered = false;
    for (let retry = 0; retry < 3 && !delivered; retry += 1) {
      try {
        await axios.post(
          `${baseUrl}/api/v1/payments/webhook`,
          { eventId, paymentId, status },
          { headers: { "X-Webhook-Secret": process.env.WEBHOOK_SECRET ?? "" } },
        );
        delivered = true;
      } catch (error) {
        if (retry === 2) {
          console.error("failed to deliver payment webhook", error);
        }
        await delay(100 * 2 ** retry);
      }
    }
  }
}
