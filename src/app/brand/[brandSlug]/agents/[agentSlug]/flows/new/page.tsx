import { db } from "@/lib/db";
import { agents, brands } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { FlowFormWrapper } from "../flow-form-wrapper";

export default async function NewFlowPage({
  params,
}: {
  params: Promise<{ brandSlug: string; agentSlug: string }>;
}) {
  const { brandSlug, agentSlug } = await params;

  const [brand] = await db.select().from(brands).where(eq(brands.slug, brandSlug)).limit(1);
  if (!brand) notFound();

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.brandId, brand.id), eq(agents.slug, agentSlug)))
    .limit(1);
  if (!agent) notFound();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">สร้าง Flow ใหม่</h2>
      <FlowFormWrapper
        agentId={agent.id}
        brandSlug={brandSlug}
        agentSlug={agentSlug}
      />
    </div>
  );
}
