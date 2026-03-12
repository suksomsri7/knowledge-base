"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCategory } from "@/lib/actions/knowledge-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export function CategoryForm({
  agentId,
  brandSlug,
  agentSlug,
}: {
  agentId: string;
  brandSlug: string;
  agentSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createCategory(agentId, brandSlug, agentSlug, formData);
      setOpen(false);
      router.refresh();
    } catch {
      alert("Error creating category");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มหมวดหมู่
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>สร้างหมวดหมู่ใหม่</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อหมวดหมู่</Label>
            <Input id="name" name="name" required placeholder="e.g. ข้อมูลทั่วไป" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">คำอธิบาย</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "กำลังสร้าง..." : "สร้าง"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
