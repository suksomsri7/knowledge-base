import { db } from "@/lib/db";
import { brands, categories, articles } from "@/lib/db/schema";
import { eq, and, count, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, Search, FolderOpen, FileText, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PublicKBPage({
  params,
}: {
  params: Promise<{ brandSlug: string }>;
}) {
  const { brandSlug } = await params;

  const [brand] = await db
    .select()
    .from(brands)
    .where(and(eq(brands.slug, brandSlug), eq(brands.isActive, true)))
    .limit(1);

  if (!brand) notFound();

  const brandCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      icon: categories.icon,
      articleCount: count(articles.id),
    })
    .from(categories)
    .leftJoin(
      articles,
      and(
        eq(articles.categoryId, categories.id),
        eq(articles.status, "published")
      )
    )
    .where(eq(categories.brandId, brand.id))
    .groupBy(categories.id)
    .orderBy(categories.sortOrder);

  const recentArticles = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      publishedAt: articles.publishedAt,
      categoryId: articles.categoryId,
    })
    .from(articles)
    .where(and(eq(articles.brandId, brand.id), eq(articles.status, "published")))
    .orderBy(desc(articles.publishedAt))
    .limit(10);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-4">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.name} className="w-10 h-10 rounded-lg" />
            ) : (
              <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{brand.name}</h1>
              <p className="text-neutral-500 text-sm">Knowledge Base</p>
            </div>
          </div>
          {brand.description && (
            <p className="text-neutral-600 mt-2">{brand.description}</p>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        <form action={`/kb/${brandSlug}/search`} method="GET" className="max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              name="q"
              type="text"
              placeholder="ค้นหาบทความ..."
              className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:border-neutral-400"
            />
          </div>
        </form>

        {brandCategories.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              หมวดหมู่
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {brandCategories.map((cat) => (
                <Link key={cat.id} href={`/kb/${brandSlug}/${cat.slug}`}>
                  <Card className="hover:border-neutral-400 transition-colors cursor-pointer h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        {cat.name}
                        <Badge variant="secondary" className="font-normal">
                          {cat.articleCount} บทความ
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    {cat.description && (
                      <CardContent>
                        <p className="text-sm text-neutral-500 line-clamp-2">
                          {cat.description}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {recentArticles.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              บทความล่าสุด
            </h2>
            <div className="space-y-2">
              {recentArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/kb/${brandSlug}/article/${article.slug}`}
                  className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:border-neutral-400 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-neutral-900 truncate">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-sm text-neutral-500 mt-1 line-clamp-1">
                        {article.excerpt}
                      </p>
                    )}
                    {article.publishedAt && (
                      <p className="text-xs text-neutral-400 mt-1">
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
          </section>
        )}

        {brandCategories.length === 0 && recentArticles.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-neutral-500">ยังไม่มีเนื้อหา</h2>
            <p className="text-sm text-neutral-400 mt-1">
              กำลังจัดเตรียมข้อมูล โปรดกลับมาอีกครั้ง
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-neutral-200 py-6 mt-10">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-neutral-400">
          {brand.name} Knowledge Base
        </div>
      </footer>
    </div>
  );
}
