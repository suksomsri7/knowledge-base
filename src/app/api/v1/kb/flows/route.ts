import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { flows, flowSteps } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { validateApiKey, unauthorizedResponse } from "@/lib/kb-search";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  triggerKeywords: z.array(z.string()).optional().default([]),
  priority: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  const activeOnly = request.nextUrl.searchParams.get("active_only") !== "false";
  const conditions = [eq(flows.agentId, agent.id)];
  if (activeOnly) conditions.push(eq(flows.isActive, true));

  const items = await db
    .select({
      id: flows.id,
      name: flows.name,
      description: flows.description,
      triggerKeywords: flows.triggerKeywords,
      priority: flows.priority,
      isActive: flows.isActive,
      stepsCount: sql<number>`(SELECT count(*) FROM flow_steps WHERE flow_steps.flow_id = ${flows.id})`,
      createdAt: flows.createdAt,
      updatedAt: flows.updatedAt,
    })
    .from(flows)
    .where(and(...conditions))
    .orderBy(desc(flows.priority), desc(flows.updatedAt));

  return NextResponse.json({ flows: items });
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

  const [flow] = await db
    .insert(flows)
    .values({
      agentId: agent.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      triggerKeywords: parsed.data.triggerKeywords,
      priority: parsed.data.priority,
      isActive: parsed.data.isActive,
    })
    .returning();

  return NextResponse.json({ flow }, { status: 201 });
}
