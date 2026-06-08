/**
 * Hacker News source — mines "Ask HN: Who wants to be hired?" threads via the Algolia API.
 * Each comment is a self-authored mini-resume; we parse the conventional pipe-delimited format
 * (Location | Remote | Willing to relocate | Technologies | Résumé | Email).
 * The HN comment permalink is the verbatim source_url.
 */
import { ENDPOINTS } from "../constants.js";
import { getJson, nowIso } from "../http.js";
import type { NormalizedCandidate, SourceModule, SourceSearchParams, WorkSample } from "../schema.js";

interface AlgoliaHit {
  objectID: string;
  author: string;
  comment_text?: string;
  story_title?: string;
  created_at: string;
}

const SKILL_VOCAB = [
  "python", "javascript", "typescript", "go", "golang", "rust", "java", "kotlin", "swift",
  "c++", "c#", "ruby", "scala", "elixir", "haskell", "react", "vue", "svelte", "node",
  "django", "rails", "kubernetes", "docker", "terraform", "aws", "gcp", "azure", "postgres",
  "kafka", "spark", "pytorch", "tensorflow", "llm", "ml", "nlp", "graphql", "solidity",
];

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x2F;/g, "/")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEmail(text: string): string | undefined {
  const m = text.match(/[a-zA-Z0-9._%+-]+\s?(?:@|\[at\]|\(at\))\s?[a-zA-Z0-9.-]+\s?(?:\.|\[dot\]|\(dot\))\s?[a-zA-Z]{2,}/);
  if (!m) return undefined;
  return m[0]
    .replace(/\[at\]|\(at\)/gi, "@")
    .replace(/\[dot\]|\(dot\)/gi, ".")
    .replace(/\s+/g, "");
}

function extractWebsite(text: string): string | undefined {
  const m = text.match(/https?:\/\/[^\s)]+/);
  return m ? m[0] : undefined;
}

function extractLocation(text: string): string | undefined {
  // "Location: X" or first pipe field.
  const m = text.match(/location:\s*([^|.\n]+)/i);
  if (m) return m[1].trim().slice(0, 80);
  const first = text.split("|")[0]?.trim();
  return first && first.length < 60 ? first : undefined;
}

function extractSkills(text: string): string[] {
  const lower = text.toLowerCase();
  return SKILL_VOCAB.filter((s) => new RegExp(`\\b${s.replace("+", "\\+").replace("#", "\\#")}\\b`).test(lower))
    .map((s) => (s === "golang" ? "go" : s))
    .filter((v, i, a) => a.indexOf(v) === i);
}

export const hackerNewsSource: SourceModule = {
  id: "hacker_news",
  name: "Hacker News (Who wants to be hired)",
  description: "Self-authored candidate posts from HN hiring threads; parses skills, location, contact.",
  async search({ query, maxResults }: SourceSearchParams): Promise<NormalizedCandidate[]> {
    // Search comments in "who wants to be hired" threads matching the query terms.
    const url =
      `${ENDPOINTS.hnAlgolia}/search?tags=comment&query=${encodeURIComponent(query)}` +
      `&hitsPerPage=${Math.min(maxResults * 2, 100)}`;
    const res = await getJson<{ hits: AlgoliaHit[] }>(url);

    const candidates: NormalizedCandidate[] = [];
    for (const hit of res.hits) {
      if (!hit.comment_text) continue;
      const text = stripHtml(hit.comment_text);
      // Heuristic: hiring-thread self-posts mention location/remote/email patterns.
      if (text.length < 60) continue;
      const email = extractEmail(text);
      const website = extractWebsite(text);
      const skills = extractSkills(text);
      if (!email && skills.length === 0) continue; // not a usable candidate post

      const permalink = `https://news.ycombinator.com/item?id=${hit.objectID}`;
      const work: WorkSample[] = website
        ? [{ type: "post", title: "Personal site / résumé (from HN post)", url: website, signal: "linked in HN post" }]
        : [];

      candidates.push({
        full_name: hit.author, // HN username; real name often not present
        headline: text.slice(0, 140),
        location: extractLocation(text),
        emails: email ? [{ value: email, type: "personal", is_primary: true }] : [],
        website_url: website,
        other_urls: [],
        skills,
        tags: ["hacker_news", "actively_looking"],
        source_platform: "hacker_news",
        source_url: permalink, // verbatim
        sourced_at: nowIso(),
        work_samples: work,
        signal_data: { hn_author: hit.author, hn_thread: hit.story_title, posted_at: hit.created_at },
        raw_data: { comment: text.slice(0, 1000) },
      });
      if (candidates.length >= maxResults) break;
    }
    return candidates;
  },
};
