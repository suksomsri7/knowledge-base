"use server";

import { db } from "@/lib/db";
import { knowledgeItems, categories, escalations } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { logAudit } from "@/lib/actions/audit-actions";

const knowledgeSchema = z.object({
  type: z.enum(["faq", "info", "procedure"]).default("faq"),
  question: z.string().min(1).max(500),
  answer: z.string().min(1),
  categoryId: z.string().optional().nullable(),
  keywords: z.string().optional(),
  tags: z.string().optional(),
  reviewAt: z.string().optional(),
});

export async function createKnowledgeItem(
  agentId: string,
  brandSlug: string,
  agentSlug: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const rawCategoryId = formData.get("categoryId") as string | null;
  const parsed = knowledgeSchema.parse({
    type: formData.get("type") || "faq",
    question: formData.get("question"),
    answer: formData.get("answer"),
    categoryId: rawCategoryId && rawCategoryId !== "none" ? rawCategoryId : null,
    keywords: formData.get("keywords") || "",
    tags: formData.get("tags") || "",
    reviewAt: formData.get("reviewAt") || undefined,
  });

  const keywords = parsed.keywords
    ? parsed.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [];
  const tags = parsed.tags
    ? parsed.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const [item] = await db
    .insert(knowledgeItems)
    .values({
      agentId,
      type: parsed.type,
      question: parsed.question,
      answer: parsed.answer,
      categoryId: parsed.categoryId || null,
      keywords,
      tags,
      reviewAt: parsed.reviewAt ? new Date(parsed.reviewAt) : null,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    })
    .returning();

  await logAudit({
    userId: session.user.id,
    action: "create",
    resourceType: "knowledge_item",
    resourceId: item.id,
    details: { question: parsed.question },
  });

  revalidatePath(`/brand/${brandSlug}/agents/${agentSlug}/knowledge`);
  return item;
}

export async function updateKnowledgeItem(
  itemId: string,
  brandSlug: string,
  agentSlug: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const rawCatId = formData.get("categoryId") as string | null;
  const parsed = knowledgeSchema.parse({
    type: formData.get("type") || "faq",
    question: formData.get("question"),
    answer: formData.get("answer"),
    categoryId: rawCatId && rawCatId !== "none" ? rawCatId : null,
    keywords: formData.get("keywords") || "",
    tags: formData.get("tags") || "",
    reviewAt: formData.get("reviewAt") || undefined,
  });

  const keywords = parsed.keywords
    ? parsed.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [];
  const tags = parsed.tags
    ? parsed.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  await db
    .update(knowledgeItems)
    .set({
      type: parsed.type,
      question: parsed.question,
      answer: parsed.answer,
      categoryId: parsed.categoryId || null,
      keywords,
      tags,
      reviewAt: parsed.reviewAt ? new Date(parsed.reviewAt) : null,
      updatedBy: session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(knowledgeItems.id, itemId));

  await logAudit({
    userId: session.user.id,
    action: "update",
    resourceType: "knowledge_item",
    resourceId: itemId,
  });

  revalidatePath(`/brand/${brandSlug}/agents/${agentSlug}/knowledge`);
}

export async function deleteKnowledgeItem(itemId: string, brandSlug: string, agentSlug: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.delete(knowledgeItems).where(eq(knowledgeItems.id, itemId));

  await logAudit({
    userId: session.user.id,
    action: "delete",
    resourceType: "knowledge_item",
    resourceId: itemId,
  });

  revalidatePath(`/brand/${brandSlug}/agents/${agentSlug}/knowledge`);
}

export async function toggleKnowledgeActive(itemId: string, isActive: boolean, brandSlug: string, agentSlug: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db
    .update(knowledgeItems)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(knowledgeItems.id, itemId));

  revalidatePath(`/brand/${brandSlug}/agents/${agentSlug}/knowledge`);
}

// Category actions (scoped to agent)
const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

export async function createCategory(agentId: string, brandSlug: string, agentSlug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = categorySchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  const slug = slugify(parsed.name);

  await db.insert(categories).values({
    agentId,
    name: parsed.name,
    slug,
    description: parsed.description || null,
  });

  revalidatePath(`/brand/${brandSlug}/agents/${agentSlug}/categories`);
}

export async function updateCategory(categoryId: string, brandSlug: string, agentSlug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = categorySchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  await db
    .update(categories)
    .set({ name: parsed.name, description: parsed.description || null })
    .where(eq(categories.id, categoryId));

  revalidatePath(`/brand/${brandSlug}/agents/${agentSlug}/categories`);
}

export async function deleteCategory(categoryId: string, brandSlug: string, agentSlug: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.delete(categories).where(eq(categories.id, categoryId));

  revalidatePath(`/brand/${brandSlug}/agents/${agentSlug}/categories`);
}
