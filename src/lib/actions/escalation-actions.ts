"use server";

import { db } from "@/lib/db";
import { escalations, knowledgeItems } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/actions/audit-actions";

export async function resolveEscalation(
  escalationId: string,
  brandSlug: string,
  agentSlug: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const resolutionType = formData.get("resolutionType") as string;
  const answer = formData.get("answer") as string;
  const adminNotes = formData.get("adminNotes") as string | null;

  await db
    .update(escalations)
    .set({
      status: "resolved",
      resolutionType,
      answer,
      adminNotes: adminNotes || null,
      resolvedBy: session.user.id,
      resolvedAt: new Date(),
    })
    .where(eq(escalations.id, escalationId));

  if (resolutionType === "added_to_kb") {
    const [esc] = await db.select().from(escalations).where(eq(escalations.id, escalationId)).limit(1);
    if (esc) {
      const rawCatId = formData.get("categoryId") as string | null;
      const categoryId = rawCatId && rawCatId !== "none" ? rawCatId : null;
      const keywordsStr = formData.get("keywords") as string | null;
      const keywords = keywordsStr
        ? keywordsStr.split(",").map((k) => k.trim()).filter(Boolean)
        : [];

      await db.insert(knowledgeItems).values({
        agentId: esc.agentId,
        categoryId: categoryId || null,
        type: "faq",
        question: esc.question,
        answer,
        keywords,
        source: "from_escalation",
        escalationId: escalationId,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      });
    }
  }

  await logAudit({
    userId: session.user.id,
    action: "resolve_escalation",
    resourceType: "escalation",
    resourceId: escalationId,
    details: { resolutionType },
  });

  revalidatePath(`/brand/${brandSlug}/agents/${agentSlug}/escalations`);
}

export async function assignEscalation(
  escalationId: string,
  userId: string,
  brandSlug: string,
  agentSlug: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db
    .update(escalations)
    .set({ assignedTo: userId, status: "in_progress" })
    .where(eq(escalations.id, escalationId));

  revalidatePath(`/brand/${brandSlug}/agents/${agentSlug}/escalations`);
}

export async function dismissEscalation(escalationId: string, brandSlug: string, agentSlug: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db
    .update(escalations)
    .set({
      status: "dismissed",
      resolutionType: "not_relevant",
      resolvedBy: session.user.id,
      resolvedAt: new Date(),
    })
    .where(eq(escalations.id, escalationId));

  revalidatePath(`/brand/${brandSlug}/agents/${agentSlug}/escalations`);
}
