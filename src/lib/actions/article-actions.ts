"use server";

import { db } from "@/lib/db";
import { articles, articleVersions, categories } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const articleSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  content: z.string(),
  categoryId: z.string().optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  excerpt: z.string().optional().nullable(),
  tags: z.string().optional(),
});

export async function createArticle(brandId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = articleSchema.parse({
    title: formData.get("title"),
    content: formData.get("content") || "",
    categoryId: formData.get("categoryId") || null,
    status: formData.get("status") || "draft",
    excerpt: formData.get("excerpt") || null,
    tags: formData.get("tags") || "",
  });

  const slug = slugify(parsed.title) + "-" + Date.now().toString(36);
  const tags = parsed.tags
    ? parsed.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  const [article] = await db
    .insert(articles)
    .values({
      brandId,
      title: parsed.title,
      slug,
      content: parsed.content,
      excerpt: parsed.excerpt,
      categoryId: parsed.categoryId || null,
      status: parsed.status,
      tags,
      createdBy: session.user.id,
      updatedBy: session.user.id,
      publishedAt: parsed.status === "published" ? new Date() : null,
    })
    .returning();

  await db.insert(articleVersions).values({
    articleId: article.id,
    versionNumber: 1,
    title: parsed.title,
    content: parsed.content,
    changedBy: session.user.id,
    changeSummary: "Initial version",
  });

  const brand = await db.query.brands.findFirst({
    where: eq(articles.brandId, brandId),
    columns: { slug: true },
  });

  revalidatePath(`/brand/${brand?.slug || brandId}/articles`);
  return article;
}

export async function updateArticle(
  articleId: string,
  brandSlug: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = articleSchema.parse({
    title: formData.get("title"),
    content: formData.get("content") || "",
    categoryId: formData.get("categoryId") || null,
    status: formData.get("status") || "draft",
    excerpt: formData.get("excerpt") || null,
    tags: formData.get("tags") || "",
  });

  const tags = parsed.tags
    ? parsed.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  const existing = await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
  });

  await db
    .update(articles)
    .set({
      title: parsed.title,
      content: parsed.content,
      excerpt: parsed.excerpt,
      categoryId: parsed.categoryId || null,
      status: parsed.status,
      tags,
      updatedBy: session.user.id,
      updatedAt: new Date(),
      publishedAt:
        parsed.status === "published" && existing?.status !== "published"
          ? new Date()
          : existing?.publishedAt,
    })
    .where(eq(articles.id, articleId));

  const lastVersion = await db.query.articleVersions.findFirst({
    where: eq(articleVersions.articleId, articleId),
    orderBy: [desc(articleVersions.versionNumber)],
  });

  await db.insert(articleVersions).values({
    articleId,
    versionNumber: (lastVersion?.versionNumber || 0) + 1,
    title: parsed.title,
    content: parsed.content,
    changedBy: session.user.id,
    changeSummary: `Updated`,
  });

  revalidatePath(`/brand/${brandSlug}/articles`);
  revalidatePath(`/brand/${brandSlug}/articles/${articleId}`);
}

export async function deleteArticle(articleId: string, brandSlug: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.delete(articles).where(eq(articles.id, articleId));
  revalidatePath(`/brand/${brandSlug}/articles`);
}

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
});

export async function createCategory(brandId: string, brandSlug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = categorySchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    parentId: formData.get("parentId") || null,
  });

  const slug = slugify(parsed.name);

  await db.insert(categories).values({
    brandId,
    name: parsed.name,
    slug,
    description: parsed.description || null,
    parentId: parsed.parentId || null,
  });

  revalidatePath(`/brand/${brandSlug}/categories`);
}

export async function updateCategory(
  categoryId: string,
  brandSlug: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = categorySchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    parentId: formData.get("parentId") || null,
  });

  await db
    .update(categories)
    .set({
      name: parsed.name,
      description: parsed.description || null,
      parentId: parsed.parentId || null,
    })
    .where(eq(categories.id, categoryId));

  revalidatePath(`/brand/${brandSlug}/categories`);
}

export async function deleteCategory(categoryId: string, brandSlug: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.delete(categories).where(eq(categories.id, categoryId));
  revalidatePath(`/brand/${brandSlug}/categories`);
}
