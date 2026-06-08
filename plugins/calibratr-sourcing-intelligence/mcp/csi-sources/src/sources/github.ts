/**
 * GitHub source — discover engineering candidates and pull repos as proof-of-work.
 * Uses the public REST + search API. GITHUB_TOKEN (optional) raises rate limits 60→5000/hr.
 * All URLs (html_url) come verbatim from the API.
 */
import { ENDPOINTS, TOKENS } from "../constants.js";
import { getJson, nowIso, mapLimit } from "../http.js";
import type { NormalizedCandidate, SourceModule, SourceSearchParams, WorkSample } from "../schema.js";

interface GhUser {
  login: string;
  name?: string | null;
  avatar_url?: string;
  html_url: string;
  company?: string | null;
  blog?: string | null;
  location?: string | null;
  email?: string | null;
  bio?: string | null;
  twitter_username?: string | null;
  followers?: number;
  public_repos?: number;
}

interface GhRepo {
  name: string;
  html_url: string;
  description?: string | null;
  language?: string | null;
  stargazers_count: number;
  fork: boolean;
  updated_at: string;
}

function ghHeaders(): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (TOKENS.github) h["Authorization"] = `Bearer ${TOKENS.github}`;
  return h;
}

async function fetchUser(login: string): Promise<GhUser> {
  return getJson<GhUser>(`${ENDPOINTS.github}/users/${encodeURIComponent(login)}`, { headers: ghHeaders() });
}

async function fetchTopRepos(login: string): Promise<GhRepo[]> {
  const repos = await getJson<GhRepo[]>(
    `${ENDPOINTS.github}/users/${encodeURIComponent(login)}/repos?per_page=100&sort=pushed`,
    { headers: ghHeaders() },
  );
  return repos
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6);
}

/** Build a full normalized candidate from a GitHub login (also used by the enrichment tool). */
export async function buildGithubCandidate(login: string): Promise<NormalizedCandidate> {
  const user = await fetchUser(login);
  const repos = await fetchTopRepos(login);

  const languages = Array.from(
    new Set(repos.map((r) => r.language).filter((l): l is string => Boolean(l))),
  );
  const primaryLanguage = languages[0];

  const workSamples: WorkSample[] = repos.map((r) => ({
    type: "repo",
    title: r.name,
    url: r.html_url, // verbatim
    signal: `${r.stargazers_count.toLocaleString()} stars${r.language ? `, ${r.language}` : ""}${
      r.description ? ` — ${r.description.slice(0, 80)}` : ""
    }`,
  }));

  const website = user.blog && user.blog.startsWith("http") ? user.blog : undefined;

  return {
    full_name: user.name || user.login,
    headline: user.bio || undefined,
    current_company: user.company?.replace(/^@/, "") || undefined,
    location: user.location || undefined,
    avatar_url: user.avatar_url,
    emails: user.email ? [{ value: user.email, type: "personal", is_primary: true }] : [],
    github_url: user.html_url, // verbatim
    twitter_url: user.twitter_username ? `https://twitter.com/${user.twitter_username}` : undefined,
    website_url: website,
    other_urls: [],
    skills: languages,
    tags: ["github", "open_source"],
    source_platform: "github",
    source_url: user.html_url, // verbatim
    sourced_at: nowIso(),
    work_samples: workSamples,
    signal_data: {
      github_followers: user.followers ?? 0,
      github_public_repos: user.public_repos ?? 0,
      github_primary_language: primaryLanguage,
      github_languages: languages,
      github_total_stars: repos.reduce((s, r) => s + r.stargazers_count, 0),
    },
    github_username: user.login,
    raw_data: { user, top_repos: repos },
  };
}

export const githubSource: SourceModule = {
  id: "github",
  name: "GitHub",
  description: "Engineering candidates via GitHub user search; repos returned as proof-of-work.",
  async search({ query, maxResults }: SourceSearchParams): Promise<NormalizedCandidate[]> {
    // GitHub user search: free-text query (can include language:, location:, followers:>N qualifiers).
    const url = `${ENDPOINTS.github}/search/users?q=${encodeURIComponent(query)}&per_page=${Math.min(maxResults, 30)}`;
    const res = await getJson<{ items: { login: string }[] }>(url, { headers: ghHeaders() });
    const logins = res.items.slice(0, maxResults).map((i) => i.login);
    return mapLimit(logins, 4, buildGithubCandidate);
  },
};
