import type { SessionRecord, DimensionScore } from '../domain/types.js';

/**
 * Pure scorer: computes token efficiency as total tokens normalized
 * by outcome quality. Lower tokens-per-quality-point is better.
 *
 * Score is expressed as a ratio: baseline_tpq / jumbo_tpq.
 * A score > 1 means Jumbo is more token-efficient.
 * A score < 1 means baseline is more token-efficient.
 * A score of 1 means they're equal.
 *
 * When used for comparison, the caller passes one run's records
 * and the average quality score for that run.
 */
export function scoreTokenEfficiency(
  sessionRecords: readonly SessionRecord[],
  qualityScore: number,
): DimensionScore {
  const totalInput = sessionRecords.reduce((sum, r) => sum + (r.inputTokens ?? 0), 0);
  const totalOutput = sessionRecords.reduce((sum, r) => sum + (r.outputTokens ?? 0), 0);
  const totalTokens = totalInput + totalOutput;

  if (totalTokens === 0) {
    return {
      dimension: 'token-efficiency',
      score: 0,
      maxScore: 1,
      details: 'No token data available',
    };
  }

  const tokensPerQualityPoint = qualityScore > 0 ? totalTokens / qualityScore : Infinity;

  return {
    dimension: 'token-efficiency',
    score: totalTokens,
    maxScore: totalTokens,
    details: `${totalTokens} total tokens (${totalInput} in, ${totalOutput} out); ${qualityScore > 0 ? tokensPerQualityPoint.toFixed(0) : 'N/A'} tokens/quality-point`,
  };
}

/**
 * Computes comparative token efficiency between Jumbo and baseline.
 * Returns a DimensionScore where:
 *   score > 0 means Jumbo is more efficient (fewer tokens per quality point)
 *   score < 0 means baseline is more efficient
 *   score = 0 means equal or no data
 */
export function compareTokenEfficiency(
  jumboRecords: readonly SessionRecord[],
  baselineRecords: readonly SessionRecord[],
  jumboQuality: number,
  baselineQuality: number,
): DimensionScore {
  const jumboTokens = jumboRecords.reduce((sum, r) => sum + (r.inputTokens ?? 0) + (r.outputTokens ?? 0), 0);
  const baselineTokens = baselineRecords.reduce((sum, r) => sum + (r.inputTokens ?? 0) + (r.outputTokens ?? 0), 0);

  if (jumboTokens === 0 && baselineTokens === 0) {
    return {
      dimension: 'token-efficiency',
      score: 0,
      maxScore: 1,
      details: 'No token data available for either run',
    };
  }

  const jumboTpq = jumboQuality > 0 ? jumboTokens / jumboQuality : Infinity;
  const baselineTpq = baselineQuality > 0 ? baselineTokens / baselineQuality : Infinity;

  // Normalize: positive means Jumbo is better (fewer tokens per quality point)
  let efficiency: number;
  if (jumboTpq === Infinity && baselineTpq === Infinity) {
    efficiency = 0;
  } else if (jumboTpq === Infinity) {
    efficiency = -1;
  } else if (baselineTpq === Infinity) {
    efficiency = 1;
  } else if (baselineTpq === 0 && jumboTpq === 0) {
    efficiency = 0;
  } else {
    // Ratio-based: how much more efficient is Jumbo?
    efficiency = baselineTpq > 0 ? Math.round(((baselineTpq - jumboTpq) / baselineTpq) * 100) / 100 : 0;
  }

  return {
    dimension: 'token-efficiency',
    score: efficiency,
    maxScore: 1,
    details: `jumbo: ${jumboTokens} tokens (${jumboTpq === Infinity ? 'N/A' : jumboTpq.toFixed(0)} tpq); baseline: ${baselineTokens} tokens (${baselineTpq === Infinity ? 'N/A' : baselineTpq.toFixed(0)} tpq)`,
  };
}

/**
 * Per-session token usage for timeline display.
 */
export function tokenUsageTimeline(
  sessionRecords: readonly SessionRecord[],
): DimensionScore[] {
  const sorted = [...sessionRecords].sort((a, b) => a.sessionNumber - b.sessionNumber);

  return sorted.map((r) => {
    const input = r.inputTokens ?? 0;
    const output = r.outputTokens ?? 0;
    const total = input + output;

    return {
      dimension: 'token-usage',
      score: total,
      maxScore: total || 1,
      details: `session ${r.sessionNumber}: ${total} tokens (${input} in, ${output} out)`,
    };
  });
}
