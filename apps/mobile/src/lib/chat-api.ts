import {
  ASHANTI_PILOT_CELLS,
  PRIORITY_PRESETS,
  ROTATION_STRATEGIES,
} from '@/constants/pilot-data';
import { getDecisionApiBaseUrl } from '@/lib/decision-api';
import { baseScores, rankProbabilities } from '@/lib/scoring';
import { estimateNitrogenOffsetSummary } from '@/lib/sms-export';
import {
  CLIMATE_STRESS_SCENARIOS,
  applyClimateStressToStrategies,
  computeMinimaxRegretRankings,
  type ClimateStressId,
} from '@/lib/stress';

export type ChatLanguage = 'en' | 'tw';
export type PriorityWeightsTuple = [number, number, number, number];

export interface ChatHistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResultCard {
  cellId: string;
  regionName: string;
  stressId: Exclude<ClimateStressId, 'custom'>;
  stressLabel: string;
  weights: PriorityWeightsTuple;
  farmAreaHa: number;
  topStrategyCode: string;
  topStrategyName: string;
  topStrategySequence: string;
  topBaseScore: number;
  topProbabilityFirst: number;
  baselineBaseScore: number;
  deltaVsBaseline: number;
  lowestRegretCode: string;
  lowestRegretName: string;
  lowestMaxRegret: number;
  ureaSavingsKgPerHa: number;
  scaleHonestySummary: string;
  pipelineSource: 'fastapi_live' | 'deterministic_local' | 'mobile_offline';
}

export interface ChatApiResponse {
  ok: boolean;
  reply: string;
  modelUsed: string;
  pipelineSource: string;
  resultCard: ChatResultCard | null;
}

