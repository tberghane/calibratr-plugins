#!/usr/bin/env node
/**
 * csi-sources — Calibratr Sourcing Intelligence MCP server.
 *
 * Exposes the free "proof-of-work" candidate sources that have no first-class MCP equivalent
 * (GitHub, Hacker News, arXiv, Hugging Face, Stack Overflow, Product Hunt) plus Semantic Scholar
 * enrichment, email verification, cross-source normalization, and deterministic scoring/calibration.
 *
 * INVARIANT: every URL this server returns is verbatim from a source API. It never constructs or
 * infers a profile URL (especially LinkedIn). For LinkedIn/contact lookups, the plugin's skills
 * use the host's existing MCP tools (Wrangle, Apollo/growth, ContactOut, Exa) — not this server.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { CHARACTER_LIMIT } from "./constants.js";
import { mapLimit } from "./http.js";
import {
  NormalizedCandidate,
  NormalizedCandidateSchema,
  SourceModule,
  searchableSourcePlatforms,
} from "./schema.js";
import { dedupeCandidates, rankByEvidence } from "./normalize.js";
import {
  ScoreWeightsSchema,
  DimensionScoreSchema,
  computeComposite,
  calibrateWeights,
  Verdict,
} from "./score.js";

import { githubSource, buildGithubCandidate } from "./sources/github.js";
import { hackerNewsSource } from "./sources/hackerNews.js";
import { arxivSource } from "./sources/arxiv.js";
import { huggingfaceSource } from "./sources/huggingface.js";
import { stackoverflowSource } from "./sources/stackoverflow.js";
import { productHuntSource } from "./sources/productHunt.js";
import { enrichSemanticScholar } from "./enrich/semanticScholar.js";
import { verifyEmail } from "./enrich/emailVerify.js";

const SOURCES: Record<string, SourceModule> = {
  github: githubSource,
  hacker_news: hackerNewsSource,
  arxiv: arxivSource,
  huggingface: huggingfaceSource,
  stackoverflow: stackoverflowSource,
  product_hunt: productHuntSource,
};

const server = new McpServer({ name: "csi-sources-mcp-server", version: "0.1.0" });

function jsonResult(output: unknown): {
  content: { type: "text"; text: string }[];
  structuredContent: Record<string, unknown>;
} {
  let text = JSON.stringify(output, null, 2);
  let payload = output as Record<string, unknown>;
  if (text.length > CHARACTER_LIMIT && payload && Array.isArray((payload as { candidates?: unknown[] }).candidates)) {
    const cands = (payload as { candidates: unknown[] }).candidates;
    const half = Math.max(1, Math.floor(cands.length / 2));
    payload = {
      ...payload,
      candidates: cands.slice(0, half),
      truncated: true,
      truncation_message: `Response truncated from ${cands.length} to ${half} candidates (exceeded ${CHARACTER_LIMIT} chars). Lower max_results or narrow the query.`,
    };
    text = JSON.stringify(payload, null, 2);
  }
  return { content: [{ type: "text", text }], structuredContent: payload };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool 1: search_sources — multi-source candidate discovery
// ─────────────────────────────────────────────────────────────────────────────
const SearchInput = z
  .object({
    query: z
      .string()
      .min(2)
      .max(500)
      .describe(
        "Free-text search. May include source-specific qualifiers, e.g. GitHub 'language:rust location:berlin followers:>500', or plain role/skill terms for other sources.",
      ),
    platforms: z
      .array(z.enum(searchableSourcePlatforms))
      .min(1)
      .describe(
        "Sources to query: github, hacker_news, arxiv, huggingface, stackoverflow, product_hunt. Choose by role: engineering→github/stackoverflow/hacker_news; research/ML→arxiv/huggingface; founders→product_hunt.",
      ),
    max_results: z.number().int().min(1).max(50).default(15).describe("Max candidates per source before dedup."),
  })
  .strict();

server.registerTool(
  "csi_search_sources",
  {
    title: "Search proof-of-work sources",
    description: `Search multiple free proof-of-work platforms for candidates IN PARALLEL, then dedupe across sources and rank by evidence density.

Every returned candidate carries:
  - verbatim source_url and profile links (NEVER constructed — LinkedIn URLs only ever appear if a source literally returned one)
  - a work_samples[] array of concrete artifacts (repos, papers, models, answers, launches) each with a verbatim URL and a quantified signal
  - skills, location (when available), and a signal_data bag

Returns JSON: { query, platforms, count, candidates: NormalizedCandidate[] }.

Use this as the primary discovery step. For LinkedIn/contact enrichment, use the host's Wrangle/Apollo/ContactOut MCP tools — not this server.`,
    inputSchema: SearchInput,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ query, platforms, max_results }) => {
    const settled = await Promise.allSettled(
      platforms.map((p) => SOURCES[p].search({ query, maxResults: max_results })),
    );
    const all: NormalizedCandidate[] = [];
    const errors: Record<string, string> = {};
    settled.forEach((r, i) => {
      if (r.status === "fulfilled") all.push(...r.value);
      else errors[platforms[i]] = r.reason instanceof Error ? r.reason.message : String(r.reason);
    });
    const ranked = rankByEvidence(dedupeCandidates(all));
    return jsonResult({
      query,
      platforms,
      count: ranked.length,
      ...(Object.keys(errors).length ? { source_errors: errors } : {}),
      candidates: ranked,
    });
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Tool 2: get_github_profile — deep single profile
// ─────────────────────────────────────────────────────────────────────────────
server.registerTool(
  "csi_get_github_profile",
  {
    title: "Get GitHub profile + top repos",
    description: `Fetch a full normalized candidate for one GitHub username: profile, language stack, follower/repo/star signals, and the top repos as work_samples (verbatim URLs). Use to deep-dive a known handle or enrich a candidate already discovered elsewhere.

Returns JSON: a single NormalizedCandidate.`,
    inputSchema: z.object({ username: z.string().min(1).max(39).describe("GitHub login/username") }).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ username }) => {
    try {
      return jsonResult(await buildGithubCandidate(username));
    } catch (e) {
      return { content: [{ type: "text", text: `Error: could not fetch GitHub user '${username}': ${e instanceof Error ? e.message : String(e)}` }] };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Tool 3: enrich_candidate — run enrichers against a candidate
// ─────────────────────────────────────────────────────────────────────────────
const EnrichInput = z
  .object({
    candidate: NormalizedCandidateSchema.describe("A candidate (typically from csi_search_sources) to enrich in place."),
    providers: z
      .array(z.enum(["github_deep", "semantic_scholar", "email_verify"]))
      .min(1)
      .describe(
        "github_deep: re-fetch repos/stars for the candidate's github_username. semantic_scholar: citations/h-index/top papers by name (best for arxiv candidates). email_verify: syntax+MX (+ optional Reacher/ZeroBounce) on primary email.",
      ),
  })
  .strict();

server.registerTool(
  "csi_enrich_candidate",
  {
    title: "Enrich a candidate",
    description: `Backfill a candidate with additional verifiable signals from free providers. Merges results into the returned candidate's signal_data and work_samples; never fabricates URLs or contact info.

Returns JSON: { candidate: NormalizedCandidate, enrichment: { ...per-provider results } }.`,
    inputSchema: EnrichInput,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ candidate, providers }) => {
    const c: NormalizedCandidate = { ...candidate };
    const enrichment: Record<string, unknown> = {};

    if (providers.includes("github_deep") && c.github_username) {
      try {
        const gh = await buildGithubCandidate(c.github_username);
        c.skills = Array.from(new Set([...c.skills, ...gh.skills]));
        c.work_samples = [...c.work_samples, ...gh.work_samples].filter(
          (w, i, a) => a.findIndex((x) => x.url === w.url) === i,
        );
        c.signal_data = { ...c.signal_data, ...gh.signal_data };
        enrichment.github_deep = gh.signal_data;
      } catch (e) {
        enrichment.github_deep = { error: e instanceof Error ? e.message : String(e) };
      }
    }
    if (providers.includes("semantic_scholar")) {
      try {
        const s2 = await enrichSemanticScholar(c.full_name);
        if (s2) {
          c.work_samples = [...c.work_samples, ...s2.top_papers].filter(
            (w, i, a) => a.findIndex((x) => x.url === w.url) === i,
          );
          c.signal_data = {
            ...c.signal_data,
            semantic_scholar_citations: s2.citation_count,
            semantic_scholar_h_index: s2.h_index,
          };
        }
        enrichment.semantic_scholar = s2 ?? { matched: false };
      } catch (e) {
        enrichment.semantic_scholar = { error: e instanceof Error ? e.message : String(e) };
      }
    }
    if (providers.includes("email_verify")) {
      const primary = c.emails.find((e) => e.is_primary)?.value ?? c.emails[0]?.value;
      enrichment.email_verify = primary ? await verifyEmail(primary) : { skipped: "no email on candidate" };
    }
    return jsonResult({ candidate: c, enrichment });
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Tool 4: normalize_candidates — dedupe + rank an arbitrary set
// ─────────────────────────────────────────────────────────────────────────────
server.registerTool(
  "csi_normalize_candidates",
  {
    title: "Dedupe & rank candidates",
    description: `Merge a list of candidates from any mix of sources into a deduped, evidence-ranked set. Two records merge if they share a normalized_email, github_username, linkedin_slug, or verbatim source_url; merged records union work_samples/skills/links. Ranked by work-sample density then signal strength.

Returns JSON: { count, candidates: NormalizedCandidate[] }.`,
    inputSchema: z.object({ candidates: z.array(NormalizedCandidateSchema).min(1) }).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ candidates }) => {
    const ranked = rankByEvidence(dedupeCandidates(candidates));
    return jsonResult({ count: ranked.length, candidates: ranked });
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Tool 5: composite_score — deterministic weighted score
// ─────────────────────────────────────────────────────────────────────────────
server.registerTool(
  "csi_composite_score",
  {
    title: "Compute weighted composite score",
    description: `Deterministically combine per-dimension scores (0-100, produced by the LLM in the scoring skill) into an overall 0-100 score using percentage weights, apply the pass threshold, and map to a recommendation (strong_yes…strong_no). If dealbreaker_triggered is true the score is forced to 0 / strong_no.

Weights need not sum to 100 — they are normalized. Use this so scores are reproducible and auditable.

Returns JSON: { overall_score, recommendation, passed_threshold, weighted_dimensions, dealbreaker_triggered, notes }.`,
    inputSchema: z
      .object({
        dimension_scores: DimensionScoreSchema.describe("e.g. { technical_depth: 82, impact: 70, culture_fit: 60 }"),
        weights: ScoreWeightsSchema.describe("Percentage weight per dimension, e.g. { technical_depth: 40, impact: 35, culture_fit: 25 }"),
        threshold: z.number().min(0).max(100).default(60).describe("Minimum overall score to pass."),
        dealbreaker_triggered: z.boolean().default(false).describe("Set true if an absolute dealbreaker was hit."),
      })
      .strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ dimension_scores, weights, threshold, dealbreaker_triggered }) => {
    return jsonResult(computeComposite({ dimension_scores, weights, threshold, dealbreaker_triggered }));
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Tool 6: calibrate_weights — learn from recorded verdicts
// ─────────────────────────────────────────────────────────────────────────────
server.registerTool(
  "csi_calibrate_weights",
  {
    title: "Calibrate scoring weights from verdicts",
    description: `Given recorded recruiter verdicts (the dimension_scores at decision time + whether the candidate was advanced), nudge the weights toward the dimensions that best separate advances from rejects. Capped at ±5% per dimension per cycle; only returns changed weights if agreement on the sample improves. Requires ≥10 verdicts.

Returns JSON: { adjusted_weights, changed, before_agreement, after_agreement, rationale }.`,
    inputSchema: z
      .object({
        verdicts: z
          .array(
            z.object({
              dimension_scores: z.record(z.number()),
              advanced: z.boolean().describe("true = recruiter advanced/starred; false = rejected"),
            }),
          )
          .min(1),
        current_weights: ScoreWeightsSchema,
        threshold: z.number().min(0).max(100).default(60),
      })
      .strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  async ({ verdicts, current_weights, threshold }) => {
    return jsonResult(calibrateWeights(verdicts as Verdict[], current_weights, threshold));
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("csi-sources MCP server running via stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
