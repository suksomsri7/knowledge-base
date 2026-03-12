import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { knowledgeItems, flows, flowSteps, categories } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { validateApiKey, unauthorizedResponse } from "@/lib/kb-search";

export async function GET(request: NextRequest) {
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const updatedAfter = request.nextUrl.searchParams.get("updated_after");
  const updatedDate = updatedAfter ? new Date(updatedAfter) : null;

  const knowledgeConditions = [
    eq(knowledgeItems.agentId, agent.id),
    eq(knowledgeItems.isActive, true),
  ];
  if (updatedDate) {
    knowledgeConditions.push(gte(knowledgeItems.updatedAt, updatedDate));
  }

  const items = await db
    .select({
      id: knowledgeItems.id,
      type: knowledgeItems.type,
      question: knowledgeItems.question,
      answer: knowledgeItems.answer,
      keywords: knowledgeItems.keywords,
      tags: knowledgeItems.tags,
      categoryName: categories.name,
      updatedAt: knowledgeItems.updatedAt,
    })
    .from(knowledgeItems)
    .leftJoin(categories, eq(knowledgeItems.categoryId, categories.id))
    .where(and(...knowledgeConditions));

  const flowConditions = [
    eq(flows.agentId, agent.id),
    eq(flows.isActive, true),
  ];
  if (updatedDate) {
    flowConditions.push(gte(flows.updatedAt, updatedDate));
  }

  const allFlows = await db
    .select()
    .from(flows)
    .where(and(...flowConditions));

  const flowsWithSteps = await Promise.all(
    allFlows.map(async (flow) => {
      const steps = await db
        .select()
        .from(flowSteps)
        .where(eq(flowSteps.flowId, flow.id))
        .orderBy(flowSteps.stepOrder);
      return {
        id: flow.id,
        name: flow.name,
        triggerKeywords: flow.triggerKeywords,
        steps: steps.map((s) => ({
          id: s.id,
          order: s.stepOrder,
          type: s.type,
          message: s.message,
          options: s.options,
          nextStepId: s.nextStepId,
          isFinal: s.isFinal,
        })),
      };
    })
  );

  return NextResponse.json({
    agent: agent.name,
    knowledgeItems: items,
    flows: flowsWithSteps,
    totalKnowledgeItems: items.length,
    totalFlows: flowsWithSteps.length,
    exportedAt: new Date().toISOString(),
  });
}
