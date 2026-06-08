/**
 * Deterministic scoring math. The LLM (in the proof-of-work-scoring skill) produces the
 * per-dimension judgments and the dealbreaker reasoning; THIS module only does the arithmetic:
 * weighted composite, threshold gate, and recommendation mapping. Keeping the math here makes
 * scores reproducible and auditable, and keeps the calibration loop honest.
 */
import { z } from "zod";

export const DimensionScoreSchema = z.record(z.number().min(0).max(100));

export const ScoreWeightsSchema = z.record(z.number().min(0).max(100));

export type Recommendation = "strong_yes" | "yes" | "lean_yes" | "lean_no" | "no" | "strong_no";

export function mapRecommendation(score: number): Recommendation {
  if (score >= 85) return "strong_yes";
  if (score >= 70) return "yes";
  if (score >= 60) return "lean_yes";
  if (score >= 45) return "lean_no";
  if (score >= 30) return "no";
  return "strong_no";
}

export interface CompositeResult {
  overall_score: number;
  weighted_dimensions: Record<string, { raw: number; weight: number; contribution: number }>;
  recommendation: Recommendation;
  passed_threshold: boolean;
  dealbreaker_triggered: boolean;
  notes: string[];
}

export interface CompositeInput {
  dimension_scores: Record<string, number>; // 0-100 per dimension (from LLM)
  weights: Record<string, number>; // percentage weights; normalized if they don't sum to 100
  threshold?: number; // 0-100 minimum to "pass"; default 60
  dealbreaker_triggered?: boolean; // if true → score forced to 0
}

export function computeComposite(input: CompositeInput): CompositeResult {
  const notes: string[] = [];
  const { dimension_scores, weights } = input;
  const threshold = input.threshold ?? 60;

  if (input.dealbreaker_triggered) {
    return {
      overall_score: 0,
      weighted_dimensions: {},
      recommendation: "strong_no",
      passed_threshold: false,
      dealbreaker_triggered: true,
      notes: ["Absolute dealbreaker triggered → automatic reject (score 0)."],
    };
  }

  const weightSum = Object.values(weights).reduce((s, w) => s + w, 0);
  if (weightSum === 0) {
    notes.push("All weights zero; falling back to equal weighting.");
  }
  const dims = Object.keys(dimension_scores);
  const weighted: CompositeResult["weighted_dimensions"] = {};
  let overall = 0;

  for (const dim of dims) {
    const raw = Math.max(0, Math.min(100, dimension_scores[dim] ?? 0));
    const rawWeight = weights[dim] ?? (weightSum === 0 ? 100 / dims.length : 0);
    const weight = weightSum > 0 ? rawWeight / weightSum : rawWeight / 100;
    const contribution = raw * weight;
    weighted[dim] = { raw, weight: Math.round(weight * 1000) / 10, contribution: Math.round(contribution * 10) / 10 };
    overall += contribution;
  }

  const missingWeights = Object.keys(weights).filter((w) => !(w in dimension_scores));
  if (missingWeights.length) notes.push(`Weighted dimensions with no score: ${missingWeights.join(", ")}`);

  const overallRounded = Math.round(overall);
  return {
    overall_score: overallRounded,
    weighted_dimensions: weighted,
    recommendation: mapRecommendation(overallRounded),
    passed_threshold: overallRounded >= threshold,
    dealbreaker_triggered: false,
    notes,
  };
}

/**
 * Calibration: given recorded verdicts (advance/reject) and the dimension scores at decision
 * time, nudge weights toward the dimensions that best separate advances from rejects. Capped at
 * ±maxDelta per cycle; only returns adjusted weights if they improve agreement on the sample.
 */
export interface Verdict {
  dimension_scores: Record<string, number>;
  advanced: boolean; // true = recruiter advanced/starred; false = rejected
}

export interface CalibrationResult {
  adjusted_weights: Record<string, number>;
  changed: boolean;
  before_agreement: number;
  after_agreement: number;
  rationale: string;
}

function agreement(verdicts: Verdict[], weights: Record<string, number>, threshold: number): number {
  if (verdicts.length === 0) return 0;
  let correct = 0;
  for (const v of verdicts) {
    const { overall_score } = computeComposite({ dimension_scores: v.dimension_scores, weights, threshold });
    const predictedAdvance = overall_score >= threshold;
    if (predictedAdvance === v.advanced) correct++;
  }
  return correct / verdicts.length;
}

export function calibrateWeights(
  verdicts: Verdict[],
  currentWeights: Record<string, number>,
  threshold = 60,
  maxDelta = 5,
  minVerdicts = 10,
): CalibrationResult {
  const before = agreement(verdicts, currentWeights, threshold);
  if (verdicts.length < minVerdicts) {
    return {
      adjusted_weights: currentWeights,
      changed: false,
      before_agreement: Math.round(before * 100) / 100,
      after_agreement: Math.round(before * 100) / 100,
      rationale: `Need ≥${minVerdicts} verdicts to calibrate (have ${verdicts.length}).`,
    };
  }

  const dims = Object.keys(currentWeights);
  // Mean score on advances vs rejects per dimension → discriminative power.
  const advances = verdicts.filter((v) => v.advanced);
  const rejects = verdicts.filter((v) => !v.advanced);
  const sep: Record<string, number> = {};
  for (const d of dims) {
    const meanAdv = advances.reduce((s, v) => s + (v.dimension_scores[d] ?? 0), 0) / (advances.length || 1);
    const meanRej = rejects.reduce((s, v) => s + (v.dimension_scores[d] ?? 0), 0) / (rejects.length || 1);
    sep[d] = meanAdv - meanRej; // positive → predicts advance
  }

  const maxAbs = Math.max(1, ...dims.map((d) => Math.abs(sep[d])));
  const proposed: Record<string, number> = {};
  for (const d of dims) {
    const delta = (sep[d] / maxAbs) * maxDelta; // scaled to ±maxDelta
    proposed[d] = Math.max(0, currentWeights[d] + delta);
  }
  // Renormalize to the original total.
  const origTotal = Object.values(currentWeights).reduce((s, w) => s + w, 0) || 100;
  const propTotal = Object.values(proposed).reduce((s, w) => s + w, 0) || 1;
  for (const d of dims) proposed[d] = Math.round((proposed[d] / propTotal) * origTotal * 10) / 10;

  const after = agreement(verdicts, proposed, threshold);
  if (after > before) {
    return {
      adjusted_weights: proposed,
      changed: true,
      before_agreement: Math.round(before * 100) / 100,
      after_agreement: Math.round(after * 100) / 100,
      rationale: `Shifted weight toward dimensions that separate advances from rejects (±${maxDelta}% cap). Agreement ${(
        before * 100
      ).toFixed(0)}% → ${(after * 100).toFixed(0)}%.`,
    };
  }
  return {
    adjusted_weights: currentWeights,
    changed: false,
    before_agreement: Math.round(before * 100) / 100,
    after_agreement: Math.round(after * 100) / 100,
    rationale: "Proposed adjustment did not improve agreement; keeping current weights.",
  };
}
