import { db } from "@/lib/db";
import { agents, brands, escalations, users, categories } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { EscalationDialog } from "./escalation-dialog";

export default async function EscalationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ brandSlug: string; agentSlug: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { brandSlug, agentSlug } = await params;
  const { status: filterStatus } = await searchParams;

  const [brand] = await db.select().from(brands).where(eq(brands.slug, brandSlug)).limit(1);
  if (!brand) notFound();

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.brandId, brand.id), eq(agents.slug, agentSlug)))
    .limit(1);
  if (!agent) notFound();

  const conditions = [eq(escalations.agentId, agent.id)];
  if (filterStatus) {
    conditions.push(eq(escalations.status, filterStatus));
  }

  const items = await db
    .select({
      id: escalations.id,
      question: escalations.question,
      customerContext: escalations.customerContext,
      aiAttemptedAnswer: escalations.aiAttemptedAnswer,
      status: escalations.status,
      priority: escalations.priority,
      assignedToName: users.displayName,
      answer: escalations.answer,
      resolutionType: escalations.resolutionType,
      createdAt: escalations.createdAt,
    })
    .from(escalations)
    .leftJoin(users, eq(escalations.assignedTo, users.id))
    .where(and(...conditions))
    .orderBy(desc(escalations.createdAt));

  const cats = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.agentId, agent.id))
    .orderBy(categories.sortOrder);

  const allUsers = await db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(eq(users.isActive, true));

  const statusFilters = [
    { value: "", label: "ทั้งหมด" },
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "dismissed", label: "Dismissed" },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    in_progress: "bg-blue-50 text-blue-700 border-blue-200",
    resolved: "bg-green-50 text-green-700 border-green-200",
    dismissed: "bg-neutral-50 text-neutral-500 border-neutral-200",
  };

  const priorityColors: Record<string, string> = {
    low: "bg-neutral-100 text-neutral-600",
    normal: "bg-blue-100 text-blue-700",
    high: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {statusFilters.map((f) => (
          <a
            key={f.value}
            href={
              f.value
                ? `?status=${f.value}`
                : `?`
            }
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              (filterStatus ?? "") === f.value
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <AlertTriangle className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500">ไม่มีรายการ Escalation</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((esc) => (
            <div key={esc.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusColors[esc.status] ?? ""}`}>
                      {esc.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[esc.priority] ?? ""}`}>
                      {esc.priority}
                    </span>
                    {esc.assignedToName && (
                      <span className="text-xs text-neutral-500">
                        Assigned: {esc.assignedToName}
                      </span>
                    )}
                    <span className="text-xs text-neutral-400 ml-auto">
                      {formatDateTime(esc.createdAt)}
                    </span>
                  </div>
                  <p className="font-medium">{esc.question}</p>
                  {esc.customerContext && (
                    <p className="text-sm text-neutral-500 mt-1">
                      Context: {esc.customerContext}
                    </p>
                  )}
                  {esc.aiAttemptedAnswer && (
                    <div className="mt-2 p-2 bg-neutral-50 rounded text-sm">
                      <span className="text-xs text-neutral-400 block mb-1">AI attempted:</span>
                      {esc.aiAttemptedAnswer}
                    </div>
                  )}
                  {esc.answer && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                      <span className="text-xs text-green-600 block mb-1">คำตอบ:</span>
                      {esc.answer}
                    </div>
                  )}
                </div>
                {(esc.status === "pending" || esc.status === "in_progress") && (
                  <EscalationDialog
                    escalation={esc}
                    brandSlug={brandSlug}
                    agentSlug={agentSlug}
                    categories={cats}
                    users={allUsers}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
