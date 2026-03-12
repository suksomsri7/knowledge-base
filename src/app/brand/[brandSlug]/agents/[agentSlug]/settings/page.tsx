import { db } from "@/lib/db";
import { agents, brands } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AgentSettingsForm } from "./settings-form";

export default async function AgentSettingsPage({
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
    <AgentSettingsForm
      agent={{
        id: agent.id,
        apiKey: agent.apiKey,
        answerThreshold: agent.answerThreshold,
        escalateThreshold: agent.escalateThreshold,
        disclaimerMessage: agent.disclaimerMessage,
        noAnswerMessage: agent.noAnswerMessage,
      }}
      brandSlug={brandSlug}
      agentSlug={agentSlug}
    />
  );
}
