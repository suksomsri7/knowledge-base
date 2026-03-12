import { db } from "@/lib/db";
import { agents, brands, flows, flowSteps } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, GitBranch } from "lucide-react";
import { FlowActions } from "./flow-actions-client";

export default async function FlowsPage({
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

  const flowList = await db
    .select({
      id: flows.id,
      name: flows.name,
      triggerKeywords: flows.triggerKeywords,
      priority: flows.priority,
      isActive: flows.isActive,
      stepsCount: sql<number>`(SELECT count(*)::int FROM flow_steps WHERE flow_steps.flow_id = ${flows.id})`,
    })
    .from(flows)
    .where(eq(flows.agentId, agent.id))
    .orderBy(flows.createdAt);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{flowList.length} flows</p>
        <Link href={`/brand/${brandSlug}/agents/${agentSlug}/flows/new`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            สร้าง Flow
          </Button>
        </Link>
      </div>

      {flowList.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <GitBranch className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500 mb-4">ยังไม่มี Flows</p>
          <Link href={`/brand/${brandSlug}/agents/${agentSlug}/flows/new`}>
            <Button>สร้าง Flow</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">ชื่อ</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Keywords</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Steps</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">สถานะ</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {flowList.map((flow) => (
                <tr key={flow.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/brand/${brandSlug}/agents/${agentSlug}/flows/${flow.id}`}
                      className="font-medium hover:text-blue-600"
                    >
                      {flow.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {flow.triggerKeywords.slice(0, 3).map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 bg-neutral-100 rounded text-xs"
                        >
                          {kw}
                        </span>
                      ))}
                      {flow.triggerKeywords.length > 3 && (
                        <span className="text-xs text-neutral-400">
                          +{flow.triggerKeywords.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{flow.stepsCount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={flow.isActive ? "default" : "secondary"}>
                      {flow.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <FlowActions
                      flowId={flow.id}
                      isActive={flow.isActive}
                      brandSlug={brandSlug}
                      agentSlug={agentSlug}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
