"use server";

import { db } from "@/lib/db";
import { flows, flowSteps } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/actions/audit-actions";
import type { FlowStepOption } from "@/lib/db/schema";

const flowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  triggerKeywords: z.string().optional(),
  priority: z.coerce.number().default(0),
});

export async function createFlow(agentId: string, brandSlug: string, agentSlug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = flowSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    triggerKeywords: formData.get("triggerKeywords") || "",
    priority: formData.get("priority") || 0,
  });

  const keywords = parsed.triggerKeywords
    ? parsed.triggerKeywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [];

  const [flow] = await db
    .insert(flows)
    .values({
      agentId,
      name: parsed.name,
      description: parsed.description ?? null,
      triggerKeywords: keywords,
      priority: parsed.priority,
      createdBy: session.user.id,
    })
    .returning();

  await logAudit({
    userId: session.user.id,
    action: "create",
    resourceType: "flow",
    resourceId: flow.id,
    details: { name: parsed.name },
  });

  revalidatePath(`/brand/${brandSlug}/agents/${agentSlug}/flows`);
  return flow;
}

export async function updateFlow(flowId: string, brandSlug: string, agentSlug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = flowSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    triggerKeywords: formData.get("triggerKeywords") || "",
    priority: formData.get("priority") || 0,
  });

  const keywords = parsed.triggerKeywords
    ? parsed.triggerKeywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [];

  await db
    .update(flows)
    .set({
      name: parsed.name,
      description: parsed.description ?? null,
      triggerKeywords: keywords,
      priority: parsed.priority,
      updatedAt: new Date(),
    })
    .where(eq(flows.id, flowId));

  revalidatePath(`/brand/${brandSlug}/agents/${agentSlug}/flows`);
}

export async function deleteFlow(flowId: string, brandSlug: string, agentSlug: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.delete(flows).where(eq(flows.id, flowId));

  await logAudit({
    userId: session.user.id,
    action: "delete",
    resourceType: "flow",
    resourceId: flowId,
  });

  revalidatePath(`/brand/${brandSlug}/agents/${agentSlug}/flows`);
}

export async function toggleFlowActive(flowId: string, isActive: boolean, brandSlug: string, agentSlug: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.update(flows).set({ isActive, updatedAt: new Date() }).where(eq(flows.id, flowId));

  revalidatePath(`/brand/${brandSlug}/agents/${agentSlug}/flows`);
}

export async function saveFlowStep(
  flowId: string,
  brandSlug: string,
  agentSlug: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const stepId = formData.get("stepId") as string | null;
  const type = formData.get("type") as string;
  const message = formData.get("message") as string;
  const isFinal = formData.get("isFinal") === "true";
  const optionsJson = formData.get("options") as string;
  const options: FlowStepOption[] = optionsJson ? JSON.parse(optionsJson) : [];

  if (stepId) {
    await db
      .update(flowSteps)
      .set({ type, message, options, isFinal, updatedAt: new Date() })
      .where(eq(flowSteps.id, stepId));
  } else {
    const maxOrder = await db
      .select({ max: sql<number>`COALESCE(MAX(${flowSteps.stepOrder}), 0)` })
      .from(flowSteps)
      .where(eq(flowSteps.flowId, flowId));

    await db.insert(flowSteps).values({
      flowId,
      stepOrder: (maxOrder[0]?.max ?? 0) + 1,
      type,
      message,
      options,
      isFinal,
    });
  }

  revalidatePath(`/brand/${brandSlug}/agents/${agentSlug}/flows/${flowId}`);
}

export async function deleteFlowStep(stepId: string, brandSlug: string, agentSlug: string, flowId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.delete(flowSteps).where(eq(flowSteps.id, stepId));

  revalidatePath(`/brand/${brandSlug}/agents/${agentSlug}/flows/${flowId}`);
}
