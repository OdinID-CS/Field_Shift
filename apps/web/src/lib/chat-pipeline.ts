import {
  ASHANTI_PILOT_CELLS,
  PRIORITY_PRESETS,
  ROTATION_STRATEGIES,
} from "../constants/ashanti-pilot.ts";
import { baseScores, rankProbabilities } from "./scoring.ts";
import { estimateNitrogenOffsetSummary } from "./sms-export.ts";
import {
  CLIMATE_STRESS_SCENARIOS,
  applyClimateStressToStrategies,
  computeMinimaxRegretRankings,
  type ClimateStressId,
} from "./stress.ts";

export type ChatLanguage = "en" | "tw";
export type PriorityWeightsTuple = [number, number, number, number];

export interface ChatContextInput {
  cellId?: string;
  weights?: number[];
  stressId?: ClimateStressId;
  farmAreaHa?: number;
  language?: ChatLanguage;
}

export interface ChatIntentExtraction {
  cellId: string;
  weights: PriorityWeightsTuple;
  stressId: Exclude<ClimateStressId, "custom">;
  language: ChatLanguage;
  farmAreaHa: number;
  needsClarification: boolean;
  clarificationQuestion?: string;
  fieldObservation?: string;
}

export interface ChatResultCard {
  cellId: string;
  regionName: string;
  stressId: Exclude<ClimateStressId, "custom">;
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
  pipelineSource: "fastapi_live" | "deterministic_local";
}

const VALID_STRESS_IDS = new Set<Exclude<ClimateStressId, "custom">>([
  "baseline",
  "moderate_drought",
  "severe_heat_drought",
  "intense_rainfall",
]);

export function normalizeWeights(raw?: number[]): PriorityWeightsTuple {
  if (!Array.isArray(raw) || raw.length !== 4) {
    return [...PRIORITY_PRESETS[0].weights] as PriorityWeightsTuple;
  }
  const cleaned = raw.map((v) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0,
  );
  const sum = cleaned.reduce((acc, v) => acc + v, 0);
  if (sum <= 0) {
    return [...PRIORITY_PRESETS[0].weights] as PriorityWeightsTuple;
  }
  const normalized = cleaned.map((v) => Number((v / sum).toFixed(4)));
  const remainder = Number(
    (1 - (normalized[0] + normalized[1] + normalized[2])).toFixed(4),
  );
  normalized[3] = Math.max(0, remainder);
  return normalized as PriorityWeightsTuple;
}

export function resolveCellId(candidate?: string): string {
  if (candidate) {
    const upper = candidate.trim().toUpperCase();
    const match = ASHANTI_PILOT_CELLS.find((c) => c.cell_id === upper);
    if (match) return match.cell_id;
  }
  return ASHANTI_PILOT_CELLS[0].cell_id;
}

export function resolveStressId(
  candidate?: string,
): Exclude<ClimateStressId, "custom"> {
  if (
    candidate &&
    VALID_STRESS_IDS.has(candidate as Exclude<ClimateStressId, "custom">)
  ) {
    return candidate as Exclude<ClimateStressId, "custom">;
  }
  return "baseline";
}

/**
 * Deterministic keyword-based intent extractor used when OpenRouter is unavailable
 * or unconfigured, ensuring the chat pipeline works reliably offline or on 2G.
 */
