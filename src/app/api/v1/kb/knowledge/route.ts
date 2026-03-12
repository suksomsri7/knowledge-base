import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { knowledgeItems, categories } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { validateApiKey, unauthorizedResponse, logApiCall } from "@/lib/kb-search";
import { z } from "zod";

const createSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1),
  type: z.enum(["faq", "info", "procedure"]).default("faq"),
  categoryId: z.string().uuid().optional().nullable(),
  keywords: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  const start = Date.now();
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const url = request.nextUrl.searchParams;
  const page = Math.max(1, Number(url.get("page") ?? 1));
  const limit = Math.min(Number(url.get("limit") ?? 50), 100);
  const categoryId = url.get("category_id");
  const type = url.get("type");
  const activeOnly = url.get("active_only") !== "false";
  const offset = (page - 1) * limit;

  const conditions = [eq(knowledgeItems.agentId, agent.id)];
  if (activeOnly) conditions.push(eq(knowledgeItems.isActive, true));
  if (categoryId) conditions.push(eq(knowledgeItems.categoryId, categoryId));
  if (type) conditions.push(eq(knowledgeItems.type, type));

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: knowledgeItems.id,
        type: knowledgeItems.type,
        question: knowledgeItems.question,
        answer: knowledgeItems.answer,
        keywords: knowledgeItems.keywords,
        tags: knowledgeItems.tags,
        isActive: knowledgeItems.isActive,
        categoryId: knowledgeItems.categoryId,
        categoryName: sql<string | null>`(SELECT name FROM categories WHERE categories.id = ${knowledgeItems.categoryId})`,
        source: knowledgeItems.source,
        createdAt: knowledgeItems.createdAt,
        updatedAt: knowledgeItems.updatedAt,
      })
      .from(knowledgeItems)
      .where(and(...conditions))
      .orderBy(desc(knowledgeItems.updatedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(knowledgeItems)
      .where(and(...conditions)),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  await logApiCall(agent.id, "knowledge.list", null, items.length, null, null, Date.now() - start, null);

  return NextResponse.json({
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const start = Date.now();
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { question, answer, type, categoryId, keywords, tags, isActive } = parsed.data;

  if (categoryId) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.agentId, agent.id)))
      .limit(1);
    if (!cat) {
      return NextResponse.json({ error: "Category not found for this agent" }, { status: 400 });
    }
  }

  const [item] = await db
    .insert(knowledgeItems)
    .values({
      agentId: agent.id,
      type,
      question,
      answer,
      categoryId: categoryId ?? null,
      keywords,
      tags,
      isActive,
      source: "api",
    })
    .returning();

  await logApiCall(agent.id, "knowledge.create", question, 1, null, null, Date.now() - start, null);

  return NextResponse.json({ item }, { status: 201 });
}
