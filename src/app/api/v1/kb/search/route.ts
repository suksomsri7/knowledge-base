import { NextRequest, NextResponse } from "next/server";
import {
  validateApiKey,
  unauthorizedResponse,
  searchKnowledge,
  searchFlows,
  getRecommendation,
  logApiCall,
} from "@/lib/kb-search";

export async function GET(request: NextRequest) {
  const start = Date.now();
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const q = request.nextUrl.searchParams.get("q") ?? "";
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 3), 10);

  if (!q.trim()) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  const [knowledgeResults, flowMatch] = await Promise.all([
    searchKnowledge(agent.id, q, limit),
    searchFlows(agent.id, q),
  ]);

  const topKnowledgeConfidence = knowledgeResults[0]?.confidence ?? 0;
  const flowConfidence = flowMatch.confidence ?? 0;
  const recommendation = getRecommendation(
    topKnowledgeConfidence,
    flowConfidence,
    agent.answerThreshold,
    agent.escalateThreshold
  );

  const responseMs = Date.now() - start;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? null;

  await logApiCall(
    agent.id,
    "search",
    q,
    knowledgeResults.length,
    Math.max(topKnowledgeConfidence, flowConfidence) || null,
    recommendation,
    responseMs,
    ip
  );

  return NextResponse.json({
    query: q,
    knowledge: {
      results: knowledgeResults,
    },
    flow: flowMatch,
    threshold: {
      answer: agent.answerThreshold,
      escalate: agent.escalateThreshold,
    },
    recommendation,
    disclaimerMessage: recommendation === "answer_with_disclaimer" ? agent.disclaimerMessage : undefined,
    noAnswerMessage: recommendation === "escalate" || recommendation === "no_results" ? agent.noAnswerMessage : undefined,
  });
}
