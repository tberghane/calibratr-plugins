/**
 * Semantic Scholar enrichment — backfills citation count, h-index, and top papers for
 * academic/research candidates (great companion to the arXiv source). No key required;
 * SEMANTIC_SCHOLAR_API_KEY raises rate limits. Paper URLs are verbatim.
 */
import { ENDPOINTS, TOKENS } from "../constants.js";
import { getJson } from "../http.js";
import type { WorkSample } from "../schema.js";

interface S2Author {
  authorId: string;
  name: string;
  hIndex?: number;
  citationCount?: number;
  paperCount?: number;
  url?: string;
}

interface S2Paper {
  title: string;
  year?: number;
  citationCount?: number;
  externalIds?: { ArXiv?: string; DOI?: string };
  url?: string;
}

export interface SemanticScholarResult {
  matched_name: string;
  semantic_scholar_url?: string;
  citation_count?: number;
  h_index?: number;
  paper_count?: number;
  top_papers: WorkSample[];
}

function headers(): Record<string, string> {
  return TOKENS.semanticScholar ? { "x-api-key": TOKENS.semanticScholar } : {};
}

export async function enrichSemanticScholar(name: string): Promise<SemanticScholarResult | null> {
  const search = await getJson<{ data?: S2Author[] }>(
    `${ENDPOINTS.semanticScholar}/author/search?query=${encodeURIComponent(name)}&fields=name,hIndex,citationCount,paperCount,url&limit=1`,
    { headers: headers() },
  );
  const author = search.data?.[0];
  if (!author) return null;

  let topPapers: WorkSample[] = [];
  try {
    const papers = await getJson<{ data?: S2Paper[] }>(
      `${ENDPOINTS.semanticScholar}/author/${author.authorId}/papers?fields=title,year,citationCount,externalIds,url&limit=5`,
      { headers: headers() },
    );
    topPapers = (papers.data ?? [])
      .sort((a, b) => (b.citationCount ?? 0) - (a.citationCount ?? 0))
      .slice(0, 5)
      .map((p) => ({
        type: "paper",
        title: p.title.slice(0, 120),
        url: p.url || (p.externalIds?.ArXiv ? `https://arxiv.org/abs/${p.externalIds.ArXiv}` : `https://www.semanticscholar.org`),
        signal: `${(p.citationCount ?? 0).toLocaleString()} citations${p.year ? `, ${p.year}` : ""}`,
      }));
  } catch {
    /* best-effort */
  }

  return {
    matched_name: author.name,
    semantic_scholar_url: author.url,
    citation_count: author.citationCount,
    h_index: author.hIndex,
    paper_count: author.paperCount,
    top_papers: topPapers,
  };
}
