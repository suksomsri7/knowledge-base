import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { flows, flowSteps } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { validateApiKey, unauthorizedResponse } from "@/lib/kb-search";
import { z } from "zod";
import type { FlowStepOption } from "@/lib/db/schema";

type Params = { params: Promise<{ id: string; stepId: string }> };

const optionSchema = z.object({
  label: z.string().min(1),
  keywords: z.array(z.string()).default([]),
  nextStepId: z.string().uuid().nullable().default(null),
});

const updateStepSchema = z.object({
  type: z.enum(["message", "options", "input", "end"]).optional(),
  message: z.string().min(1).optional(),
  options: z.array(optionSchema).optional(),
  nextStepId: z.string().uuid().optional().nullable(),
  isFinal: z.boolean().optional(),
  stepOrder: z.number().int().optional(),
});

export async function PUT(request: NextRequest, { params }: Params) {
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const { id: flowId, stepId } = await params;

  const [flow] = await db
    .select({ id: flows.id })
    .from(flows)
    .where(and(eq(flows.id, flowId), eq(flows.agentId, agent.id)))
    .limit(1);

  if (!flow) {
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }

  const [existing] = await db
    .select({ id: flowSteps.id })
    .from(flowSteps)
    .where(and(eq(flowSteps.id, stepId), eq(flowSteps.flowId, flowId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Step not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateStepSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
  if (parsed.data.message !== undefined) updateData.message = parsed.data.message;
  if (parsed.data.options !== undefined) updateData.options = parsed.data.options as FlowStepOption[];
  if (parsed.data.nextStepId !== undefined) updateData.nextStepId = parsed.data.nextStepId;
  if (parsed.data.isFinal !== undefined) updateData.isFinal = parsed.data.isFinal;
  if (parsed.data.stepOrder !== undefined) updateData.stepOrder = parsed.data.stepOrder;

  const [updated] = await db
    .update(flowSteps)
    .set(updateData)
    .where(eq(flowSteps.id, stepId))
    .returning();

  return NextResponse.json({ step: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const { id: flowId, stepId } = await params;

  const [flow] = await db
    .select({ id: flows.id })
    .from(flows)
    .where(and(eq(flows.id, flowId), eq(flows.agentId, agent.id)))
    .limit(1);

  if (!flow) {
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }

  const [existing] = await db
    .select({ id: flowSteps.id })
    .from(flowSteps)
    .where(and(eq(flowSteps.id, stepId), eq(flowSteps.flowId, flowId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Step not found" }, { status: 404 });
  }

  await db.delete(flowSteps).where(eq(flowSteps.id, stepId));

  return NextResponse.json({ message: "Step deleted" });
}
