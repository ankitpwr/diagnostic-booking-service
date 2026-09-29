import Redis from "ioredis";

const HOST = "alpine-redis";

export const redisClient = new Redis({
  host: HOST,
  port: 6379,
  maxRetriesPerRequest: null,
});

export async function clearDiagnosticCentersCache() {
  let cursor = "0";

  do {
    const [nextCursor, keys] = await redisClient.scan(
      cursor,
      "MATCH",
      "diagnostic-centers-*",
      "COUNT",
      100,
    );

    if (keys.length > 0) {
      await redisClient.unlink(...keys);
    }

    cursor = nextCursor;
  } while (cursor !== "0");
}
