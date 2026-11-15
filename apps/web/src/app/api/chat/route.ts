import { NextResponse } from "next/server";
import {
  extractIntentRuleBased,
  formatFallbackChatReply,
  normalizeWeights,
  resolveCellId,
  resolveStressId,
  runChatDecisionPipeline,
  type ChatContextInput,
  type ChatIntentExtraction,
  type ChatLanguage,
  type ChatResultCard,
} from "@/lib/chat-pipeline";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const FREE_OPENROUTER_MODELS = [
  "openrouter/free",
  "nvidia/nemotron-3.5-lightning:free",
  "inclusionai/ling-3.2-flash:free",
] as const;

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callOpenRouter(params: {
  apiKey: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  maxTokens?: number;
}): Promise<{ content: string; model: string } | null> {
  const { apiKey, messages, temperature = 0.2, maxTokens = 700 } = params;

  for (const model of FREE_OPENROUTER_MODELS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 14000);
    try {
      const res = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://scalarfield.vercel.app",
          "X-Title": "ScalarField Farmer Advisor",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (!res.ok) {
        continue;
      }
      const data = (await res.json()) as {
        model?: string;
        choices?: Array<{ message?: { content?: string | null } }>;
      };
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content) {
        return { content, model: data.model || model };
      }
    } catch {
      // Try next free model in fallback chain
    }
  }

  return null;
}

function parseJsonSafely(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    message?: unknown;
    history?: Array<{ role?: string; content?: string }>;
    context?: ChatContextInput;
  };

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json(
      { ok: false, error: "Message is required." },
      { status: 400 },
    );
  }

  const context: ChatContextInput = body.context ?? {};
  const ruleIntent = extractIntentRuleBased(message, context);
  const apiKey = process.env.OPENROUTER_API_KEY?.trim() || "";

  let intent: ChatIntentExtraction = ruleIntent;
  let modelUsed = "deterministic-rule-engine";

  const recentHistory: OpenRouterMessage[] = Array.isArray(body.history)
    ? body.history
        .slice(-6)
        .filter(
          (item): item is { role: "user" | "assistant"; content: string } =>
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string" &&
            item.content.trim().length > 0,
        )
        .map((item) => ({ role: item.role, content: item.content.trim() }))
    : [];

  if (apiKey) {
    const extractionPrompt = [
      "You are the NLU parameter extractor for ScalarField (Ashanti, Ghana crop-rotation decision support).",
      "Extract JSON ONLY with keys:",
      '- "cellId": one of ["ASH_R05_C05","ASH_R04_C04","ASH_R06_C06","ASH_R05_C04","ASH_R05_C06"] (default to current context cellId)',
      '- "weights": array of 4 non-negative numbers [water_efficiency, soil_health, erosion_protection, income_market] summing to 1.0',
      '- "stressId": one of ["baseline","moderate_drought","severe_heat_drought","intense_rainfall"]',
      '- "language": "en" or "tw" (use "tw" if the user writes in Twi or asks for Twi)',
      '- "farmAreaHa": positive number (default from context or 2.0)',
      '- "needsClarification": boolean (true ONLY if the user sent a pure greeting like "hi" with zero farming question or context)',
      '- "clarificationQuestion": short friendly question if needsClarification is true',
      `Current mobile context: ${JSON.stringify({
        cellId: ruleIntent.cellId,
        weights: ruleIntent.weights,
        stressId: ruleIntent.stressId,
        farmAreaHa: ruleIntent.farmAreaHa,
      })}`,
    ].join("\n");

    const extracted = await callOpenRouter({
      apiKey,
      temperature: 0.1,
      maxTokens: 650,
      messages: [
        { role: "system", content: extractionPrompt },
        ...recentHistory,
        { role: "user", content: message },
      ],
    });

    if (extracted) {
      modelUsed = extracted.model;
      const parsed = parseJsonSafely(extracted.content);
      if (parsed) {
        const lang: ChatLanguage = parsed.language === "tw" ? "tw" : ruleIntent.language;
        const area =
          typeof parsed.farmAreaHa === "number" &&
          Number.isFinite(parsed.farmAreaHa) &&
          parsed.farmAreaHa > 0
            ? Number(parsed.farmAreaHa.toFixed(2))
            : ruleIntent.farmAreaHa;
        intent = {
          cellId: resolveCellId(
            typeof parsed.cellId === "string" ? parsed.cellId : ruleIntent.cellId,
          ),
          weights: Array.isArray(parsed.weights)
            ? normalizeWeights(parsed.weights as number[])
            : ruleIntent.weights,
          stressId: resolveStressId(
            typeof parsed.stressId === "string"
              ? parsed.stressId
              : ruleIntent.stressId,
          ),
          language: lang,
          farmAreaHa: area,
          needsClarification: Boolean(parsed.needsClarification),
          clarificationQuestion:
            typeof parsed.clarificationQuestion === "string"
              ? parsed.clarificationQuestion
              : undefined,
        };
      }
    }
  }

  if (intent.needsClarification && intent.clarificationQuestion) {
    return NextResponse.json({
      ok: true,
      reply: intent.clarificationQuestion,
      modelUsed,
      pipelineSource: "clarification",
      resultCard: null,
    });
  }

  const resultCard: ChatResultCard = await runChatDecisionPipeline(intent);
  let reply = formatFallbackChatReply(resultCard, intent.language);

  if (apiKey) {
    const synthesisPrompt = [
      "You are ScalarField Advisor helping an Ashanti smallholder farmer or extension officer.",
      "Write a warm, clear, practical answer (max 135 words) in the requested language (en = English, tw = Ashanti Twi).",
      "STRICT GROUNDING RULE: Use ONLY the exact numbers, strategy names, and caveats in PIPELINE_RESULT below. Do NOT invent yields, rainfall numbers, or probabilities not present in PIPELINE_RESULT.",
      "Always mention: (1) the top recommended rotation strategy and its MCDA score + Monte Carlo win %, (2) urea/fertilizer savings or climate regret insight, and (3) one short local verification note.",
      `LANGUAGE: ${intent.language}`,
      `PIPELINE_RESULT: ${JSON.stringify(resultCard)}`,
    ].join("\n");

    const synthesized = await callOpenRouter({
      apiKey,
      temperature: 0.3,
      maxTokens: 750,
      messages: [
        { role: "system", content: synthesisPrompt },
        { role: "user", content: message },
      ],
    });

    if (synthesized) {
      reply = synthesized.content;
      modelUsed = synthesized.model;
    }
  }

  return NextResponse.json({
    ok: true,
    reply,
    modelUsed,
    pipelineSource: resultCard.pipelineSource,
    resultCard,
  });
}
