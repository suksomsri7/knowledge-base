import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { validateApiKey, unauthorizedResponse } from "@/lib/kb-search";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export async function GET(request: NextRequest, { params }: Params) {
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const { id } = await params;

  const [category] = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      sortOrder: categories.sortOrder,
      itemCount: sql<number>`(
        SELECT count(*) FROM knowledge_items
        WHERE knowledge_items.category_id = ${categories.id}
        AND knowledge_items.is_active = true
      )`,
      createdAt: categories.createdAt,
    })
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.agentId, agent.id)))
    .limit(1);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({ category });
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
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.agentId, agent.id)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.sortOrder !== undefined) updateData.sortOrder = parsed.data.sortOrder;

  const [updated] = await db
    .update(categories)
    .set(updateData)
    .where(eq(categories.id, id))
    .returning();

  return NextResponse.json({ category: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const { id } = await params;

  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.agentId, agent.id)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  await db.delete(categories).where(eq(categories.id, id));

  return NextResponse.json({ message: "Category deleted" });
}
