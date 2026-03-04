"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { removeMemberFromBrand } from "@/lib/actions/brand-actions";
import { Loader2, UserMinus } from "lucide-react";

interface MemberActionsProps {
  brandId: string;
  userId: string;
}

export function MemberActions({ brandId, userId }: MemberActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm("Remove this member from the brand?")) return;
    setLoading(true);

    try {
      await removeMemberFromBrand(brandId, userId);
      router.refresh();
    } catch (error) {
      console.error("Failed to remove member:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRemove}
      disabled={loading}
      className="text-destructive hover:text-destructive"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <UserMinus className="size-4" />
      )}
    </Button>
  );
}
