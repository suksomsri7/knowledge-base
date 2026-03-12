import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { flows, flowSteps } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { validateApiKey, unauthorizedResponse } from "@/lib/kb-search";
import { z } from "zod";
import type { FlowStepOption } from "@/lib/db/schema";

const optionSchema = z.object({
  label: z.string().min(1),
  keywords: z.array(z.string()).default([]),
  nextStepId: z.string().uuid().nullable().default(null),
});

const createStepSchema = z.object({
  type: z.enum(["message", "options", "input", "end"]),
  message: z.string().min(1),
  options: z.array(optionSchema).optional().default([]),
  nextStepId: z.string().uuid().optional().nullable(),
  isFinal: z.boolean().optional().default(false),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const { id: flowId } = await params;

  const [flow] = await db
    .select({ id: flows.id })
    .from(flows)
    .where(and(eq(flows.id, flowId), eq(flows.agentId, agent.id)))
    .limit(1);

  if (!flow) {
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createStepSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const maxOrder = await db
    .select({ max: sql<number>`COALESCE(MAX(${flowSteps.stepOrder}), 0)` })
    .from(flowSteps)
    .where(eq(flowSteps.flowId, flowId));

  const [step] = await db
    .insert(flowSteps)
    .values({
      flowId,
      stepOrder: (maxOrder[0]?.max ?? 0) + 1,
      type: parsed.data.type,
      message: parsed.data.message,
      options: parsed.data.options as FlowStepOption[],
      nextStepId: parsed.data.nextStepId ?? null,
      isFinal: parsed.data.isFinal,
    })
    .returning();

  return NextResponse.json({ step }, { status: 201 });
}
