import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { escalations, categories, users } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { validateApiKey, unauthorizedResponse } from "@/lib/kb-search";

export async function GET(request: NextRequest) {
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const url = request.nextUrl.searchParams;
  const status = url.get("status");
  const priority = url.get("priority");
  const page = Math.max(1, Number(url.get("page") ?? 1));
  const limit = Math.min(Number(url.get("limit") ?? 50), 100);
  const offset = (page - 1) * limit;

  const conditions = [eq(escalations.agentId, agent.id)];
  if (status) conditions.push(eq(escalations.status, status));
  if (priority) conditions.push(eq(escalations.priority, priority));

  const [items, countResult] = await Promise.all([
    db
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
      .where(and(...conditions))
      .orderBy(desc(escalations.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(escalations)
      .where(and(...conditions)),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return NextResponse.json({
    escalations: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
