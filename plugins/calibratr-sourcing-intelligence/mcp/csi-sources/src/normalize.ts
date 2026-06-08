/**
 * Cross-source dedup + merge. Two candidates are the same person if they share any strong key:
 * normalized_email, github_username, linkedin_slug, or (verbatim) source_url. When merged we union
 * work_samples / skills / emails / links and merge signal_data, preserving the richest fields.
 */
import { NormalizedCandidate, normalizeEmail } from "./schema.js";

function strongKeys(c: NormalizedCandidate): string[] {
  const keys: string[] = [];
  const email = c.normalized_email ?? normalizeEmail(c.emails.find((e) => e.is_primary)?.value ?? c.emails[0]?.value);
  if (email) keys.push(`email:${email}`);
  if (c.github_username) keys.push(`gh:${c.github_username.toLowerCase()}`);
  if (c.linkedin_slug) keys.push(`li:${c.linkedin_slug.toLowerCase()}`);
  if (c.source_url) keys.push(`url:${c.source_url.toLowerCase()}`);
  return keys;
}

function uniqBy<T>(arr: T[], keyFn: (t: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const k = keyFn(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

function merge(a: NormalizedCandidate, b: NormalizedCandidate): NormalizedCandidate {
  return {
    ...a,
    full_name: a.full_name.length >= b.full_name.length ? a.full_name : b.full_name,
    headline: a.headline ?? b.headline,
    current_company: a.current_company ?? b.current_company,
    current_title: a.current_title ?? b.current_title,
    location: a.location ?? b.location,
    avatar_url: a.avatar_url ?? b.avatar_url,
    emails: uniqBy([...a.emails, ...b.emails], (e) => e.value.toLowerCase()),
    github_url: a.github_url ?? b.github_url,
    linkedin_url: a.linkedin_url ?? b.linkedin_url,
    twitter_url: a.twitter_url ?? b.twitter_url,
    website_url: a.website_url ?? b.website_url,
    portfolio_url: a.portfolio_url ?? b.portfolio_url,
    other_urls: uniqBy([...a.other_urls, ...b.other_urls], (u) => u.url.toLowerCase()),
    skills: Array.from(new Set([...a.skills, ...b.skills])),
    tags: Array.from(new Set([...a.tags, ...b.tags, `merged:${b.source_platform}`])),
    work_samples: uniqBy([...a.work_samples, ...b.work_samples], (w) => w.url.toLowerCase()),
    signal_data: { ...b.signal_data, ...a.signal_data },
    github_username: a.github_username ?? b.github_username,
    linkedin_slug: a.linkedin_slug ?? b.linkedin_slug,
    normalized_email: a.normalized_email ?? b.normalized_email,
  };
}

export function dedupeCandidates(candidates: NormalizedCandidate[]): NormalizedCandidate[] {
  const keyToIndex = new Map<string, number>();
  const result: NormalizedCandidate[] = [];

  for (const raw of candidates) {
    const c: NormalizedCandidate = {
      ...raw,
      normalized_email:
        raw.normalized_email ??
        normalizeEmail(raw.emails.find((e) => e.is_primary)?.value ?? raw.emails[0]?.value),
    };
    const keys = strongKeys(c);
    const existingIdx = keys.map((k) => keyToIndex.get(k)).find((i) => i !== undefined);

    if (existingIdx !== undefined) {
      result[existingIdx] = merge(result[existingIdx], c);
      strongKeys(result[existingIdx]).forEach((k) => keyToIndex.set(k, existingIdx));
    } else {
      const idx = result.push(c) - 1;
      keys.forEach((k) => keyToIndex.set(k, idx));
    }
  }
  return result;
}

/** Rank by work-sample density (evidence-first), then by aggregate signal strength. */
export function rankByEvidence(candidates: NormalizedCandidate[]): NormalizedCandidate[] {
  const signalStrength = (c: NormalizedCandidate): number => {
    const s = c.signal_data;
    return (
      Number(s.github_total_stars ?? 0) +
      Number(s.github_followers ?? 0) +
      Number(s.hf_total_downloads ?? 0) / 100 +
      Number(s.so_reputation ?? 0) / 10 +
      Number(s.arxiv_papers ?? 0) * 50 +
      Number(s.ph_products_made ?? 0) * 30
    );
  };
  return [...candidates].sort((a, b) => {
    if (b.work_samples.length !== a.work_samples.length) return b.work_samples.length - a.work_samples.length;
    return signalStrength(b) - signalStrength(a);
  });
}
