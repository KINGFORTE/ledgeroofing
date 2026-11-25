import { createClient } from 'redis';
import { RedisStore } from 'rate-limit-redis';
import { rateLimit } from 'express-rate-limit';
import { config } from './config.js';

let client = null;
if (config.redisUrl) {
  const candidate = createClient({ url: config.redisUrl });
  candidate.on('error', (error) => console.error('Redis rate-limit error:', error.message));
  try {
    await candidate.connect();
    client = candidate;
  } catch (error) {
    console.error('Redis unavailable; using in-memory rate limits:', error.message);
  }
}

export const usingRedisRateLimits = Boolean(client);

export function createLimiter(name, options = {}) {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
    ...(client ? { store: new RedisStore({ sendCommand: (...args) => client.sendCommand(args), prefix: `ledge:rl:${name}:` }) } : {}),
  });
}
