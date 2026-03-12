import { db } from "@/lib/db";
import { brands, agents, brandMembers, knowledgeItems, escalations } from "@/lib/db/schema";
import { eq, count, sql, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Users, BookOpen, AlertTriangle } from "lucide-react";
import { requireBrandPermission } from "@/lib/auth-utils";

export default async function BrandDashboard({
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
  await requireBrandPermission(brand.id, "kb:read");

  const agentList = await db
    .select()
    .from(agents)
    .where(eq(agents.brandId, brand.id));

  const [totalMembers] = await db
    .select({ value: count() })
    .from(brandMembers)
    .where(eq(brandMembers.brandId, brand.id));

  let totalKI = 0;
  let totalPending = 0;
  for (const agent of agentList) {
    const [ki] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(knowledgeItems)
      .where(eq(knowledgeItems.agentId, agent.id));
    totalKI += ki.c;

    const [pe] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(escalations)
      .where(and(eq(escalations.agentId, agent.id), eq(escalations.status, "pending")));
    totalPending += pe.c;
  }

  const stats = [
    { label: "Agents", value: agentList.length, icon: Bot },
    { label: "Knowledge Items", value: totalKI, icon: BookOpen },
    { label: "Pending Escalations", value: totalPending, icon: AlertTriangle },
    { label: "Members", value: totalMembers.value, icon: Users },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{brand.name}</h1>
        {brand.description && (
          <p className="mt-1 text-sm text-muted-foreground">{brand.description}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">{stat.label}</CardDescription>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
        </CardHeader>
        <CardContent>
          {agentList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              ยังไม่มี Agent –{" "}
              <Link href={`/brand/${brandSlug}/agents`} className="underline">
                สร้าง Agent
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {agentList.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/brand/${brandSlug}/agents/${agent.slug}`}
                  className="flex items-center justify-between rounded-md border px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Bot className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm font-medium">{agent.name}</span>
                  </div>
                  <Badge variant={agent.isActive ? "default" : "secondary"}>
                    {agent.isActive ? "Active" : "Inactive"}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
