import { z } from "zod";

const requiredString = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().min(1, "This environment variable is required")
);

const emptyToUndefined = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().optional()
);

const optionalEmail = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().email().optional()
);

const Env = z.object({
  DATABASE_URL: requiredString,
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

const envVars = {
  DATABASE_URL: process.env.DATABASE_URL,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  TAVILY_API_KEY: process.env.TAVILY_API_KEY,
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
  JINA_API_KEY: process.env.JINA_API_KEY,
  HUNTER_API_KEY: process.env.HUNTER_API_KEY,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  FROM_EMAIL: process.env.FROM_EMAIL,
  APP_URL: process.env.APP_URL,
  TRACKING_SECRET: process.env.TRACKING_SECRET,
};

export const env = Env.parse(envVars);
