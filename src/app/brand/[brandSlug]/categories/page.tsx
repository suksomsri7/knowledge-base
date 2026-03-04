import { db } from "@/lib/db";
import { brands, categories, articles } from "@/lib/db/schema";
import { eq, count, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { CategoryActions } from "./category-actions";

export default async function CategoriesPage({
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

  const categoryList = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      createdAt: categories.createdAt,
      articleCount: sql<number>`(
        select count(*) from articles
        where articles.category_id = ${categories.id}
      )`.mapWith(Number),
    })
    .from(categories)
    .where(eq(categories.brandId, brand.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <CategoryActions
          brandId={brand.id}
          brandSlug={brandSlug}
          categories={categoryList.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
          }))}
        />
      </div>

      {categoryList.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No categories yet. Create your first category.
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Articles</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryList.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {cat.slug}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {cat.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {cat.articleCount}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(cat.createdAt)}
                    </TableCell>
                    <TableCell>
                      <CategoryActions
                        brandId={brand.id}
                        brandSlug={brandSlug}
                        editCategory={{
                          id: cat.id,
                          name: cat.name,
                          description: cat.description,
                        }}
                        mode="row"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
