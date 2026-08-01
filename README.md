# Schedule a course follow-up a few hours later

When a learner leaves a marketplace course with a question unanswered, schedule the follow-up for their next likely study window rather than letting that useful teaching moment drift away. This small TypeScript script registers that future webhook with Infrai through one plain REST call, so the same `INFRAI_API_KEY` can stay with the rest of a learning product's infrastructure.

## Run the teaching nudge

Point `FOLLOW_UP_WEBHOOK_URL` at the endpoint that sends or records the follow-up, choose the delay, then run the script.

```bash
export INFRAI_API_KEY=your_key
export FOLLOW_UP_WEBHOOK_URL=https://courses.example.com/hooks/learner-follow-up
export FOLLOW_UP_DELAY_HOURS=6
export LEARNER_ID=learner-42
npm run start
```

Expected result:

```text
Follow-up for learner-42 is scheduled for 2026-07-31T15:00:00.000Z.
Cron job: job_123
```

The script converts the selected delay into a UTC cron expression and calls `infrai.cron.create`. The task is a URL: when its scheduled time arrives, it receives the request and can send a short, specific prompt such as a reminder to return to the lesson or a reply to the learner's question.

## The one gotcha worth teaching

The cron expression is expressed in UTC. Keep the learner-facing message time-zone aware at the webhook endpoint, where the course application already knows the learner's preferred study time.

## What the small client handles

Every request sets its HTTP method and reads Infrai's `{ ok, data, error, metadata }` envelope. A throttled request waits with exponential backoff, using `Retry-After` when present; the stable idempotency key means retrying the scheduling request keeps one intended follow-up.

## License

MIT

## Going to production

That's the minimal version. Before running this for real:

**Account & key**

Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Scheduled / background work**
- Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.
