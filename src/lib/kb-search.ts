import { db } from "@/lib/db";
import { agents, knowledgeItems, flows, flowSteps, kbApiLogs } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function validateApiKey(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) return null;

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.apiKey, apiKey), eq(agents.isActive, true)))
    .limit(1);

  return agent ?? null;
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Invalid or missing API key" },
    { status: 401 }
  );
}

interface SearchResult {
  id: string;
  type: string;
  question: string;
  answer: string;
  category: string | null;
  keywords: string[] | null;
  tags: string[] | null;
  confidence: number;
}

interface FlowMatch {
  matched: boolean;
  id?: string;
  name?: string;
  firstStep?: {
    id: string;
    type: string;
    message: string;
    options: unknown;
    isFinal: boolean;
  };
  confidence?: number;
}

function getNgrams(text: string, n: number): Set<string> {
  const grams = new Set<string>();
  const clean = text.replace(/\s+/g, ' ').trim();
  for (let i = 0; i <= clean.length - n; i++) {
    grams.add(clean.substring(i, i + n));
  }
  return grams;
}

function ngramSimilarity(a: string, b: string, n: number = 3): number {
  const gramsA = getNgrams(a, n);
  const gramsB = getNgrams(b, n);
  if (gramsA.size === 0 || gramsB.size === 0) return 0;
  let intersection = 0;
  for (const g of gramsA) {
    if (gramsB.has(g)) intersection++;
  }
  return intersection / Math.max(gramsA.size, gramsB.size);
}

function calculateConfidence(query: string, item: {
  question: string;
  answer: string;
  keywords: string[] | null;
}): number {
  const q = query.toLowerCase().trim();
  const question = item.question.toLowerCase();
  const answer = item.answer.toLowerCase();
  const keywords = (item.keywords ?? []).map((k) => k.toLowerCase());

  if (question === q) return 98;
  if (question.includes(q) || q.includes(question)) return 90;

  const sim = ngramSimilarity(q, question);
  if (sim >= 0.65) return Math.round(60 + sim * 35);

  const queryWords = q.split(/\s+/).filter((w) => w.length > 1);

  const allFragments = new Set<string>();
  for (const w of queryWords) {
    allFragments.add(w);
    if (w.length > 6) {
      for (let i = 0; i < w.length - 5; i++) {
        allFragments.add(w.substring(i, i + 6));
      }
    }
  }

  let fragmentHits = 0;
  for (const f of allFragments) {
    if (question.includes(f)) fragmentHits++;
  }
  const fragmentRatio = allFragments.size > 0 ? fragmentHits / allFragments.size : 0;

  if (fragmentRatio >= 0.6) return Math.round(50 + fragmentRatio * 30);
  if (fragmentRatio >= 0.3) return Math.round(30 + fragmentRatio * 40);

  const keywordMatches = queryWords.filter((w) =>
    keywords.some((kw) => kw.includes(w) || w.includes(kw))
  ).length;
  const keywordFragments = queryWords.filter((w) =>
    keywords.some((kw) => ngramSimilarity(w, kw) >= 0.5)
  ).length;
  const totalKeywordHits = Math.max(keywordMatches, keywordFragments);
  const keywordRatio = queryWords.length > 0 ? totalKeywordHits / queryWords.length : 0;
  if (keywordRatio >= 0.3) return Math.round(40 + keywordRatio * 30);

  const answerSim = ngramSimilarity(q, answer);
  if (answerSim >= 0.3) return Math.round(20 + answerSim * 40);

  if (fragmentHits > 0 || sim > 0.1) {
    return Math.min(25, Math.max(fragmentHits * 5, Math.round(sim * 30)));
  }

  return 0;
}

function calculateFlowConfidence(query: string, triggerKeywords: string[]): number {
  const q = query.toLowerCase().trim();
  const triggers = triggerKeywords.map((k) => k.toLowerCase());

  for (const trigger of triggers) {
    if (q.includes(trigger) || trigger.includes(q)) return 95;
  }

  const queryWords = q.split(/\s+/).filter((w) => w.length > 1);
  const matchCount = queryWords.filter((w) =>
    triggers.some((t) => t.includes(w))
  ).length;

  if (matchCount > 0) return Math.min(80, 40 + matchCount * 20);
  return 0;
}

export async function searchKnowledge(
  agentId: string,
  query: string,
  limit: number = 3
): Promise<SearchResult[]> {
  const items = await db
    .select({
      id: knowledgeItems.id,
      type: knowledgeItems.type,
      question: knowledgeItems.question,
      answer: knowledgeItems.answer,
      keywords: knowledgeItems.keywords,
      tags: knowledgeItems.tags,
      categoryName: sql<string | null>`(
        SELECT name FROM categories WHERE categories.id = ${knowledgeItems.categoryId}
      )`,
    })
    .from(knowledgeItems)
    .where(
      and(
        eq(knowledgeItems.agentId, agentId),
        eq(knowledgeItems.isActive, true)
      )
    );

  const scored = items
    .map((item) => ({
      id: item.id,
      type: item.type,
      question: item.question,
      answer: item.answer,
      category: item.categoryName,
      keywords: item.keywords,
      tags: item.tags,
      confidence: calculateConfidence(query, item),
    }))
    .filter((item) => item.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);

  return scored;
}

export async function searchFlows(
  agentId: string,
  query: string
): Promise<FlowMatch> {
  const allFlows = await db
    .select()
    .from(flows)
    .where(and(eq(flows.agentId, agentId), eq(flows.isActive, true)));

  let bestFlow = null;
  let bestConfidence = 0;

  for (const flow of allFlows) {
    const confidence = calculateFlowConfidence(query, flow.triggerKeywords);
    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestFlow = flow;
    }
  }

  if (!bestFlow || bestConfidence < 30) {
    return { matched: false };
  }

  const [firstStep] = await db
    .select()
    .from(flowSteps)
    .where(eq(flowSteps.flowId, bestFlow.id))
    .orderBy(flowSteps.stepOrder)
    .limit(1);

  if (!firstStep) return { matched: false };

  return {
    matched: true,
    id: bestFlow.id,
    name: bestFlow.name,
    firstStep: {
      id: firstStep.id,
      type: firstStep.type,
      message: firstStep.message,
      options: firstStep.options,
      isFinal: firstStep.isFinal,
    },
    confidence: bestConfidence,
  };
}

export function getRecommendation(
  knowledgeConfidence: number,
  flowConfidence: number,
  answerThreshold: number,
  escalateThreshold: number
): string {
  if (flowConfidence >= answerThreshold) return "use_flow";

  const topConfidence = Math.max(knowledgeConfidence, flowConfidence);
  if (topConfidence >= answerThreshold) return "auto_answer";
  if (topConfidence >= escalateThreshold) return "answer_with_disclaimer";
  if (topConfidence > 0) return "escalate";
  return "no_results";
}

export async function logApiCall(
  agentId: string,
  endpoint: string,
  query: string | null,
  resultsCount: number,
  topConfidence: number | null,
  recommendation: string | null,
  responseMs: number,
  ipAddress: string | null
) {
  await db.insert(kbApiLogs).values({
    agentId,
    endpoint,
    query,
    resultsCount,
    topConfidence,
    recommendation,
    responseMs,
    ipAddress,
  });
}
