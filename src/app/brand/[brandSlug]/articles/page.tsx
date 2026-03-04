import { db } from "@/lib/db";
import {
  brands,
  articles,
  categories,
  users,
} from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { requireBrandPermission } from "@/lib/auth-utils";

export default async function ArticlesPage({
  params,
  searchParams,
}: {
  params: Promise<{ brandSlug: string }>;
  searchParams: Promise<{ status?: string; q?: string; tag?: string }>;
}) {
  const { brandSlug } = await params;
  const { status, q, tag } = await searchParams;

  const [brand] = await db
    .select()
    .from(brands)
    .where(eq(brands.slug, brandSlug))
    .limit(1);

  if (!brand) notFound();
  await requireBrandPermission(brand.id, "kb:read");

  const conditions = [eq(articles.brandId, brand.id)];
  if (status) conditions.push(eq(articles.status, status));
  if (q) {
    conditions.push(
      sql`(${articles.title} ILIKE ${"%" + q + "%"} OR ${articles.content} ILIKE ${"%" + q + "%"})`
    );
  }
  if (tag) {
    conditions.push(sql`${tag} = ANY(${articles.tags})`);
  }

  const articleList = await db
    .select({
      id: articles.id,
      title: articles.title,
      status: articles.status,
      tags: articles.tags,
      createdAt: articles.createdAt,
      categoryName: categories.name,
      authorName: users.displayName,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(users, eq(articles.createdBy, users.id))
    .where(and(...conditions))
    .orderBy(desc(articles.createdAt));

  const statusVariant = (s: string) => {
    switch (s) {
      case "published":
        return "default" as const;
      case "draft":
        return "secondary" as const;
      case "archived":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Articles</h1>
        <Button asChild>
          <Link href={`/brand/${brandSlug}/articles/new`}>
            <Plus className="mr-2 size-4" />
            New Article
          </Link>
        </Button>
      </div>

      <form
        action={`/brand/${brandSlug}/articles`}
        method="GET"
        className="flex items-center gap-3 flex-wrap"
      >
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            name="q"
            type="text"
            defaultValue={q || ""}
            placeholder="ค้นหาบทความ..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200"
          />
        </div>
        <select
          name="status"
          defaultValue={status || ""}
          className="px-3 py-2 border border-neutral-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
        {tag && (
          <Link
            href={`/brand/${brandSlug}/articles`}
            className="flex items-center gap-1 px-2 py-1 bg-neutral-100 rounded text-sm hover:bg-neutral-200 transition-colors"
          >
            Tag: {tag} <span className="text-neutral-400">×</span>
          </Link>
        )}
      </form>

      {articleList.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No articles found.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {articleList.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">
                    {article.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {article.categoryName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(article.status)}>
                      {article.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {article.authorName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {article.tags?.map((t: string) => (
                        <Link
                          key={t}
                          href={`/brand/${brandSlug}/articles?tag=${encodeURIComponent(t)}`}
                        >
                          <Badge
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-neutral-100"
                          >
                            {t}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(article.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={`/brand/${brandSlug}/articles/${article.id}`}
                      >
                        Edit
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
