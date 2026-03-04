import { db } from "@/lib/db";
import { brands, articles } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Search, ArrowLeft, FileText } from "lucide-react";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ brandSlug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { brandSlug } = await params;
  const { q } = await searchParams;

  const [brand] = await db
    .select()
    .from(brands)
    .where(and(eq(brands.slug, brandSlug), eq(brands.isActive, true)))
    .limit(1);

  if (!brand) notFound();

  let results: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
  }[] = [];

  if (q && q.trim().length > 0) {
    results = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
      })
      .from(articles)
      .where(
        and(
          eq(articles.brandId, brand.id),
          eq(articles.status, "published"),
          sql`(
            ${articles.title} ILIKE ${"%" + q + "%"}
            OR ${articles.content} ILIKE ${"%" + q + "%"}
          )`
        )
      )
      .limit(50);
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link
            href={`/kb/${brandSlug}`}
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้าหลัก
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">
            ค้นหาบทความ
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <form action={`/kb/${brandSlug}/search`} method="GET" className="max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              name="q"
              type="text"
              defaultValue={q ?? ""}
              placeholder="ค้นหาบทความ..."
              className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:border-neutral-400"
            />
          </div>
        </form>

        {q && (
          <div>
            <p className="text-sm text-neutral-500 mb-4">
              {results.length > 0
                ? `พบ ${results.length} ผลลัพธ์สำหรับ "${q}"`
                : `ไม่พบผลลัพธ์สำหรับ "${q}"`}
            </p>

            {results.length > 0 && (
              <div className="space-y-2">
                {results.map((article) => (
                  <Link
                    key={article.id}
                    href={`/kb/${brandSlug}/article/${article.slug}`}
                    className="flex items-start gap-3 p-4 border border-neutral-200 rounded-lg hover:border-neutral-400 transition-colors group"
                  >
                    <FileText className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-neutral-900 group-hover:underline">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
