import { AgentMailClient } from "agentmail";
import { render } from "@react-email/render";
import { EmailTemplate } from "../../components/ui/email-templates";

const agentmail = new AgentMailClient({
  apiKey: process.env.AGENTMAIL_API_KEY!,
});

const INBOX_ID = process.env.AGENTMAIL_INBOX_ID!;

/**
 * Send a welcome email via AgentMail.
 * Called directly (outside the queue) if you need a one-shot send.
 * For production flow the BullMQ worker in email.worker.ts is used instead.
 */
export async function sendWelcomeEmail(to: string, firstName: string) {
  const html = await render(EmailTemplate({ firstName }));

  await agentmail.inboxes.messages.send(INBOX_ID, {
    to,
    subject: "Welcome to Fatoura",
    html,
  });
}