"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { createRole, updateRole } from "@/lib/actions/role-actions";

interface RoleFormProps {
  brandId: string;
  brandSlug: string;
  role?: {
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
  };
}

export function RoleForm({ brandId, brandSlug, role }: RoleFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    role?.permissions ?? []
  );

  const isEdit = !!role;

  function togglePermission(perm: string) {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.delete("permissions");
      selectedPermissions.forEach((p) => formData.append("permissions", p));

      if (isEdit) {
        await updateRole(role.id, brandSlug, formData);
      } else {
        await createRole(brandId, brandSlug, formData);
      }

      setOpen(false);
      if (!isEdit) setSelectedPermissions([]);
      router.refresh();
    } catch (error) {
      console.error("Failed to save role:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="mr-2 size-4" />
            New Role
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Role" : "New Role"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              maxLength={50}
              defaultValue={role?.name ?? ""}
              placeholder="e.g. Editor"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={role?.description ?? ""}
              placeholder="Optional description"
            />
          </div>

          <div className="space-y-3">
            <Label>Permissions</Label>
            <div className="grid gap-2">
              {(Object.entries(PERMISSIONS) as [Permission, string][]).map(
                ([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedPermissions.includes(key)}
                      onCheckedChange={() => togglePermission(key)}
                    />
                    <span className="font-mono text-xs text-muted-foreground">
                      {key}
                    </span>
                    <span className="text-muted-foreground">— {label}</span>
                  </label>
                )
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
