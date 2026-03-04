import { db } from "@/lib/db";
import { brands, categories, articles } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, ArrowLeft, ArrowRight, FileText } from "lucide-react";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ brandSlug: string; categorySlug: string }>;
}) {
  const { brandSlug, categorySlug } = await params;

  const [brand] = await db
    .select()
    .from(brands)
    .where(and(eq(brands.slug, brandSlug), eq(brands.isActive, true)))
    .limit(1);

  if (!brand) notFound();

  const [category] = await db
    .select()
    .from(categories)
    .where(
      and(eq(categories.brandId, brand.id), eq(categories.slug, categorySlug))
    )
    .limit(1);

  if (!category) notFound();

  const categoryArticles = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(
      and(
        eq(articles.brandId, brand.id),
        eq(articles.categoryId, category.id),
        eq(articles.status, "published")
      )
    )
    .orderBy(desc(articles.publishedAt));

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link
            href={`/kb/${brandSlug}`}
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {brand.name}
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">{category.name}</h1>
          {category.description && (
            <p className="text-neutral-500 mt-1">{category.description}</p>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {categoryArticles.length > 0 ? (
          <div className="space-y-2">
            {categoryArticles.map((article) => (
              <Link
                key={article.id}
                href={`/kb/${brandSlug}/article/${article.slug}`}
                className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:border-neutral-400 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-neutral-900">{article.title}</h3>
                  {article.excerpt && (
                    <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}
                  {article.publishedAt && (
                    <p className="text-xs text-neutral-400 mt-2">
                      {new Date(article.publishedAt).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors ml-4 flex-shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-neutral-500">
              ยังไม่มีบทความในหมวดนี้
            </h2>
          </div>
        )}
      </main>
    </div>
  );
}