export function extractIntentRuleBased(
  message: string,
  context?: ChatContextInput,
): ChatIntentExtraction {
  const text = message.trim();
  const upper = text.toUpperCase();
  const lower = text.toLowerCase();

  let cellId = resolveCellId(context?.cellId);
  for (const cell of ASHANTI_PILOT_CELLS) {
    if (upper.includes(cell.cell_id)) {
      cellId = cell.cell_id;
      break;
    }
  }
  if (lower.includes("ejura")) cellId = "ASH_R05_C05";
  else if (lower.includes("mampong") || lower.includes("sekyere"))
    cellId = "ASH_R04_C04";
  else if (lower.includes("offinso") || lower.includes("afigya"))
    cellId = "ASH_R06_C06";
  else if (lower.includes("kumasi") || lower.includes("kwadaso"))
    cellId = ASHANTI_PILOT_CELLS[3]?.cell_id ?? cellId;
  else if (lower.includes("konongo") || lower.includes("asante akim"))
    cellId = ASHANTI_PILOT_CELLS[4]?.cell_id ?? cellId;

  let stressId: Exclude<ClimateStressId, "custom"> = resolveStressId(
    context?.stressId,
  );
  if (
    lower.includes("el nino") ||
    lower.includes("el niño") ||
    lower.includes("severe") ||
    lower.includes("heat") ||
    lower.includes("drought") ||
    lower.includes("drying") ||
    lower.includes("pɛ")
  ) {
    stressId = lower.includes("severe") || lower.includes("el ")
      ? "severe_heat_drought"
      : "moderate_drought";
  } else if (
    lower.includes("squall") ||
    lower.includes("flood") ||
    lower.includes("heavy rain") ||
    lower.includes("runoff")
  ) {
    stressId = "intense_rainfall";
  } else if (lower.includes("late") || lower.includes("delay")) {
    stressId = "moderate_drought";
  }

  let weights = normalizeWeights(context?.weights);
  if (
    lower.includes("water") ||
    lower.includes("moisture") ||
    lower.includes("rain") ||
    lower.includes("nsuo")
  ) {
    weights = [0.45, 0.25, 0.15, 0.15];
  } else if (
    lower.includes("soil") ||
    lower.includes("fertilizer") ||
    lower.includes("urea") ||
    lower.includes("nitrogen") ||
    lower.includes("asase")
  ) {
    weights = [0.2, 0.45, 0.2, 0.15];
  } else if (
    lower.includes("erosion") ||
    lower.includes("bare") ||
    lower.includes("cover")
  ) {
    weights = [0.2, 0.25, 0.4, 0.15];
  } else if (
    lower.includes("income") ||
    lower.includes("profit") ||
    lower.includes("money") ||
    lower.includes("market") ||
    lower.includes("sika")
  ) {
    weights = [0.15, 0.2, 0.15, 0.5];
  }

  const language: ChatLanguage =
    context?.language === "tw" ||
    lower.includes("twi") ||
    lower.includes("akan") ||
    lower.includes("asante")
      ? "tw"
      : "en";

  const farmAreaHa =
    typeof context?.farmAreaHa === "number" &&
    Number.isFinite(context.farmAreaHa) &&
    context.farmAreaHa > 0
      ? Number(context.farmAreaHa.toFixed(2))
      : 2.0;

  return {
    cellId,
    weights,
    stressId,
    language,
    farmAreaHa,
    needsClarification: false,
  };
}

interface FastApiStressResponse {
  strategies: string[];
  base_scores: number[];
  baseline_base_scores: number[];
  probability_first: number[];
  max_regrets: number[];
  lowest_regret_strategy: string | null;
}

/**
 * Executes the deterministic Field Shift science pipeline:
 * 1) Prefers the live FastAPI decision service when `DECISION_API_URL` is configured.
 * 2) Falls back seamlessly to the identical deterministic TypeScript MCDA + 2,000-run Monte Carlo engine.
 */
