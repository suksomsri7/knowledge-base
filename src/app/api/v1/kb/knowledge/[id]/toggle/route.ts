import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { knowledgeItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { validateApiKey, unauthorizedResponse } from "@/lib/kb-search";
import { z } from "zod";

const toggleSchema = z.object({
  isActive: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = toggleSchema.safeParse(body);
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

  const [updated] = await db
    .update(knowledgeItems)
    .set({ isActive: parsed.data.isActive, updatedAt: new Date() })
    .where(eq(knowledgeItems.id, id))
    .returning();

  return NextResponse.json({ item: updated });
}
