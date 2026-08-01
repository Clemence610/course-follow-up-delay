import { infrai } from "./infrai_client.ts";

function cronAt(date: Date): string {
  return `${date.getUTCMinutes()} ${date.getUTCHours()} ${date.getUTCDate()} ${date.getUTCMonth() + 1} *`;
}

async function scheduleLearnerFollowUp(): Promise<void> {
  const hours = Number(process.env.FOLLOW_UP_DELAY_HOURS ?? "6");
  const task = process.env.FOLLOW_UP_WEBHOOK_URL;
  const learnerId = process.env.LEARNER_ID ?? "learner-42";

  if (!Number.isFinite(hours) || hours <= 0) {
    throw new Error("FOLLOW_UP_DELAY_HOURS must be a positive number.");
  }
  if (!task) {
    throw new Error("Set FOLLOW_UP_WEBHOOK_URL to the follow-up endpoint.");
  }

  const scheduledFor = new Date(Date.now() + hours * 60 * 60 * 1_000);
  const idempotencyKey = `course-follow-up-${learnerId}-${scheduledFor.toISOString()}`;
  const job = await infrai.cron.create(cronAt(scheduledFor), task, idempotencyKey);

  console.log(`Follow-up for ${learnerId} is scheduled for ${scheduledFor.toISOString()}.`);
  console.log(`Cron job: ${job.job_id}`);
}

await scheduleLearnerFollowUp();