export async function runChatDecisionPipeline(
  intent: ChatIntentExtraction,
): Promise<ChatResultCard> {
  const cell =
    ASHANTI_PILOT_CELLS.find((c) => c.cell_id === intent.cellId) ??
    ASHANTI_PILOT_CELLS[0];
  const scenario =
    CLIMATE_STRESS_SCENARIOS.find((s) => s.id === intent.stressId) ??
    CLIMATE_STRESS_SCENARIOS[0];

  let baseScoreList: number[] | null = null;
  let probFirstList: number[] | null = null;
  let maxRegrets: number[] | null = null;
  let lowestRegretCode: string | null = null;
  let pipelineSource: "fastapi_live" | "deterministic_local" =
    "deterministic_local";

  const decisionApiBase = process.env.DECISION_API_URL?.trim();
  if (decisionApiBase) {
    try {
      const url = new URL("/api/stress-test", decisionApiBase);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          strategies: ROTATION_STRATEGIES.map((s) => s.code),
          criteria: [
            "water_efficiency",
            "soil_health",
            "erosion_protection",
            "income_market",
          ],
          scores: ROTATION_STRATEGIES.map((s) => [...s.criterionScores]),
          weights: [...intent.weights],
          is_baseline: ROTATION_STRATEGIES.map((s) => s.isBaseline),
          rain_factor: scenario.rainFactor,
          temp_delta_c: scenario.tempDeltaC,
          score_uncertainty: 0.1,
          weight_uncertainty: 0.1,
          runs: 2000,
          seed: 42,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (res.ok) {
        const data = (await res.json()) as FastApiStressResponse;
        if (
          Array.isArray(data.base_scores) &&
          data.base_scores.length === ROTATION_STRATEGIES.length
        ) {
          baseScoreList = data.base_scores;
          probFirstList = data.probability_first;
          maxRegrets = data.max_regrets;
          lowestRegretCode = data.lowest_regret_strategy;
          pipelineSource = "fastapi_live";
        }
      }
    } catch {
      // Fall back to deterministic local TS engine
    }
  }

  if (!baseScoreList || !probFirstList) {
    const stressedMatrix = applyClimateStressToStrategies(
      ROTATION_STRATEGIES,
      intent.stressId,
    );
    baseScoreList = baseScores(stressedMatrix, intent.weights);
    const mc = rankProbabilities(stressedMatrix, intent.weights, {
      runs: 2000,
      seed: 42,
    });
    probFirstList = mc.probabilityFirst;
  }

  const minimax = computeMinimaxRegretRankings(
    ROTATION_STRATEGIES,
    intent.weights,
    baseScores,
  );
  const resolvedLowestCode = lowestRegretCode || minimax.lowestRegretCode;
  const lowestRegretStrat =
    ROTATION_STRATEGIES.find((s) => s.code === resolvedLowestCode) ??
    ROTATION_STRATEGIES[1];
  const lowestRegretIdx = ROTATION_STRATEGIES.findIndex(
    (s) => s.code === lowestRegretStrat.code,
  );
  const lowestMaxRegret =
    maxRegrets?.[lowestRegretIdx] ??
    minimax.rowsByCode[lowestRegretStrat.code]?.maxRegret ??
    0;

  let bestIdx = 0;
  for (let i = 1; i < baseScoreList.length; i++) {
    if (baseScoreList[i] > baseScoreList[bestIdx]) {
      bestIdx = i;
    }
  }
  const topStrategy = ROTATION_STRATEGIES[bestIdx];
  const baselineIdx = Math.max(
    0,
    ROTATION_STRATEGIES.findIndex((s) => s.isBaseline),
  );
  const topBaseScore = Number(baseScoreList[bestIdx].toFixed(3));
  const baselineBaseScore = Number(baseScoreList[baselineIdx].toFixed(3));
  const deltaVsBaseline = Number((topBaseScore - baselineBaseScore).toFixed(3));
  const topProbabilityFirst = Number((probFirstList[bestIdx] ?? 0).toFixed(3));
  const nitrogen = estimateNitrogenOffsetSummary(topStrategy);

  return {
    cellId: cell.cell_id,
    regionName: cell.region_name,
    stressId: scenario.id,
    stressLabel: scenario.label,
    weights: intent.weights,
    farmAreaHa: intent.farmAreaHa,
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
    ureaSavingsKgPerHa: Math.round(nitrogen.ureaBagsSavedPerHa * 50),
    scaleHonestySummary: `Plot ${intent.farmAreaHa.toFixed(1)} ha: 30 m HLS & iSDAsoil guide local texture (pH ${cell.soil_ph}), while 9–10 km SMAP/IMERG reflect regional climate; verify plot soil & seed supply locally.`,
    pipelineSource,
  };
}

export function formatFallbackChatReply(
  card: ChatResultCard,
  language: ChatLanguage,
): string {
  const winPct = Math.round(card.topProbabilityFirst * 100);
  if (language === "tw") {
    return (
      `Maame/Paapa (${card.cellId} · ${card.regionName}): ` +
      `Wɔ "${card.stressLabel}" tebea mu no, ${card.topStrategyName} (${card.topStrategySequence}) na edi kan: ` +
      `MCDA score yɛ ${card.topBaseScore.toFixed(3)} (${winPct}% nkonimdi wɔ 2,000 Monte Carlo sɔhwɛ mu, +${card.deltaVsBaseline.toFixed(3)} kyɛn continuous maize). ` +
      `Ebetumi atew urea/fertilizer so ~${card.ureaSavingsKgPerHa} kg/ha. ` +
      `Minimax regret a ɛba fam paa ne ${card.lowestRegretName}. ` +
      `Hwɛ asase no pH (${card.scaleHonestySummary})`
    );
  }

  return (
    `For ${card.cellId} (${card.regionName}) under "${card.stressLabel}", ` +
    `${card.topStrategyName} (${card.topStrategySequence}) ranks #1 with an MCDA score of ${card.topBaseScore.toFixed(3)} ` +
    `(${winPct}% rank-1 probability across 2,000 Monte Carlo runs, +${card.deltaVsBaseline.toFixed(3)} above continuous maize). ` +
    `It can cut urea demand by ~${card.ureaSavingsKgPerHa} kg/ha, and ${card.lowestRegretName} has the lowest climate regret (${card.lowestMaxRegret.toFixed(3)}). ` +
    `Local check: ${card.scaleHonestySummary}`
  );
}
