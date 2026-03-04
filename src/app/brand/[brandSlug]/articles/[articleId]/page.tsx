"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArticleForm } from "@/components/articles/article-form";
import { Button } from "@/components/ui/button";
import { deleteArticle } from "@/lib/actions/article-actions";
import { Loader2, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  categoryId: string | null;
  status: string;
  excerpt: string | null;
  tags: string[] | null;
}

interface PageData {
  brandId: string;
  article: Article;
  categories: Category[];
}

export default function EditArticlePage() {
  const params = useParams<{ brandSlug: string; articleId: string }>();
  const router = useRouter();
  const { brandSlug, articleId } = params;
  const [data, setData] = useState<PageData | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const [catRes, artRes] = await Promise.all([
        fetch(`/api/brands/${brandSlug}/categories`),
        fetch(`/api/brands/${brandSlug}/articles/${articleId}`),
      ]);
      const catJson = await catRes.json();
      const artJson = await artRes.json();

      setData({
        brandId: catJson.brandId,
        article: artJson.article,
        categories: catJson.categories,
      });
    }
    load();
  }, [brandSlug, articleId]);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this article?")) return;
    setDeleting(true);
    try {
      await deleteArticle(articleId, brandSlug);
      router.push(`/brand/${brandSlug}/articles`);
    } catch (error) {
      console.error("Failed to delete:", error);
      setDeleting(false);
    }
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Edit Article</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="text-destructive hover:text-destructive"
        >
          {deleting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 size-4" />
          )}
          Delete
        </Button>
      </div>
      <ArticleForm
        brandSlug={brandSlug}
        brandId={data.brandId}
        article={data.article}
        categories={data.categories}
      />
    </div>
  );
}
