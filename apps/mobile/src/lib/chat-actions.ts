import {
  ASHANTI_PILOT_CELLS,
  PRIORITY_PRESETS,
  type RotationStrategySpec,
} from '@/constants/pilot-data';
import type { PriorityWeightsTuple } from '@/lib/chat-api';
import { baseScores, rankProbabilities } from '@/lib/scoring';
import {
  buildSmsSummaryCard,
  estimateNitrogenOffsetSummary,
} from '@/lib/sms-export';
import {
  applyClimateStressToStrategies,
  CLIMATE_STRESS_SCENARIOS,
  type ClimateStressId,
} from '@/lib/stress';

export type ChatWidget =
  | {
      type: 'compare';
      cellId: string;
      stressId: ClimateStressId;
      weights: PriorityWeightsTuple;
      selectedStrategyCode?: string;
    }
  | {
      type: 'calendar';
      cellId: string;
      zoneName: string;
      focus?: 'planting' | 'bare' | 'all';
    }
  | {
      type: 'zone_picker';
      currentCellId: string;
      currentAreaHa: number;
    }
  | {
      type: 'sms_share';
      cellId: string;
      strategyCode: string;
      strategyName: string;
      message: string;
    }
  | {
      type: 'decision_saved';
      cellId: string;
      strategyCode: string;
      strategyName: string;
      status: 'synced' | 'queued';
      detail: string;
    };

export interface RankedCompareRow {
  strategy: RotationStrategySpec;
  baseScore: number;
  winProb: number;
  ureaBagsSavedPerHa: number;
  ureaKgSavedPerHa: number;
  bareDaysAvoided: number;
}

export interface LocalCommandResult {
  reply: string;
  widget: ChatWidget;
}

/**
 * Compute ranked strategy rows for the in-chat interactive Compare widget.
 */
export function computeCompareRows(
  strategies: RotationStrategySpec[],
  weights: PriorityWeightsTuple,
  stressId: ClimateStressId,
): {
  rows: RankedCompareRow[];
  baseScoreMap: Record<string, number>;
  rankProbMap: Record<string, number>;
} {
  const stressed = applyClimateStressToStrategies(strategies, stressId);
  const scores = baseScores(stressed, weights);
  const mc = rankProbabilities(stressed, weights, { runs: 2000, seed: 42 });

  const baseScoreMap: Record<string, number> = {};
  const rankProbMap: Record<string, number> = {};

  const rows: RankedCompareRow[] = strategies.map((strategy, idx) => {
    const score = Number((scores[idx] ?? 0).toFixed(3));
    const winProb = Number((mc.probabilityFirst[idx] ?? 0).toFixed(3));
    const nitrogen = estimateNitrogenOffsetSummary(strategy);

    baseScoreMap[strategy.code] = score;
    rankProbMap[strategy.code] = winProb;

    return {
      strategy,
      baseScore: score,
      winProb,
      ureaBagsSavedPerHa: nitrogen.ureaBagsSavedPerHa,
      ureaKgSavedPerHa: Math.round(nitrogen.ureaBagsSavedPerHa * 50),
      bareDaysAvoided: nitrogen.bareDaysAvoided,
    };
  });

  rows.sort((a, b) => b.baseScore - a.baseScore);
  return { rows, baseScoreMap, rankProbMap };
}

/**
 * Build an SMS/WhatsApp summary widget for a chosen strategy in chat.
 */
export function buildSmsWidgetForStrategy(params: {
  cellId: string;
  strategy: RotationStrategySpec;
  weights: PriorityWeightsTuple;
  stressId: ClimateStressId;
  strategies: RotationStrategySpec[];
}): ChatWidget {
  const { rows } = computeCompareRows(
    params.strategies,
    params.weights,
    params.stressId,
  );
  const match =
    rows.find((r) => r.strategy.code === params.strategy.code) ?? rows[0];
  const scenario =
    CLIMATE_STRESS_SCENARIOS.find((s) => s.id === params.stressId) ??
    CLIMATE_STRESS_SCENARIOS[0];

  const message = buildSmsSummaryCard({
    cellId: params.cellId,
    strategy: params.strategy,
    baseScorePct: Math.round((match?.baseScore ?? 0.5) * 100),
    winProbPct: Math.round((match?.winProb ?? 0.5) * 100),
    scenarioLabel: scenario.shortLabel,
  });

  return {
    type: 'sms_share',
    cellId: params.cellId,
    strategyCode: params.strategy.code,
    strategyName: params.strategy.name,
    message,
  };
}

/**
 * Match direct farmer commands so every operation executes inside the chat
 * and returns a minimal reply + an interactive component.
 */
export function resolveLocalChatCommand(params: {
  message: string;
  cellId: string;
  weights: PriorityWeightsTuple;
  farmAreaHa: number;
  strategies: RotationStrategySpec[];
}): LocalCommandResult | null {
  const lower = params.message.trim().toLowerCase();
  const cell =
    ASHANTI_PILOT_CELLS.find((c) => c.cellId === params.cellId) ??
    ASHANTI_PILOT_CELLS[0];

  if (
    lower.includes('compare') ||
    lower.includes('all options') ||
    lower.includes('other crops') ||
    lower.includes('show strategies')
  ) {
    let stressId: ClimateStressId = 'baseline';
    if (lower.includes('severe')) {
      stressId = 'severe_heat_drought';
    } else if (lower.includes('drought') || lower.includes('dry')) {
      stressId = 'moderate_drought';
    } else if (lower.includes('rain') || lower.includes('squall')) {
      stressId = 'intense_rainfall';
    }

    const weights =
      params.weights.length === 4
        ? params.weights
        : ([...PRIORITY_PRESETS[0].weights] as PriorityWeightsTuple);

    return {
      reply: `Tap a focus or weather below, then choose the crop plan that fits your farm.`,
      widget: {
        type: 'compare',
        cellId: cell.cellId,
        stressId,
        weights,
      },
    };
  }

  if (
    lower.includes('calendar') ||
    lower.includes('planting date') ||
    lower.includes('planting window') ||
    lower.includes('when to plant') ||
    lower.includes('harmattan')
  ) {
    const focus = lower.includes('bare') || lower.includes('harmattan')
      ? 'bare'
      : 'planting';
    return {
      reply: `Here are the rain and planting windows for ${cell.zoneName}.`,
      widget: {
        type: 'calendar',
        cellId: cell.cellId,
        zoneName: cell.zoneName,
        focus,
      },
    };
  }

  if (
    lower.includes('switch zone') ||
    lower.includes('change zone') ||
    lower.includes('change farm') ||
    lower.includes('farm size') ||
    lower.includes('hectare') ||
    lower.includes('pick village')
  ) {
    return {
      reply: `Pick your zone and farm size below.`,
      widget: {
        type: 'zone_picker',
        currentCellId: cell.cellId,
        currentAreaHa: params.farmAreaHa,
      },
    };
  }

  if (
    lower.includes('share sms') ||
    lower.includes('send sms') ||
    lower.includes('whatsapp')
  ) {
    const { rows } = computeCompareRows(
      params.strategies,
      params.weights,
      'baseline',
    );
    const top = rows[0]?.strategy ?? params.strategies[0];
    return {
      reply: `Ready to share ${top.name} in English and Twi.`,
      widget: buildSmsWidgetForStrategy({
        cellId: cell.cellId,
        strategy: top,
        weights: params.weights,
        stressId: 'baseline',
        strategies: params.strategies,
      }),
    };
  }

  return null;
}
