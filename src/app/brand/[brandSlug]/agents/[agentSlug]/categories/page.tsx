import { db } from "@/lib/db";
import { agents, brands, categories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { FolderTree } from "lucide-react";
import { CategoryForm } from "./category-form";
import { CategoryActions } from "./category-actions-client";

export default async function CategoriesPage({
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

  const cats = await db
    .select()
    .from(categories)
    .where(eq(categories.agentId, agent.id))
    .orderBy(categories.sortOrder);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{cats.length} หมวดหมู่</p>
        <CategoryForm agentId={agent.id} brandSlug={brandSlug} agentSlug={agentSlug} />
      </div>

      {cats.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <FolderTree className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500 mb-4">ยังไม่มีหมวดหมู่</p>
          <CategoryForm agentId={agent.id} brandSlug={brandSlug} agentSlug={agentSlug} />
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">ชื่อ</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">คำอธิบาย</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Slug</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cats.map((cat) => (
                <tr key={cat.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-neutral-500">{cat.description ?? "-"}</td>
                  <td className="px-4 py-3 text-neutral-400 font-mono text-xs">{cat.slug}</td>
                  <td className="px-4 py-3 text-right">
                    <CategoryActions
                      categoryId={cat.id}
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
