import { db } from "@/lib/db";
import { agents, brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Bot, Plus, Key, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AgentForm } from "./agent-form";

export default async function AgentsPage({
  params,
}: {
  params: Promise<{ brandSlug: string }>;
}) {
  const { brandSlug } = await params;

  const [brand] = await db
    .select()
    .from(brands)
    .where(eq(brands.slug, brandSlug))
    .limit(1);
  if (!brand) notFound();

  const agentList = await db
    .select()
    .from(agents)
    .where(eq(agents.brandId, brand.id))
    .orderBy(agents.createdAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-neutral-500 text-sm mt-1">
            จัดการ AI Agents สำหรับ Knowledge Base
          </p>
        </div>
        <AgentForm brandId={brand.id} brandSlug={brandSlug} />
      </div>

      {agentList.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Bot className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500 mb-4">ยังไม่มี Agent</p>
          <AgentForm brandId={brand.id} brandSlug={brandSlug} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agentList.map((agent) => (
            <Link
              key={agent.id}
              href={`/brand/${brandSlug}/agents/${agent.slug}`}
              className="border rounded-lg p-5 hover:shadow-md transition-shadow bg-white group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <Badge variant={agent.isActive ? "default" : "secondary"}>
                  {agent.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <h3 className="font-semibold group-hover:text-blue-600 transition-colors">
                {agent.name}
              </h3>
              {agent.description && (
                <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                  {agent.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3 text-xs text-neutral-400">
                <Key className="w-3 h-3" />
                <span className="font-mono">
                  {agent.apiKey.slice(0, 10)}...
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
