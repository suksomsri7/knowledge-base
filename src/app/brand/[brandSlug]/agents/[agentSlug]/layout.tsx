import { db } from "@/lib/db";
import { agents, brands } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AgentNav } from "./agent-nav";

export default async function AgentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ brandSlug: string; agentSlug: string }>;
}) {
  const { brandSlug, agentSlug } = await params;

  const [brand] = await db
    .select()
    .from(brands)
    .where(eq(brands.slug, brandSlug))
    .limit(1);
  if (!brand) notFound();

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.brandId, brand.id), eq(agents.slug, agentSlug)))
    .limit(1);
  if (!agent) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{agent.name}</h1>
        {agent.description && (
          <p className="text-neutral-500 text-sm mt-1">{agent.description}</p>
        )}
      </div>
      <AgentNav brandSlug={brandSlug} agentSlug={agentSlug} />
      {children}
    </div>
  );
}
