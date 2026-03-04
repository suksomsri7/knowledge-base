"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArticleForm } from "@/components/articles/article-form";
import { Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface BrandMeta {
  brandId: string;
  categories: Category[];
}

export default function NewArticlePage() {
  const params = useParams<{ brandSlug: string }>();
  const brandSlug = params.brandSlug;
  const [data, setData] = useState<BrandMeta | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/brands/${brandSlug}/categories`);
      const json = await res.json();
      setData({ brandId: json.brandId, categories: json.categories });
    }
    load();
  }, [brandSlug]);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ArticleForm
        brandSlug={brandSlug}
        brandId={data.brandId}
        categories={data.categories}
      />
    </div>
  );
}
