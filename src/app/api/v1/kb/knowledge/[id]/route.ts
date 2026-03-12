import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { knowledgeItems, categories } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { validateApiKey, unauthorizedResponse } from "@/lib/kb-search";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  question: z.string().min(1).max(500).optional(),
  answer: z.string().min(1).optional(),
  type: z.enum(["faq", "info", "procedure"]).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  keywords: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: Params) {
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const { id } = await params;

  const [item] = await db
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
    .where(and(eq(knowledgeItems.id, id), eq(knowledgeItems.agentId, agent.id)))
    .limit(1);

  if (!item) {
    return NextResponse.json({ error: "Knowledge item not found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select({ id: knowledgeItems.id })
    .from(knowledgeItems)
    .where(and(eq(knowledgeItems.id, id), eq(knowledgeItems.agentId, agent.id)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Knowledge item not found" }, { status: 404 });
  }

  if (parsed.data.categoryId) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, parsed.data.categoryId), eq(categories.agentId, agent.id)))
      .limit(1);
    if (!cat) {
      return NextResponse.json({ error: "Category not found for this agent" }, { status: 400 });
    }
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.question !== undefined) updateData.question = parsed.data.question;
  if (parsed.data.answer !== undefined) updateData.answer = parsed.data.answer;
  if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
  if (parsed.data.categoryId !== undefined) updateData.categoryId = parsed.data.categoryId;
  if (parsed.data.keywords !== undefined) updateData.keywords = parsed.data.keywords;
  if (parsed.data.tags !== undefined) updateData.tags = parsed.data.tags;
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;

  const [updated] = await db
    .update(knowledgeItems)
    .set(updateData)
    .where(eq(knowledgeItems.id, id))
    .returning();

  return NextResponse.json({ item: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const { id } = await params;

  const [existing] = await db
    .select({ id: knowledgeItems.id })
    .from(knowledgeItems)
    .where(and(eq(knowledgeItems.id, id), eq(knowledgeItems.agentId, agent.id)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Knowledge item not found" }, { status: 404 });
  }

  await db.delete(knowledgeItems).where(eq(knowledgeItems.id, id));

  return NextResponse.json({ message: "Knowledge item deleted" });
}
