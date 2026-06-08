/**
 * Stack Overflow source — engineers via Stack Exchange API. Top answerers for a tag/query
 * become candidates; their top answers are proof-of-work. Profile links are verbatim.
 */
import { ENDPOINTS, TOKENS } from "../constants.js";
import { getJson, nowIso } from "../http.js";
import type { NormalizedCandidate, SourceModule, SourceSearchParams, WorkSample } from "../schema.js";

interface SeUser {
  user_id: number;
  display_name: string;
  reputation: number;
  link: string; // verbatim profile URL
  location?: string;
  website_url?: string;
  profile_image?: string;
}

interface SeAnswer {
  answer_id: number;
  score: number;
  owner: { user_id: number };
  title?: string;
}

function key(): string {
  return TOKENS.stackexchange ? `&key=${TOKENS.stackexchange}` : "";
}

export const stackoverflowSource: SourceModule = {
  id: "stackoverflow",
  name: "Stack Overflow",
  description: "Engineers via Stack Overflow reputation & top answers; answers as proof-of-work.",
  async search({ query, maxResults }: SourceSearchParams): Promise<NormalizedCandidate[]> {
    // Treat the query's first token as a tag if it looks like one; else use as inname filter.
    const tag = query.trim().split(/\s+/)[0].toLowerCase();
    const usersUrl =
      `${ENDPOINTS.stackexchange}/users?order=desc&sort=reputation&pagesize=${Math.min(maxResults, 30)}` +
      `&site=stackoverflow&filter=default${key()}`;
    // Top-answerers for the inferred tag give a more relevant pool than raw reputation.
    const topUrl =
      `${ENDPOINTS.stackexchange}/tags/${encodeURIComponent(tag)}/top-answerers/all_time` +
      `?site=stackoverflow&pagesize=${Math.min(maxResults, 30)}${key()}`;

    let users: SeUser[] = [];
    try {
      const top = await getJson<{ items: { user: SeUser }[] }>(topUrl);
      users = top.items.map((i) => i.user).filter(Boolean);
    } catch {
      /* tag may not exist; fall through to reputation list */
    }
    if (users.length === 0) {
      const res = await getJson<{ items: SeUser[] }>(usersUrl);
      users = res.items;
    }

    const candidates: NormalizedCandidate[] = [];
    for (const u of users.slice(0, maxResults)) {
      let work: WorkSample[] = [];
      try {
        const ans = await getJson<{ items: SeAnswer[] }>(
          `${ENDPOINTS.stackexchange}/users/${u.user_id}/answers?order=desc&sort=votes&pagesize=3&site=stackoverflow${key()}`,
        );
        work = ans.items.map((a) => ({
          type: "answer",
          title: `Top SO answer (score ${a.score})`,
          url: `https://stackoverflow.com/a/${a.answer_id}`, // verbatim
          signal: `${a.score} votes`,
        }));
      } catch {
        /* best-effort */
      }
      candidates.push({
        full_name: u.display_name,
        headline: `Stack Overflow — ${u.reputation.toLocaleString()} reputation${tag ? `, [${tag}]` : ""}`,
        location: u.location,
        avatar_url: u.profile_image,
        emails: [],
        website_url: u.website_url || undefined,
        other_urls: [],
        skills: tag ? [tag] : [],
        tags: ["stackoverflow"],
        source_platform: "stackoverflow",
        source_url: u.link, // verbatim
        sourced_at: nowIso(),
        work_samples: work,
        signal_data: { so_reputation: u.reputation, so_user_id: u.user_id, so_tag: tag },
        raw_data: { user: u },
      });
    }
    return candidates;
  },
};
