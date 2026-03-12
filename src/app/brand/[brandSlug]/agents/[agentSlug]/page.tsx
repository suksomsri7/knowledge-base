import { db } from "@/lib/db";
import { agents, brands, knowledgeItems, flows, escalations, kbApiLogs } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BookOpen, GitBranch, AlertTriangle, Activity } from "lucide-react";

export default async function AgentDashboard({
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

  const [knowledgeCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(knowledgeItems)
    .where(eq(knowledgeItems.agentId, agent.id));

  const [flowCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(flows)
    .where(eq(flows.agentId, agent.id));

  const [pendingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(escalations)
    .where(and(eq(escalations.agentId, agent.id), eq(escalations.status, "pending")));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [todayQueries] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(kbApiLogs)
    .where(
      and(
        eq(kbApiLogs.agentId, agent.id),
        sql`${kbApiLogs.createdAt} >= ${today.toISOString()}`
      )
    );

  const stats = [
    { label: "Knowledge Items", value: knowledgeCount.count, icon: BookOpen, color: "text-blue-600 bg-blue-50" },
    { label: "Flows", value: flowCount.count, icon: GitBranch, color: "text-green-600 bg-green-50" },
    { label: "Pending Escalations", value: pendingCount.count, icon: AlertTriangle, color: "text-amber-600 bg-amber-50" },
    { label: "Queries Today", value: todayQueries.count, icon: Activity, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white border rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold">{stat.value}</p>
          <p className="text-sm text-neutral-500 mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
