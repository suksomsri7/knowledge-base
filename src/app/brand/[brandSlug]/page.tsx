import { db } from "@/lib/db";
import { brands, articles, categories, brandMembers } from "@/lib/db/schema";
import { eq, count, desc, and, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, FolderOpen, Users, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { requireBrandPermission } from "@/lib/auth-utils";

export default async function BrandDashboard({
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
  await requireBrandPermission(brand.id, "kb:read");

  const [totalArticles] = await db
    .select({ value: count() })
    .from(articles)
    .where(eq(articles.brandId, brand.id));

  const [publishedArticles] = await db
    .select({ value: count() })
    .from(articles)
    .where(
      and(eq(articles.brandId, brand.id), eq(articles.status, "published"))
    );

  const [draftArticles] = await db
    .select({ value: count() })
    .from(articles)
    .where(and(eq(articles.brandId, brand.id), eq(articles.status, "draft")));

  const [totalCategories] = await db
    .select({ value: count() })
    .from(categories)
    .where(eq(categories.brandId, brand.id));

  const [totalMembers] = await db
    .select({ value: count() })
    .from(brandMembers)
    .where(eq(brandMembers.brandId, brand.id));

  const recentArticles = await db
    .select({
      id: articles.id,
      title: articles.title,
      status: articles.status,
      createdAt: articles.createdAt,
    })
    .from(articles)
    .where(eq(articles.brandId, brand.id))
    .orderBy(desc(articles.createdAt))
    .limit(5);

  const stats = [
    {
      label: "Total Articles",
      value: totalArticles.value,
      icon: FileText,
    },
    {
      label: "Published",
      value: publishedArticles.value,
      icon: Eye,
    },
    {
      label: "Drafts",
      value: draftArticles.value,
      icon: FileText,
    },
    {
      label: "Categories",
      value: totalCategories.value,
      icon: FolderOpen,
    },
    {
      label: "Members",
      value: totalMembers.value,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{brand.name}</h1>
        {brand.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {brand.description}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                {stat.label}
              </CardDescription>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Articles</CardTitle>
        </CardHeader>
        <CardContent>
          {recentArticles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No articles yet.</p>
          ) : (
            <div className="space-y-3">
              {recentArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/brand/${brandSlug}/articles/${article.id}`}
                  className="flex items-center justify-between rounded-md border px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <span className="text-sm font-medium">{article.title}</span>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        article.status === "published"
                          ? "default"
                          : article.status === "draft"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {article.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(article.createdAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
