import { db } from "@/lib/db";
import { agents, brands, flows, flowSteps } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { FlowFormWrapper } from "../flow-form-wrapper";
import { FlowStepEditor } from "./flow-step-editor";

export default async function FlowDetailPage({
  params,
}: {
  params: Promise<{ brandSlug: string; agentSlug: string; flowId: string }>;
}) {
  const { brandSlug, agentSlug, flowId } = await params;

  const [brand] = await db.select().from(brands).where(eq(brands.slug, brandSlug)).limit(1);
  if (!brand) notFound();

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.brandId, brand.id), eq(agents.slug, agentSlug)))
    .limit(1);
  if (!agent) notFound();

  const [flow] = await db
    .select()
    .from(flows)
    .where(and(eq(flows.id, flowId), eq(flows.agentId, agent.id)))
    .limit(1);
  if (!flow) notFound();

  const steps = await db
    .select()
    .from(flowSteps)
    .where(eq(flowSteps.flowId, flowId))
    .orderBy(flowSteps.stepOrder);

  return (
    <div className="space-y-8">
      <FlowFormWrapper
        agentId={agent.id}
        brandSlug={brandSlug}
        agentSlug={agentSlug}
        initialData={{
          id: flow.id,
          name: flow.name,
          description: flow.description,
          triggerKeywords: flow.triggerKeywords,
          priority: flow.priority,
        }}
      />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Steps</h3>
        <FlowStepEditor
          flowId={flowId}
          brandSlug={brandSlug}
          agentSlug={agentSlug}
          steps={steps.map((s) => ({
            id: s.id,
            stepOrder: s.stepOrder,
            type: s.type,
            message: s.message,
            options: s.options as Array<{ label: string; keywords: string[]; nextStepId: string | null }> ?? [],
            isFinal: s.isFinal,
          }))}
        />
      </div>
    </div>
  );
}
