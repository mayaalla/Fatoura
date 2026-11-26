import { NextResponse } from "next/server";
import { emailQueue } from "../../../server/queue/queues";

export async function POST(request: Request) {
  const { email, name } = await request.json();

  if (!email || !name) {
    return NextResponse.json({ error: "email and name are required" }, { status: 400 });
  }

  const job = await emailQueue.add(
    "welcome-email",
    { email, name },
    { attempts: 3, backoff: { type: "exponential", delay: 2000 } }
  );

  return NextResponse.json({ message: "Job added", jobId: job.id }, { status: 202 });
}