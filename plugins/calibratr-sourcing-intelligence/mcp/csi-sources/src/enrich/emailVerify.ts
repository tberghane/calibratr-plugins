/**
 * Email verification — syntax + MX-record check (free, no third-party key). For deliverability
 * grading beyond MX, set REACHER_URL (self-hosted) or ZEROBOUNCE_API_KEY and we escalate.
 *
 * Returns a deliverability verdict; never invents an address.
 */
import dns from "node:dns/promises";
import { getJson } from "../http.js";

export type EmailVerdict = "valid" | "risky" | "invalid" | "unknown";

export interface EmailCheck {
  email: string;
  verdict: EmailVerdict;
  reason: string;
  has_mx: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function verifyEmail(email: string): Promise<EmailCheck> {
  const addr = email.trim().toLowerCase();
  if (!EMAIL_RE.test(addr)) {
    return { email: addr, verdict: "invalid", reason: "Malformed syntax", has_mx: false };
  }
  const domain = addr.split("@")[1];

  let hasMx = false;
  try {
    const mx = await dns.resolveMx(domain);
    hasMx = mx.length > 0;
  } catch {
    hasMx = false;
  }
  if (!hasMx) {
    return { email: addr, verdict: "invalid", reason: `No MX records for ${domain}`, has_mx: false };
  }

  // Optional deliverability escalation.
  const reacher = process.env.REACHER_URL;
  const zb = process.env.ZEROBOUNCE_API_KEY;
  try {
    if (reacher) {
      const res = await getJson<{ is_reachable?: string }>(`${reacher}/v0/check_email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_email: addr }),
      } as never);
      const r = res.is_reachable;
      const verdict: EmailVerdict = r === "safe" ? "valid" : r === "risky" ? "risky" : r === "invalid" ? "invalid" : "unknown";
      return { email: addr, verdict, reason: `Reacher: ${r ?? "unknown"}`, has_mx: true };
    }
    if (zb) {
      const res = await getJson<{ status?: string }>(
        `https://api.zerobounce.net/v2/validate?api_key=${zb}&email=${encodeURIComponent(addr)}`,
      );
      const s = res.status;
      const verdict: EmailVerdict =
        s === "valid" ? "valid" : s === "catch-all" || s === "unknown" ? "risky" : "invalid";
      return { email: addr, verdict, reason: `ZeroBounce: ${s ?? "unknown"}`, has_mx: true };
    }
  } catch {
    /* fall through to MX-only verdict */
  }

  return { email: addr, verdict: "risky", reason: "Valid syntax + MX present (no deliverability provider configured)", has_mx: true };
}
