import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { escalations } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { validateApiKey, unauthorizedResponse } from "@/lib/kb-search";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const { id } = await params;

  const [escalation] = await db
    .select({
      id: escalations.id,
      question: escalations.question,
      customerContext: escalations.customerContext,
      aiAttemptedAnswer: escalations.aiAttemptedAnswer,
      status: escalations.status,
      priority: escalations.priority,
      categoryId: escalations.categoryId,
      categoryName: sql<string | null>`(SELECT name FROM categories WHERE categories.id = ${escalations.categoryId})`,
      assignedTo: escalations.assignedTo,
      assigneeName: sql<string | null>`(SELECT display_name FROM users WHERE users.id = ${escalations.assignedTo})`,
      resolutionType: escalations.resolutionType,
      answer: escalations.answer,
      adminNotes: escalations.adminNotes,
      resolvedAt: escalations.resolvedAt,
      sessionId: escalations.sessionId,
      createdAt: escalations.createdAt,
    })
    .from(escalations)
    .where(and(eq(escalations.id, id), eq(escalations.agentId, agent.id)))
    .limit(1);

  if (!escalation) {
    return NextResponse.json({ error: "Escalation not found" }, { status: 404 });
  }

  return NextResponse.json({ escalation });
}
