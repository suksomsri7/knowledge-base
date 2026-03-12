import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { flowSteps, flows, agents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { validateApiKey, unauthorizedResponse } from "@/lib/kb-search";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const { stepId } = await params;

  const [step] = await db
    .select({
      id: flowSteps.id,
      flowId: flowSteps.flowId,
      stepOrder: flowSteps.stepOrder,
      type: flowSteps.type,
      message: flowSteps.message,
      options: flowSteps.options,
      nextStepId: flowSteps.nextStepId,
      isFinal: flowSteps.isFinal,
    })
    .from(flowSteps)
    .innerJoin(flows, eq(flowSteps.flowId, flows.id))
    .where(and(eq(flowSteps.id, stepId), eq(flows.agentId, agent.id)))
    .limit(1);

  if (!step) {
    return NextResponse.json({ error: "Step not found" }, { status: 404 });
  }

  return NextResponse.json({ step });
}
