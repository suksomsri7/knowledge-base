import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { escalations, knowledgeItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { validateApiKey, unauthorizedResponse } from "@/lib/kb-search";
import { z } from "zod";

const resolveSchema = z.object({
  answer: z.string().min(1),
  resolutionType: z.enum(["answered", "added_to_kb", "redirected", "not_relevant"]),
  adminNotes: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  keywords: z.array(z.string()).optional().default([]),
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

  const parsed = resolveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [esc] = await db
    .select()
    .from(escalations)
    .where(and(eq(escalations.id, id), eq(escalations.agentId, agent.id)))
    .limit(1);

  if (!esc) {
    return NextResponse.json({ error: "Escalation not found" }, { status: 404 });
  }

  await db
    .update(escalations)
    .set({
      status: "resolved",
      resolutionType: parsed.data.resolutionType,
      answer: parsed.data.answer,
      adminNotes: parsed.data.adminNotes ?? null,
      resolvedAt: new Date(),
    })
    .where(eq(escalations.id, id));

  let knowledgeItemId: string | null = null;

  if (parsed.data.resolutionType === "added_to_kb") {
    const [item] = await db
      .insert(knowledgeItems)
      .values({
        agentId: agent.id,
        categoryId: parsed.data.categoryId ?? null,
        type: "faq",
        question: esc.question,
        answer: parsed.data.answer,
        keywords: parsed.data.keywords,
        source: "from_escalation",
        escalationId: id,
      })
      .returning({ id: knowledgeItems.id });
    knowledgeItemId = item.id;
  }

  return NextResponse.json({
    message: "Escalation resolved",
    knowledgeItemId,
  });
}
