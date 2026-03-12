"use server";

import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { logAudit } from "@/lib/actions/audit-actions";
import crypto from "crypto";

function generateApiKey(): string {
  return "ka_" + crypto.randomBytes(24).toString("hex");
}

const agentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
});

export async function createAgent(brandId: string, brandSlug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = agentSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  const slug = slugify(parsed.name) || "agent-" + Date.now().toString(36);
  const apiKey = generateApiKey();

  const [agent] = await db
    .insert(agents)
    .values({
      brandId,
      name: parsed.name,
      slug,
      description: parsed.description ?? null,
      apiKey,
      createdBy: session.user.id,
    })
    .returning();

  await logAudit({
    userId: session.user.id,
    brandId,
    action: "create",
    resourceType: "agent",
    resourceId: agent.id,
    details: { name: parsed.name },
  });

  revalidatePath(`/brand/${brandSlug}/agents`);
  return agent;
}

export async function updateAgent(agentId: string, brandSlug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = agentSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  await db
    .update(agents)
    .set({
      name: parsed.name,
      description: parsed.description ?? null,
      updatedAt: new Date(),
    })
    .where(eq(agents.id, agentId));

  await logAudit({
    userId: session.user.id,
    action: "update",
    resourceType: "agent",
    resourceId: agentId,
    details: { name: parsed.name },
  });

  revalidatePath(`/brand/${brandSlug}/agents`);
}

export async function deleteAgent(agentId: string, brandSlug: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.delete(agents).where(eq(agents.id, agentId));

  await logAudit({
    userId: session.user.id,
    action: "delete",
    resourceType: "agent",
    resourceId: agentId,
  });

  revalidatePath(`/brand/${brandSlug}/agents`);
}

export async function toggleAgentActive(agentId: string, isActive: boolean, brandSlug: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.update(agents).set({ isActive, updatedAt: new Date() }).where(eq(agents.id, agentId));

  revalidatePath(`/brand/${brandSlug}/agents`);
}

export async function regenerateApiKey(agentId: string, brandSlug: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const newKey = generateApiKey();
  await db
    .update(agents)
    .set({ apiKey: newKey, updatedAt: new Date() })
    .where(eq(agents.id, agentId));

  await logAudit({
    userId: session.user.id,
    action: "regenerate_api_key",
    resourceType: "agent",
    resourceId: agentId,
  });

  revalidatePath(`/brand/${brandSlug}/agents`);
  return newKey;
}

export async function updateAgentSettings(agentId: string, brandSlug: string, agentSlug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const answerThreshold = Math.min(100, Math.max(0, Number(formData.get("answerThreshold") ?? 75)));
  const escalateThreshold = Math.min(100, Math.max(0, Number(formData.get("escalateThreshold") ?? 40)));

  await db
    .update(agents)
    .set({
      answerThreshold,
      escalateThreshold,
      disclaimerMessage: (formData.get("disclaimerMessage") as string) || null,
      noAnswerMessage: (formData.get("noAnswerMessage") as string) || null,
      updatedAt: new Date(),
    })
    .where(eq(agents.id, agentId));

  revalidatePath(`/brand/${brandSlug}/agents/${agentSlug}/settings`);
}
