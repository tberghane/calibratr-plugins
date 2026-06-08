/**
 * Hugging Face source — ML engineers / researchers via model & dataset authors.
 * Models and datasets are proof-of-work; URLs are verbatim huggingface.co paths.
 */
import { ENDPOINTS } from "../constants.js";
import { getJson, nowIso } from "../http.js";
import type { NormalizedCandidate, SourceModule, SourceSearchParams, WorkSample } from "../schema.js";

interface HfModel {
  id: string; // "author/model"
  author?: string;
  downloads?: number;
  likes?: number;
  pipeline_tag?: string;
  tags?: string[];
}

export const huggingfaceSource: SourceModule = {
  id: "huggingface",
  name: "Hugging Face",
  description: "ML/AI builders via Hugging Face model & dataset authors; repos as proof-of-work.",
  async search({ query, maxResults }: SourceSearchParams): Promise<NormalizedCandidate[]> {
    const url =
      `${ENDPOINTS.huggingface}/models?search=${encodeURIComponent(query)}` +
      `&sort=downloads&direction=-1&limit=${Math.min(maxResults * 3, 60)}`;
    const models = await getJson<HfModel[]>(url);

    const byAuthor = new Map<string, HfModel[]>();
    for (const m of models) {
      const author = m.author || m.id.split("/")[0];
      if (!author) continue;
      const list = byAuthor.get(author) ?? [];
      list.push(m);
      byAuthor.set(author, list);
    }

    const candidates: NormalizedCandidate[] = [];
    for (const [author, ms] of byAuthor) {
      const sorted = ms.sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0));
      const skills = Array.from(
        new Set(sorted.flatMap((m) => [m.pipeline_tag, ...(m.tags ?? [])]).filter((t): t is string => Boolean(t))),
      ).slice(0, 12);
      const work: WorkSample[] = sorted.slice(0, 5).map((m) => ({
        type: "model",
        title: m.id,
        url: `https://huggingface.co/${m.id}`, // verbatim path
        signal: `${(m.downloads ?? 0).toLocaleString()} downloads, ${(m.likes ?? 0).toLocaleString()} likes`,
      }));
      const profile = `https://huggingface.co/${author}`;
      candidates.push({
        full_name: author,
        headline: `HF author — ${sorted.length} model${sorted.length > 1 ? "s" : ""}; top: ${sorted[0].id}`,
        emails: [],
        portfolio_url: profile,
        other_urls: [],
        skills,
        tags: ["huggingface", "ml"],
        source_platform: "huggingface",
        source_url: profile, // verbatim
        sourced_at: nowIso(),
        work_samples: work,
        signal_data: {
          hf_models_count: sorted.length,
          hf_total_downloads: sorted.reduce((s, m) => s + (m.downloads ?? 0), 0),
          hf_top_tags: skills.slice(0, 5),
        },
        raw_data: { models: sorted.map((m) => m.id) },
      });
      if (candidates.length >= maxResults) break;
    }
    return candidates;
  },
};
