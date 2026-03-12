import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { flows, flowSteps } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { validateApiKey, unauthorizedResponse } from "@/lib/kb-search";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  triggerKeywords: z.array(z.string()).optional(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: Params) {
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const { id } = await params;

  const [flow] = await db
    .select()
    .from(flows)
    .where(and(eq(flows.id, id), eq(flows.agentId, agent.id)))
    .limit(1);

  if (!flow) {
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }

  const steps = await db
    .select()
    .from(flowSteps)
    .where(eq(flowSteps.flowId, flow.id))
    .orderBy(asc(flowSteps.stepOrder));

  return NextResponse.json({
    flow: {
      ...flow,
      steps: steps.map((s) => ({
        id: s.id,
        stepOrder: s.stepOrder,
        type: s.type,
        message: s.message,
        options: s.options,
        nextStepId: s.nextStepId,
        isFinal: s.isFinal,
      })),
    },
  });
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
    .select({ id: flows.id })
    .from(flows)
    .where(and(eq(flows.id, id), eq(flows.agentId, agent.id)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.triggerKeywords !== undefined) updateData.triggerKeywords = parsed.data.triggerKeywords;
  if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority;
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;

  const [updated] = await db
    .update(flows)
    .set(updateData)
    .where(eq(flows.id, id))
    .returning();

  return NextResponse.json({ flow: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const { id } = await params;

  const [existing] = await db
    .select({ id: flows.id })
    .from(flows)
    .where(and(eq(flows.id, id), eq(flows.agentId, agent.id)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }

  await db.delete(flows).where(eq(flows.id, id));

  return NextResponse.json({ message: "Flow and all steps deleted" });
}
