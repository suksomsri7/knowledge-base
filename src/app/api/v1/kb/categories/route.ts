import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, knowledgeItems } from "@/lib/db/schema";
import { eq, and, sql, asc } from "drizzle-orm";
import { validateApiKey, unauthorizedResponse } from "@/lib/kb-search";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
});

export async function GET(request: NextRequest) {
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const items = await db
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
    .where(eq(categories.agentId, agent.id))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return NextResponse.json({ categories: items });
}

export async function POST(request: NextRequest) {
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

  const slug = slugify(parsed.data.name);

  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.agentId, agent.id), eq(categories.slug, slug)))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Category with this name already exists" },
      { status: 409 }
    );
  }

  const [category] = await db
    .insert(categories)
    .values({
      agentId: agent.id,
      name: parsed.data.name,
      slug,
      description: parsed.data.description ?? null,
      sortOrder: parsed.data.sortOrder,
    })
    .returning();

  return NextResponse.json({ category }, { status: 201 });
}
