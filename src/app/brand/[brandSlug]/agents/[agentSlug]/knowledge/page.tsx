import { db } from "@/lib/db";
import { agents, brands, knowledgeItems, categories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { KnowledgeActions } from "./knowledge-actions-client";

export default async function KnowledgePage({
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

  const items = await db
    .select({
      id: knowledgeItems.id,
      type: knowledgeItems.type,
      question: knowledgeItems.question,
      answer: knowledgeItems.answer,
      isActive: knowledgeItems.isActive,
      source: knowledgeItems.source,
      keywords: knowledgeItems.keywords,
      categoryName: categories.name,
      reviewAt: knowledgeItems.reviewAt,
      createdAt: knowledgeItems.createdAt,
    })
    .from(knowledgeItems)
    .leftJoin(categories, eq(knowledgeItems.categoryId, categories.id))
    .where(eq(knowledgeItems.agentId, agent.id))
    .orderBy(knowledgeItems.createdAt);

  const typeBadge: Record<string, string> = {
    faq: "bg-blue-50 text-blue-700",
    info: "bg-green-50 text-green-700",
    procedure: "bg-purple-50 text-purple-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{items.length} รายการ</p>
        <Link href={`/brand/${brandSlug}/agents/${agentSlug}/knowledge/new`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่ม Knowledge
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <BookOpen className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500 mb-4">ยังไม่มี Knowledge Items</p>
          <Link href={`/brand/${brandSlug}/agents/${agentSlug}/knowledge/new`}>
            <Button>เพิ่ม Knowledge</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">คำถาม</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">ประเภท</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">หมวดหมู่</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">สถานะ</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">วันที่สร้าง</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/brand/${brandSlug}/agents/${agentSlug}/knowledge/${item.id}`}
                      className="font-medium hover:text-blue-600 line-clamp-1"
                    >
                      {item.question}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${typeBadge[item.type] ?? ""}`}>
                      {item.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{item.categoryName ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <KnowledgeActions
                      itemId={item.id}
                      isActive={item.isActive}
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
