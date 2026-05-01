import crypto from "node:crypto";
import { env } from "./env";

export function sign(payload: string): string {
  const sig = crypto
    .createHmac("sha256", env.TRACKING_SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 16);
  return `${payload}.${sig}`;
}

export function verify(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const payload = signed.slice(0, idx);
  const expected = sign(payload);
  if (expected.length !== signed.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signed.charCodeAt(i);
  }
  return diff === 0 ? payload : null;
}
