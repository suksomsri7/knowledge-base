import { db } from "@/lib/db";
import { agents, brands, kbApiLogs, escalations } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Activity, CheckCircle, AlertTriangle, Clock } from "lucide-react";

export default async function AnalyticsPage({
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      autoAnswer: sql<number>`count(*) FILTER (WHERE ${kbApiLogs.recommendation} = 'auto_answer')::int`,
      withDisclaimer: sql<number>`count(*) FILTER (WHERE ${kbApiLogs.recommendation} = 'answer_with_disclaimer')::int`,
      escalated: sql<number>`count(*) FILTER (WHERE ${kbApiLogs.recommendation} = 'escalate')::int`,
      noResults: sql<number>`count(*) FILTER (WHERE ${kbApiLogs.recommendation} = 'no_results')::int`,
      useFlow: sql<number>`count(*) FILTER (WHERE ${kbApiLogs.recommendation} = 'use_flow')::int`,
      avgMs: sql<number>`COALESCE(avg(${kbApiLogs.responseMs}), 0)::int`,
    })
    .from(kbApiLogs)
    .where(
      and(
        eq(kbApiLogs.agentId, agent.id),
        sql`${kbApiLogs.createdAt} >= ${today.toISOString()}`
      )
    );

  const [pendingEsc] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(escalations)
    .where(and(eq(escalations.agentId, agent.id), eq(escalations.status, "pending")));

  const answerRate =
    todayStats.total > 0
      ? Math.round(
          ((todayStats.autoAnswer + todayStats.withDisclaimer + todayStats.useFlow) /
            todayStats.total) *
            100
        )
      : 0;

  const topEscalated = await db
    .select({
      question: escalations.question,
      count: sql<number>`count(*)::int`,
    })
    .from(escalations)
    .where(eq(escalations.agentId, agent.id))
    .groupBy(escalations.question)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  const recentLogs = await db
    .select()
    .from(kbApiLogs)
    .where(eq(kbApiLogs.agentId, agent.id))
    .orderBy(desc(kbApiLogs.createdAt))
    .limit(20);

  const summaryCards = [
    { label: "Queries Today", value: todayStats.total, icon: Activity, color: "text-purple-600 bg-purple-50" },
    { label: "Answer Rate", value: `${answerRate}%`, icon: CheckCircle, color: "text-green-600 bg-green-50" },
    { label: "Pending Escalations", value: pendingEsc.count, icon: AlertTriangle, color: "text-amber-600 bg-amber-50" },
    { label: "Avg Response (ms)", value: todayStats.avgMs, icon: Clock, color: "text-blue-600 bg-blue-50" },
  ];

  const recommendationColors: Record<string, string> = {
    auto_answer: "bg-green-100 text-green-700",
    answer_with_disclaimer: "bg-amber-100 text-amber-700",
    use_flow: "bg-blue-100 text-blue-700",
    escalate: "bg-red-100 text-red-700",
    no_results: "bg-neutral-100 text-neutral-500",
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white border rounded-lg p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-neutral-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white border rounded-lg p-5">
          <h3 className="font-semibold mb-3">Today Breakdown</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: "Auto Answer", value: todayStats.autoAnswer, color: "bg-green-500" },
              { label: "With Disclaimer", value: todayStats.withDisclaimer, color: "bg-amber-500" },
              { label: "Use Flow", value: todayStats.useFlow, color: "bg-blue-500" },
              { label: "Escalated", value: todayStats.escalated, color: "bg-red-500" },
              { label: "No Results", value: todayStats.noResults, color: "bg-neutral-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="flex-1">{item.label}</span>
                <span className="font-mono">{item.value}</span>
                {todayStats.total > 0 && (
                  <span className="text-neutral-400 w-12 text-right">
                    {Math.round((item.value / todayStats.total) * 100)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-5">
          <h3 className="font-semibold mb-3">Top Unanswered Questions</h3>
          {topEscalated.length === 0 ? (
            <p className="text-sm text-neutral-500">ไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-2 text-sm">
              {topEscalated.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="font-mono text-neutral-400 w-6">{item.count}x</span>
                  <span className="flex-1 truncate">{item.question}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border rounded-lg p-5">
        <h3 className="font-semibold mb-3">Recent API Logs</h3>
        {recentLogs.length === 0 ? (
          <p className="text-sm text-neutral-500">ไม่มีข้อมูล</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-500 border-b">
                <tr>
                  <th className="pb-2 pr-4">Time</th>
                  <th className="pb-2 pr-4">Endpoint</th>
                  <th className="pb-2 pr-4">Query</th>
                  <th className="pb-2 pr-4">Results</th>
                  <th className="pb-2 pr-4">Confidence</th>
                  <th className="pb-2">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 pr-4 text-neutral-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString("th-TH")}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{log.endpoint}</td>
                    <td className="py-2 pr-4 max-w-xs truncate">{log.query ?? "-"}</td>
                    <td className="py-2 pr-4">{log.resultsCount}</td>
                    <td className="py-2 pr-4">{log.topConfidence ?? "-"}</td>
                    <td className="py-2">
                      {log.recommendation && (
                        <span className={`px-2 py-0.5 rounded text-xs ${recommendationColors[log.recommendation] ?? ""}`}>
                          {log.recommendation}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
