import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { escalations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { validateApiKey, unauthorizedResponse } from "@/lib/kb-search";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const { id } = await params;

  const [existing] = await db
    .select({ id: escalations.id })
    .from(escalations)
    .where(and(eq(escalations.id, id), eq(escalations.agentId, agent.id)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Escalation not found" }, { status: 404 });
  }

  await db
    .update(escalations)
    .set({
      status: "dismissed",
      resolutionType: "not_relevant",
      resolvedAt: new Date(),
    })
    .where(eq(escalations.id, id));

  return NextResponse.json({ message: "Escalation dismissed" });
}
