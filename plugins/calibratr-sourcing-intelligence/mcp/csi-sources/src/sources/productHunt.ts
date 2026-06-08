/**
 * Product Hunt source — founders / product builders via the GraphQL API. Makers of matching
 * posts become candidates; their launches are proof-of-work. Requires PRODUCTHUNT_TOKEN
 * (free developer token). Profile + post URLs are verbatim from the API.
 */
import { ENDPOINTS, TOKENS } from "../constants.js";
import { postJson, nowIso } from "../http.js";
import type { NormalizedCandidate, SourceModule, SourceSearchParams, WorkSample } from "../schema.js";

interface PhUser {
  name: string;
  username: string;
  headline?: string;
  profileImage?: string;
  twitterUsername?: string;
  websiteUrl?: string;
  url: string; // verbatim profile URL
}

interface PhPost {
  name: string;
  tagline?: string;
  url: string; // verbatim
  votesCount?: number;
  makers: PhUser[];
}

const QUERY = `query($q:String!,$n:Int!){
  posts(order:VOTES, first:$n){
    edges{ node{ name tagline url votesCount
      makers{ name username headline profileImage twitterUsername websiteUrl url } } }
  }
}`;

export const productHuntSource: SourceModule = {
  id: "product_hunt",
  name: "Product Hunt",
  description: "Founders & product builders via Product Hunt makers; launches as proof-of-work.",
  async search({ query, maxResults }: SourceSearchParams): Promise<NormalizedCandidate[]> {
    if (!TOKENS.productHunt) {
      throw new Error(
        "Product Hunt requires PRODUCTHUNT_TOKEN (free developer token from https://www.producthunt.com/v2/oauth/applications). Set it in the environment to enable this source.",
      );
    }
    const data = await postJson<{ data?: { posts: { edges: { node: PhPost }[] } } }>(
      ENDPOINTS.productHunt,
      { query: QUERY, variables: { q: query, n: Math.min(maxResults * 2, 40) } },
      { headers: { Authorization: `Bearer ${TOKENS.productHunt}` } },
    );

    const posts = data.data?.posts.edges.map((e) => e.node) ?? [];
    const byMaker = new Map<string, { user: PhUser; posts: PhPost[] }>();
    for (const post of posts) {
      // Lightweight relevance filter on tagline/name.
      const hay = `${post.name} ${post.tagline ?? ""}`.toLowerCase();
      if (query && !query.toLowerCase().split(/\s+/).some((t) => hay.includes(t))) continue;
      for (const maker of post.makers ?? []) {
        const entry = byMaker.get(maker.username) ?? { user: maker, posts: [] };
        entry.posts.push(post);
        byMaker.set(maker.username, entry);
      }
    }

    const candidates: NormalizedCandidate[] = [];
    for (const [, { user, posts: ps }] of byMaker) {
      const work: WorkSample[] = ps.slice(0, 5).map((p) => ({
        type: "launch",
        title: p.name,
        url: p.url, // verbatim
        signal: `${(p.votesCount ?? 0).toLocaleString()} upvotes${p.tagline ? ` — ${p.tagline}` : ""}`,
      }));
      candidates.push({
        full_name: user.name,
        headline: user.headline || `Maker of ${ps[0].name}`,
        avatar_url: user.profileImage,
        emails: [],
        twitter_url: user.twitterUsername ? `https://twitter.com/${user.twitterUsername}` : undefined,
        website_url: user.websiteUrl || undefined,
        other_urls: [],
        skills: ["product", "founder"],
        tags: ["product_hunt", "founder"],
        source_platform: "product_hunt",
        source_url: user.url, // verbatim
        sourced_at: nowIso(),
        work_samples: work,
        signal_data: { ph_products_made: ps.length, ph_username: user.username },
        raw_data: { posts: ps.map((p) => p.name) },
      });
      if (candidates.length >= maxResults) break;
    }
    return candidates;
  },
};
