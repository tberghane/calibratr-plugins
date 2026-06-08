/**
 * Unified candidate schema for Calibratr Sourcing Intelligence.
 *
 * Ported and adapted from multi-tenant-sourcing-concept's CandidateProfile, with a
 * first-class `work_samples` array added (the evidence-first differentiator) and the
 * persistence/tenant fields stripped (this MCP server is stateless).
 *
 * URL INTEGRITY INVARIANT: every URL field here must be a verbatim URL returned by a
 * source API. Source modules must NEVER construct or infer a profile URL (especially
 * LinkedIn) from a name, title, or company. Absent → leave the field undefined.
 */
import { z } from "zod";

export const sourcePlatforms = [
  "github",
  "hacker_news",
  "arxiv",
  "huggingface",
  "stackoverflow",
  "product_hunt",
  "semantic_scholar",
  "exa",
  "linkedin",
  "twitter",
  "manual",
] as const;

export type SourcePlatform = (typeof sourcePlatforms)[number];

/** Source platforms this MCP server can actively search (free, no-key or free-key). */
export const searchableSourcePlatforms = [
  "github",
  "hacker_news",
  "arxiv",
  "huggingface",
  "stackoverflow",
  "product_hunt",
] as const;

export type SearchablePlatform = (typeof searchableSourcePlatforms)[number];

/** A concrete piece of proof-of-work tied to a verbatim URL. */
export const WorkSampleSchema = z
  .object({
    type: z
      .string()
      .describe("Kind of artifact: 'repo' | 'paper' | 'answer' | 'launch' | 'model' | 'dataset' | 'post' | 'talk'"),
    title: z.string().describe("Human-readable title of the artifact"),
    url: z.string().url().describe("Verbatim URL to the artifact (never constructed)"),
    signal: z
      .string()
      .optional()
      .describe("One-line quantified signal, e.g. '4.2k stars, primary lang Rust' or '312 citations'"),
  })
  .strict();
export type WorkSample = z.infer<typeof WorkSampleSchema>;

export const EmailSchema = z
  .object({
    value: z.string(),
    type: z.enum(["personal", "work", "other"]).default("other"),
    is_primary: z.boolean().default(false),
  })
  .strict();

export const OtherUrlSchema = z
  .object({
    url: z.string().url(),
    type: z.string(),
    label: z.string().optional(),
  })
  .strict();

/**
 * NormalizedCandidate — what every source module returns and what the scoring/normalize
 * tools consume. Kept permissive (.passthrough on signal_data/raw_data) so new sources
 * can attach arbitrary signals without a schema change.
 */
export const NormalizedCandidateSchema = z
  .object({
    full_name: z.string().describe("Best available display name"),
    headline: z.string().optional().describe("Short bio / current role line"),
    current_company: z.string().optional(),
    current_title: z.string().optional(),
    location: z.string().optional(),
    avatar_url: z.string().url().optional(),

    emails: z.array(EmailSchema).default([]),

    // Professional links — ALL verbatim, never constructed.
    github_url: z.string().url().optional(),
    linkedin_url: z.string().url().optional().describe("ONLY if returned verbatim by a source"),
    twitter_url: z.string().url().optional(),
    website_url: z.string().url().optional(),
    portfolio_url: z.string().url().optional(),
    other_urls: z.array(OtherUrlSchema).default([]),

    skills: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),

    source_platform: z.enum(sourcePlatforms),
    source_url: z.string().url().optional().describe("Verbatim URL of the profile/result on the source platform"),
    sourced_at: z.string().describe("ISO 8601 timestamp"),

    work_samples: z.array(WorkSampleSchema).default([]),

    signal_data: z.record(z.unknown()).default({}),

    // Dedup keys.
    github_username: z.string().optional(),
    linkedin_slug: z.string().optional(),
    normalized_email: z.string().optional(),

    raw_data: z.record(z.unknown()).optional(),
  })
  .strict();

export type NormalizedCandidate = z.infer<typeof NormalizedCandidateSchema>;

/** Parameters every source module's search() receives. */
export interface SourceSearchParams {
  query: string;
  maxResults: number;
}

/** Standard interface every source module implements (mirrors the original SourceModule). */
export interface SourceModule {
  id: SearchablePlatform;
  name: string;
  description: string;
  search(params: SourceSearchParams): Promise<NormalizedCandidate[]>;
}

/** Helper: normalize an email for dedup. */
export function normalizeEmail(email?: string): string | undefined {
  if (!email) return undefined;
  const trimmed = email.trim().toLowerCase();
  return trimmed.includes("@") ? trimmed : undefined;
}
