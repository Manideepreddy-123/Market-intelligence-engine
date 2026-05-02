import Groq from "groq-sdk";
import { z } from "zod";
import { env } from "@/lib/env";

let _client: Groq | null = null;
function client(): Groq {
  if (!env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY: This feature requires Groq for LLM generation. Please configure it in Vercel.");
  if (!_client) _client = new Groq({ apiKey: env.GROQ_API_KEY });
  return _client;
}

export const REPORT_MODEL = "llama-3.3-70b-versatile";

function zodToPromptSchema(s: z.ZodTypeAny): Record<string, unknown> {
  const def = (s as { _def: { typeName: string } })._def;
  const t = def.typeName;
  if (t === "ZodObject") {
    const shape = (s as unknown as z.ZodObject<z.ZodRawShape>).shape;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [k, v] of Object.entries(shape)) {
      properties[k] = zodToPromptSchema(v as z.ZodTypeAny);
      if (!(v instanceof z.ZodOptional)) required.push(k);
    }
    return { type: "object", properties, required };
  }
  if (t === "ZodArray") {
    return {
      type: "array",
      items: zodToPromptSchema(
        (s as unknown as z.ZodArray<z.ZodTypeAny>).element
      ),
    };
  }
  if (t === "ZodString") return { type: "string" };
  if (t === "ZodNumber") return { type: "number" };
  if (t === "ZodBoolean") return { type: "boolean" };
  if (t === "ZodEnum") {
    return {
      type: "string",
      enum: (s as z.ZodEnum<[string, ...string[]]>).options,
    };
  }
  if (t === "ZodNullable") {
    const inner = zodToPromptSchema(
      (s as unknown as z.ZodNullable<z.ZodTypeAny>).unwrap()
    );
    return { ...inner, nullable: true };
  }
  if (t === "ZodOptional") {
    return zodToPromptSchema(
      (s as unknown as z.ZodOptional<z.ZodTypeAny>).unwrap()
    );
  }
  return {};
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const m = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return m && m[1] ? m[1] : trimmed;
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function classifyError(err: unknown): {
  nonRetryable: boolean;
  reason: string;
} {
  const e = err as { status?: number; message?: string };
  const status = e?.status;
  const msg = e?.message ?? "";
  if (status === 413 || /too large|context_length/i.test(msg)) {
    return {
      nonRetryable: true,
      reason: "request too large for the model's per-minute limit — shrink input or reduce max_tokens",
    };
  }
  if (status === 429 || /rate[_ ]?limit/i.test(msg)) {
    return {
      nonRetryable: true,
      reason: "Groq rate limit exceeded — wait ~60s and retry",
    };
  }
  if (status === 403 || /access denied/i.test(msg)) {
    return {
      nonRetryable: true,
      reason: "Groq access denied — likely a geo-block or Cloudflare rule on this network",
    };
  }
  if (status === 401) {
    return {
      nonRetryable: true,
      reason: "Groq auth failed — check GROQ_API_KEY",
    };
  }
  return { nonRetryable: false, reason: "" };
}

export async function generateStructured<T extends z.ZodTypeAny>(opts: {
  schema: T;
  system: string;
  user: string;
  modelName?: string;
  maxTokens?: number;
  retries?: number;
  temperature?: number;
}): Promise<z.infer<T>> {
  const schemaJson = zodToPromptSchema(opts.schema);
  const fullSystem = `${opts.system}

Your response MUST be a valid JSON object matching this exact JSON Schema:
${JSON.stringify(schemaJson, null, 2)}

Return ONLY the JSON object. No prose, no markdown fences, no preamble.`;

  const retries = opts.retries ?? 2;
  const messages: ChatMessage[] = [
    { role: "system", content: fullSystem },
    { role: "user", content: opts.user },
  ];

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    let text = "";
    try {
      const res = await client().chat.completions.create({
        model: opts.modelName ?? REPORT_MODEL,
        messages,
        response_format: { type: "json_object" },
        max_tokens: opts.maxTokens ?? 8000,
        temperature: opts.temperature ?? 0.3,
      });
      text = res.choices[0]?.message?.content ?? "";
      const json = JSON.parse(stripCodeFence(text));
      return opts.schema.parse(json);
    } catch (err) {
      lastErr = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      const { nonRetryable, reason } = classifyError(err);
      if (nonRetryable) {
        console.warn(`[groq] non-retryable error: ${reason} — ${errMsg}`);
        throw new Error(`Groq: ${reason}`);
      }
      console.warn(
        `[groq] attempt ${attempt + 1}/${retries + 1} failed: ${errMsg}`
      );
      if (attempt < retries) {
        messages.push({ role: "assistant", content: text });
        messages.push({
          role: "user",
          content: `Your previous response did not validate against the schema. Error: ${errMsg}\n\nReturn a corrected JSON object matching the schema EXACTLY. JSON only.`,
        });
      }
    }
  }
  throw new Error(
    `Groq failed schema validation after ${retries + 1} attempts: ${lastErr instanceof Error ? lastErr.message : lastErr}`
  );
}
