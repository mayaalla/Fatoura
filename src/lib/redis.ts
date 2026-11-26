import IORedis, { type RedisOptions } from "ioredis";

export function createRedisConnection(options: RedisOptions = {}) {
  const url = process.env.DOCKER_REDIS_URL;
  if (!url) throw new Error("DOCKER_REDIS_URL is missing");
  return new IORedis(url, options);
}

