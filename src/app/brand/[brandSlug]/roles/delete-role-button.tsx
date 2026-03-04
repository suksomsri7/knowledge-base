"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteRole } from "@/lib/actions/role-actions";

interface DeleteRoleButtonProps {
  roleId: string;
  brandSlug: string;
}

export function DeleteRoleButton({ roleId, brandSlug }: DeleteRoleButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this role? Members using it will lose their role assignment.")) return;
    setLoading(true);

    try {
      await deleteRole(roleId, brandSlug);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete role:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="text-destructive hover:text-destructive"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}
    </Button>
  );
}
