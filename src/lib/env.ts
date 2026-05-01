import "dotenv/config";
import { z } from "zod";

const emptyToUndefined = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().optional()
);

const optionalEmail = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().email().optional()
);

const Env = z.object({
  DATABASE_URL: z.string().min(1),
  GROQ_API_KEY: emptyToUndefined,
  TAVILY_API_KEY: emptyToUndefined,
  FIRECRAWL_API_KEY: emptyToUndefined,
  JINA_API_KEY: emptyToUndefined,
  HUNTER_API_KEY: emptyToUndefined,
  BREVO_API_KEY: emptyToUndefined,
  FROM_EMAIL: optionalEmail,
  APP_URL: z.string().url().default("http://localhost:3000"),
  TRACKING_SECRET: z.string().min(8).default("dev-tracking-secret-change-me"),
});

export const env = Env.parse(process.env);
