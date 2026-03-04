import { db } from "@/lib/db";
import { brands, articles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  {
    params,
  }: { params: Promise<{ brandSlug: string; articleId: string }> }
) {
  const { brandSlug, articleId } = await params;

  const [brand] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(eq(brands.slug, brandSlug))
    .limit(1);

  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const [article] = await db
    .select({
      id: articles.id,
      title: articles.title,
      content: articles.content,
      categoryId: articles.categoryId,
      status: articles.status,
      excerpt: articles.excerpt,
      tags: articles.tags,
    })
    .from(articles)
    .where(and(eq(articles.id, articleId), eq(articles.brandId, brand.id)))
    .limit(1);

  if (!article) {
    return NextResponse.json(
      { error: "Article not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ article });
}