function runLocalOfflineChatFallback(params: {
  message: string;
  cellId: string;
  weights: PriorityWeightsTuple;
  farmAreaHa: number;
}): ChatApiResponse {
  const lower = params.message.toLowerCase();
  const upper = params.message.toUpperCase();

  let cell =
    ASHANTI_PILOT_CELLS.find((c) => upper.includes(c.cellId)) ??
    ASHANTI_PILOT_CELLS.find((c) => c.cellId === params.cellId) ??
    ASHANTI_PILOT_CELLS[0];

  if (lower.includes('ejura')) {
    cell = ASHANTI_PILOT_CELLS[0];
  } else if (lower.includes('mampong') && ASHANTI_PILOT_CELLS[1]) {
    cell = ASHANTI_PILOT_CELLS[1];
  } else if (lower.includes('offinso') && ASHANTI_PILOT_CELLS[2]) {
    cell = ASHANTI_PILOT_CELLS[2];
  }

  let stressId: Exclude<ClimateStressId, 'custom'> = 'baseline';
  if (lower.includes('severe') || lower.includes('el nino') || lower.includes('el niño')) {
    stressId = 'severe_heat_drought';
  } else if (lower.includes('drought') || lower.includes('dry') || lower.includes('heat') || lower.includes('late')) {
    stressId = 'moderate_drought';
  } else if (lower.includes('squall') || lower.includes('flood') || lower.includes('heavy rain')) {
    stressId = 'intense_rainfall';
  }

  let weights: PriorityWeightsTuple = [...params.weights] as PriorityWeightsTuple;
  if (lower.includes('water') || lower.includes('moisture') || lower.includes('rain')) {
    weights = [0.45, 0.25, 0.15, 0.15];
  } else if (lower.includes('soil') || lower.includes('fertilizer') || lower.includes('urea')) {
    weights = [0.2, 0.45, 0.2, 0.15];
  } else if (lower.includes('erosion') || lower.includes('bare')) {
    weights = [0.2, 0.25, 0.4, 0.15];
  } else if (lower.includes('income') || lower.includes('profit') || lower.includes('money')) {
    weights = [0.15, 0.2, 0.15, 0.5];
  } else if (weights.length !== 4) {
    weights = [...PRIORITY_PRESETS[0].weights] as PriorityWeightsTuple;
  }

  const language: ChatLanguage =
    lower.includes('twi') || lower.includes('akan') ? 'tw' : 'en';

  const scenario =
    CLIMATE_STRESS_SCENARIOS.find((s) => s.id === stressId) ??
    CLIMATE_STRESS_SCENARIOS[0];
  const stressedMatrix = applyClimateStressToStrategies(ROTATION_STRATEGIES, stressId);
  const scores = baseScores(stressedMatrix, weights);
  const mc = rankProbabilities(stressedMatrix, weights, { runs: 2000, seed: 42 });
  const minimax = computeMinimaxRegretRankings(
    ROTATION_STRATEGIES,
    weights,
    baseScores,
  );

  let bestIdx = 0;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > scores[bestIdx]) bestIdx = i;
  }
  const topStrategy = ROTATION_STRATEGIES[bestIdx];
  const baselineIdx = Math.max(
    0,
    ROTATION_STRATEGIES.findIndex((s) => s.isBaseline),
  );
  const lowestRegretStrat =
    ROTATION_STRATEGIES.find((s) => s.code === minimax.lowestRegretCode) ??
    ROTATION_STRATEGIES[1];
  const lowestMaxRegret =
    minimax.rowsByCode[lowestRegretStrat.code]?.maxRegret ?? 0;

  const topBaseScore = Number(scores[bestIdx].toFixed(3));
  const baselineBaseScore = Number(scores[baselineIdx].toFixed(3));
  const deltaVsBaseline = Number((topBaseScore - baselineBaseScore).toFixed(3));
  const topProbabilityFirst = Number((mc.probabilityFirst[bestIdx] ?? 0).toFixed(3));
  const nitrogen = estimateNitrogenOffsetSummary(topStrategy);
  const ureaSavingsKgPerHa = Math.round(nitrogen.ureaBagsSavedPerHa * 50);

  const resultCard: ChatResultCard = {
    cellId: cell.cellId,
    regionName: cell.zoneName,
    stressId: scenario.id,
    stressLabel: scenario.label,
    weights,
    farmAreaHa: params.farmAreaHa,
    topStrategyCode: topStrategy.code,
    topStrategyName: topStrategy.name,
    topStrategySequence: topStrategy.sequence,
    topBaseScore,
    topProbabilityFirst,
    baselineBaseScore,
    deltaVsBaseline,
    lowestRegretCode: lowestRegretStrat.code,
    lowestRegretName: lowestRegretStrat.name,
    lowestMaxRegret: Number(lowestMaxRegret.toFixed(3)),
    ureaSavingsKgPerHa,
    scaleHonestySummary: `Plot ${params.farmAreaHa.toFixed(1)} ha (offline bundle): verify plot soil pH (${cell.soilPh}) & local seed supply.`,
    pipelineSource: 'mobile_offline',
  };

  const winPct = Math.round(topProbabilityFirst * 100);
  const reply =
    language === 'tw'
      ? `(${cell.cellId} · Offline) Wɔ "${scenario.label}" tebea mu no, ${topStrategy.name} (${topStrategy.sequence}) di kan: MCDA score ${topBaseScore.toFixed(3)} (${winPct}% nkonimdi wɔ 2,000 Monte Carlo mu, urea so tew ~${ureaSavingsKgPerHa} kg/ha).`
      : `Offline pipeline (${cell.cellId}): Under "${scenario.label}", ${topStrategy.name} (${topStrategy.sequence}) ranks #1 with MCDA score ${topBaseScore.toFixed(3)} (${winPct}% rank-1 across 2,000 Monte Carlo runs, +${deltaVsBaseline.toFixed(3)} vs continuous maize) and ~${ureaSavingsKgPerHa} kg/ha urea savings.`;

  return {
    ok: true,
    reply,
    modelUsed: 'on-device-deterministic',
    pipelineSource: 'mobile_offline',
    resultCard,
  };
}

export async function sendFarmerChatMessage(params: {
  message: string;
  history: ChatHistoryTurn[];
  cellId: string;
  weights: PriorityWeightsTuple;
  farmAreaHa: number;
}): Promise<ChatApiResponse> {
  const endpoint = `${getDecisionApiBaseUrl()}/api/chat`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        message: params.message,
        history: params.history.slice(-6),
        context: {
          cellId: params.cellId,
          weights: params.weights,
          farmAreaHa: params.farmAreaHa,
        },
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      return runLocalOfflineChatFallback(params);
    }
    const data = (await res.json()) as ChatApiResponse;
    if (!data?.ok || typeof data.reply !== 'string') {
      return runLocalOfflineChatFallback(params);
    }
    return data;
  } catch {
    return runLocalOfflineChatFallback(params);
  }
}
