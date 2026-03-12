"use client";

import { useRouter } from "next/navigation";
import { deleteCategory } from "@/lib/actions/knowledge-actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function CategoryActions({
  categoryId,
  brandSlug,
  agentSlug,
}: {
  categoryId: string;
  brandSlug: string;
  agentSlug: string;
}) {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-red-500 hover:text-red-700"
      onClick={async () => {
        if (confirm("ลบหมวดหมู่นี้?")) {
          await deleteCategory(categoryId, brandSlug, agentSlug);
          router.refresh();
        }
      }}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}
