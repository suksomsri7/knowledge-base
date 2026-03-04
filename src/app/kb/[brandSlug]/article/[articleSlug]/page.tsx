import { db } from "@/lib/db";
import { brands, articles, categories, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ brandSlug: string; articleSlug: string }>;
}) {
  const { brandSlug, articleSlug } = await params;

  const [brand] = await db
    .select()
    .from(brands)
    .where(and(eq(brands.slug, brandSlug), eq(brands.isActive, true)))
    .limit(1);

  if (!brand) notFound();

  const result = await db
    .select({
      article: articles,
      categoryName: categories.name,
      categorySlug: categories.slug,
      authorName: users.displayName,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(users, eq(articles.createdBy, users.id))
    .where(
      and(
        eq(articles.brandId, brand.id),
        eq(articles.slug, articleSlug),
        eq(articles.status, "published")
      )
    )
    .limit(1);

  if (result.length === 0) notFound();

  const { article, categoryName, categorySlug, authorName } = result[0];

  await db
    .update(articles)
    .set({ viewCount: (article.viewCount || 0) + 1 })
    .where(eq(articles.id, article.id));

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <Link
            href={
              categorySlug
                ? `/kb/${brandSlug}/${categorySlug}`
                : `/kb/${brandSlug}`
            }
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {categoryName || brand.name}
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 leading-tight">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 mt-4 text-sm text-neutral-500">
            {authorName && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {authorName}
              </span>
            )}
            {article.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(article.publishedAt).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
          {article.tags && article.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <Tag className="w-3.5 h-3.5 text-neutral-400" />
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="font-normal text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <article
          className="prose prose-neutral max-w-none prose-headings:text-neutral-900 prose-a:text-neutral-900 prose-code:bg-neutral-100 prose-code:px-1 prose-code:rounded prose-pre:bg-neutral-900 prose-pre:text-neutral-100 prose-blockquote:border-neutral-300 prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </main>

      <footer className="border-t border-neutral-200 py-6 mt-10">
        <div className="max-w-3xl mx-auto px-6 text-center text-sm text-neutral-400">
          {brand.name} Knowledge Base
        </div>
      </footer>
    </div>
  );
}
