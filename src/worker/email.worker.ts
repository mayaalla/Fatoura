import { Worker } from "bullmq";
import { AgentMailClient } from "agentmail";
import { render } from "@react-email/render";
import { EmailTemplate } from "../components/ui/email-templates";
import { createRedisConnection } from "../lib/redis";
import type { EmailJobData } from "../server/queue/queues";

const agentmail = new AgentMailClient({
  apiKey: process.env.AGENTMAIL_API_KEY!,
});

// The inbox that sends welcome emails (created once, reused forever).
// Set AGENTMAIL_INBOX_ID in your .env — e.g. noisystory259@agentmail.to
const INBOX_ID = process.env.AGENTMAIL_INBOX_ID!;

const worker = new Worker<EmailJobData>(
  "email",
  async (job) => {
    // Render the React email template to an HTML string
    const html = await render(EmailTemplate({ firstName: job.data.name }));

    await agentmail.inboxes.messages.send(INBOX_ID, {
      to: job.data.email,
      subject: "Welcome to Fatoura",
      html,
    });
  },
  {
    connection: createRedisConnection({ maxRetriesPerRequest: null }),
    // AgentMail free tier: 100 emails/day — keep bursts safe
    limiter: { max: 5, duration: 1000 },
  }
);

worker.on("completed", (job) => console.log(`Job ${job.id} completed`));
worker.on("failed", (job, err) => console.log(`Job ${job?.id} failed: ${err.message}`));
worker.on("error", (err) => console.error(err));

console.log("Email worker is running...");