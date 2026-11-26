import { Queue } from "bullmq";
import { createRedisConnection } from "../../lib/redis";

export type EmailJobData = { email: string; name: string };

const globalForQueue = globalThis as unknown as {
  emailQueue?: Queue<EmailJobData>;
};

export const emailQueue =
  globalForQueue.emailQueue ??
  new Queue<EmailJobData>("email", {
    connection: createRedisConnection({ maxRetriesPerRequest: 1 }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.emailQueue = emailQueue;
}