/**
 * arXiv source — research/ML talent. Queries the arXiv Atom API, parses entries, and pivots
 * papers → authors. Each author becomes a candidate whose papers are proof-of-work.
 * Paper abs URLs are verbatim from the feed.
 */
import { ARXIV_CATEGORY_MAP, ENDPOINTS } from "../constants.js";
import { getText, nowIso } from "../http.js";
import type { NormalizedCandidate, SourceModule, SourceSearchParams, WorkSample } from "../schema.js";

interface ArxivPaper {
  id: string; // abs URL (verbatim)
  title: string;
  published: string;
  categories: string[];
  authors: string[];
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseEntries(xml: string): ArxivPaper[] {
  const entries = xml.split(/<entry>/).slice(1);
  return entries.map((e) => {
    const id = (e.match(/<id>([^<]+)<\/id>/)?.[1] ?? "").trim();
    const title = decode(e.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
    const published = (e.match(/<published>([^<]+)<\/published>/)?.[1] ?? "").trim();
    const authors = Array.from(e.matchAll(/<name>([^<]+)<\/name>/g)).map((m) => decode(m[1]));
    const categories = Array.from(e.matchAll(/<category[^>]*term="([^"]+)"/g)).map((m) => m[1]);
    return { id, title, published, categories, authors };
  });
}

export const arxivSource: SourceModule = {
  id: "arxiv",
  name: "arXiv",
  description: "Research talent via arXiv; authors surfaced with their papers as proof-of-work.",
  async search({ query, maxResults }: SourceSearchParams): Promise<NormalizedCandidate[]> {
    const url =
      `${ENDPOINTS.arxiv}?search_query=all:${encodeURIComponent(query)}` +
      `&start=0&max_results=${Math.min(maxResults * 3, 60)}&sortBy=relevance`;
    const xml = await getText(url);
    const papers = parseEntries(xml).filter((p) => p.id && p.authors.length);

    // Pivot to authors, dedup by name, attach their papers.
    const byAuthor = new Map<string, { papers: ArxivPaper[]; cats: Set<string> }>();
    for (const p of papers) {
      for (const author of p.authors) {
        const entry = byAuthor.get(author) ?? { papers: [], cats: new Set<string>() };
        entry.papers.push(p);
        p.categories.forEach((c) => entry.cats.add(c));
        byAuthor.set(author, entry);
      }
    }

    const candidates: NormalizedCandidate[] = [];
    for (const [author, { papers: ps, cats }] of byAuthor) {
      const skills = Array.from(cats)
        .map((c) => ARXIV_CATEGORY_MAP[c])
        .filter((v): v is string => Boolean(v))
        .filter((v, i, a) => a.indexOf(v) === i);
      const work: WorkSample[] = ps.slice(0, 5).map((p) => ({
        type: "paper",
        title: p.title.slice(0, 120),
        url: p.id, // verbatim abs URL
        signal: `arXiv ${p.published.slice(0, 4)}${p.categories[0] ? `, ${p.categories[0]}` : ""}`,
      }));
      candidates.push({
        full_name: author,
        headline: `Author of ${ps.length} arXiv paper${ps.length > 1 ? "s" : ""}: ${ps[0].title.slice(0, 90)}`,
        emails: [],
        other_urls: [],
        skills,
        tags: ["arxiv", "research"],
        source_platform: "arxiv",
        source_url: ps[0].id, // verbatim
        sourced_at: nowIso(),
        work_samples: work,
        signal_data: {
          arxiv_papers: ps.length,
          arxiv_primary_category: ps[0].categories[0],
          arxiv_top_categories: Array.from(cats).slice(0, 4),
        },
        raw_data: { paper_titles: ps.map((p) => p.title) },
      });
      if (candidates.length >= maxResults) break;
    }
    return candidates;
  },
};
