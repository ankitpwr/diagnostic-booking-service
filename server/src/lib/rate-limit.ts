import { redisClient } from "./redis";

export class RateLimit {
  maxRequests: number;
  windowSize: number;
  key: string;

  constructor(maxRequest: number, windowSize: number, userId: string) {
    this.maxRequests = maxRequest;
    this.windowSize = windowSize;
    this.key = `rate-limit:userId:${userId}`;
  }

  async checkLimit() {
    const currentTime = Date.now();
    const startTime = currentTime - this.windowSize;

    const script = `
    local key= KEYS[1]
    local maxRequests= tonumber(ARGV[1])
    local windowSize=  tonumber(ARGV[2])
    local startTime= tonumber(ARGV[3])
    local currentTime= tonumber(ARGV[4])

    redis.call('ZREMRANGEBYSCORE', key, 0, startTime)
    local previousRequests= redis.call('ZCARD', key)

    local allowed=0;
    local remainingRequests= 0;

    if previousRequests < maxRequests then
       allowed=1
       remainingRequests= maxRequests-previousRequests-1
       redis.call('ZADD', key, currentTime, currentTime .. '-' .. math.random())
       redis.call('PEXPIRE', key, windowSize)
    end

    return {allowed, remainingRequests}
    `;

    const [allowed, remainingRequests] = (await redisClient.eval(
      script,
      1,
      this.key,
      this.maxRequests,
      this.windowSize,
      startTime,
      currentTime,
    )) as [number, number];

    return { allowed: allowed === 1, remainingRequests };
  }
}
