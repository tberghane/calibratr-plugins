/** Shared constants for the csi-sources MCP server. */

export const CHARACTER_LIMIT = 25000;

export const USER_AGENT = "calibratr-sourcing-intelligence/0.1 (MCP server)";

export const ENDPOINTS = {
  github: "https://api.github.com",
  hnAlgolia: "https://hn.algolia.com/api/v1",
  hnFirebase: "https://hacker-news.firebaseio.com/v0",
  arxiv: "https://export.arxiv.org/api/query",
  huggingface: "https://huggingface.co/api",
  stackexchange: "https://api.stackexchange.com/2.3",
  productHunt: "https://api.producthunt.com/v2/api/graphql",
  semanticScholar: "https://api.semanticscholar.org/graph/v1",
} as const;

/** Optional API keys / tokens, read from env. None are required for public reads. */
export const TOKENS = {
  github: process.env.GITHUB_TOKEN,
  productHunt: process.env.PRODUCTHUNT_TOKEN,
  semanticScholar: process.env.SEMANTIC_SCHOLAR_API_KEY,
  stackexchange: process.env.STACKEXCHANGE_KEY,
} as const;

/** arXiv category code → human-readable skill/domain. */
export const ARXIV_CATEGORY_MAP: Record<string, string> = {
  "cs.AI": "Artificial Intelligence",
  "cs.LG": "Machine Learning",
  "cs.CL": "NLP",
  "cs.CV": "Computer Vision",
  "cs.DC": "Distributed Systems",
  "cs.DB": "Databases",
  "cs.SE": "Software Engineering",
  "cs.CR": "Security & Cryptography",
  "cs.DS": "Algorithms & Data Structures",
  "cs.NE": "Neural & Evolutionary Computing",
  "cs.RO": "Robotics",
  "cs.SY": "Systems & Control",
  "cs.IR": "Information Retrieval",
  "cs.HC": "Human-Computer Interaction",
  "cs.PL": "Programming Languages",
  "stat.ML": "Statistical ML",
  "math.OC": "Optimization",
  "eess.AS": "Audio & Speech",
  "eess.IV": "Image & Video Processing",
};
