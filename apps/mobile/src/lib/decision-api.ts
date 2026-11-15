import {
  type RotationStrategySpec,
  SCORING_CRITERIA,
} from '@/constants/pilot-data';
import {
  CLIMATE_STRESS_SCENARIOS,
  type ClimateStressId,
  type MinimaxRegretRow,
  type MinimaxRegretSummary,
} from '@/lib/stress';

export const DEFAULT_VERCEL_API_URL = 'https://scalarfield.vercel.app';

export function getDecisionApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  const base = configured && configured.length > 0 ? configured : DEFAULT_VERCEL_API_URL;
  return base.replace(/\/+$/, '');
}

export interface RemoteStressTestResult {
  baseScores: number[];
  baselineBaseScores: number[];
  stressedMatrix: number[][];
  probabilityFirst: number[];
  meanRank: number[];
  minimax: MinimaxRegretSummary;
  sourceUrl: string;
}

interface FastApiStressTestResponse {
  strategies: string[];
  baseline_base_scores: number[];
  stressed_scores: number[][];
  base_scores: number[];
  worst_case_scores: number[];
  max_regrets: number[];
  lowest_regret_strategy: string | null;
  probability_first: number[];
  mean_rank: number[];
}

/**
 * Queries the live Vercel FastAPI decision service (`POST /api/stress-test`)
 * at `https://scalarfield.vercel.app/api/stress-test`.
 * Returns `null` if offline so the caller falls back seamlessly to local compute.
 */
export async function fetchRemoteStressTest(params: {
  strategies: RotationStrategySpec[];
  weights: number[];
  stressId: ClimateStressId;
  runs?: number;
  seed?: number;
}): Promise<RemoteStressTestResult | null> {
  const { strategies, weights, stressId, runs = 2000, seed = 42 } = params;
  if (strategies.length === 0) return null;

  const scenario =
    CLIMATE_STRESS_SCENARIOS.find((item) => item.id === stressId) ??
    CLIMATE_STRESS_SCENARIOS[0];
  const baseUrl = getDecisionApiBaseUrl();
  const endpoint = `${baseUrl}/api/stress-test`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        strategies: strategies.map((s) => s.code),
        criteria: [...SCORING_CRITERIA],
        scores: strategies.map((s) => [...s.criterionScores]),
        weights: [...weights],
        is_baseline: strategies.map((s) => s.isBaseline),
        rain_factor: scenario.rainFactor,
        temp_delta_c: scenario.tempDeltaC,
        score_uncertainty: 0.1,
        weight_uncertainty: 0.1,
        runs,
        seed,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as FastApiStressTestResponse;
    if (
      !Array.isArray(data.base_scores) ||
      data.base_scores.length !== strategies.length
    ) {
      return null;
    }

    const rowsByCode: Record<string, MinimaxRegretRow> = {};
    strategies.forEach((strategy, idx) => {
      rowsByCode[strategy.code] = {
        code: strategy.code,
        worstCaseScore: Number((data.worst_case_scores?.[idx] ?? 0).toFixed(4)),
        maxRegret: Number((data.max_regrets?.[idx] ?? 0).toFixed(4)),
      };
    });

    return {
      baseScores: data.base_scores,
      baselineBaseScores: data.baseline_base_scores ?? data.base_scores,
      stressedMatrix:
        data.stressed_scores ?? strategies.map((s) => [...s.criterionScores]),
      probabilityFirst: data.probability_first,
      meanRank: data.mean_rank,
      minimax: {
        lowestRegretCode:
          data.lowest_regret_strategy ?? strategies[0]?.code ?? '',
        rowsByCode,
      },
      sourceUrl: baseUrl,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
