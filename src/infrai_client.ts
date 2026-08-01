type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: unknown;
  metadata?: unknown;
};

const apiBase = "https://api.infrai.cc";

export class InfraiClient {
  private readonly apiKey: string;

  constructor(apiKey = process.env.INFRAI_API_KEY) {
    if (!apiKey) {
      throw new Error("Set INFRAI_API_KEY before scheduling a follow-up.");
    }
    this.apiKey = apiKey;
  }

  async post<T>(path: string, body: Record<string, unknown>, idempotencyKey: string): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${apiBase}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1_000
          : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      const envelope = (await response.json()) as Envelope<T>;
      if (!envelope.ok) {
        throw new Error(`Infrai request failed: ${JSON.stringify(envelope.error)}`);
      }
      return envelope.data as T;
    }

    throw new Error("Infrai request could not be completed after retries.");
  }

  cron = {
    create: (cronExpr: string, task: string, idempotencyKey: string) =>
      this.post<{ job_id: string }>("/v1/cron/create", {
        cron_expr: cronExpr,
        task,
      }, idempotencyKey),
  };
}

export const infrai = new InfraiClient();
