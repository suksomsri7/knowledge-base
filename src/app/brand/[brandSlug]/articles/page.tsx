import { db } from "@/lib/db";
import {
  brands,
  articles,
  categories,
  users,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
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
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ brandSlug: string }>;
}) {
  const { brandSlug } = await params;

  const [brand] = await db
    .select()
    .from(brands)
    .where(eq(brands.slug, brandSlug))
    .limit(1);

  if (!brand) notFound();

  const articleList = await db
    .select({
      id: articles.id,
      title: articles.title,
      status: articles.status,
      createdAt: articles.createdAt,
      categoryName: categories.name,
      authorName: users.displayName,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(users, eq(articles.createdBy, users.id))
    .where(eq(articles.brandId, brand.id))
    .orderBy(desc(articles.createdAt));

  const statusVariant = (status: string) => {
    switch (status) {
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

      {articleList.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No articles yet. Create your first article.
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
