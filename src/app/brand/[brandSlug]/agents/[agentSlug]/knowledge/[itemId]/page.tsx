import { db } from "@/lib/db";
import { agents, brands, knowledgeItems, categories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { KnowledgeForm } from "../knowledge-form";

export default async function EditKnowledgePage({
  params,
}: {
  params: Promise<{ brandSlug: string; agentSlug: string; itemId: string }>;
}) {
  const { brandSlug, agentSlug, itemId } = await params;

  const [brand] = await db.select().from(brands).where(eq(brands.slug, brandSlug)).limit(1);
  if (!brand) notFound();

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.brandId, brand.id), eq(agents.slug, agentSlug)))
    .limit(1);
  if (!agent) notFound();

  const [item] = await db
    .select()
    .from(knowledgeItems)
    .where(and(eq(knowledgeItems.id, itemId), eq(knowledgeItems.agentId, agent.id)))
    .limit(1);
  if (!item) notFound();

  const cats = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.agentId, agent.id))
    .orderBy(categories.sortOrder);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">แก้ไข Knowledge Item</h2>
      <KnowledgeForm
        agentId={agent.id}
        brandSlug={brandSlug}
        agentSlug={agentSlug}
        categories={cats}
        initialData={{
          id: item.id,
          type: item.type,
          question: item.question,
          answer: item.answer,
          categoryId: item.categoryId,
          keywords: item.keywords,
          tags: item.tags,
          reviewAt: item.reviewAt,
        }}
      />
    </div>
  );
}
