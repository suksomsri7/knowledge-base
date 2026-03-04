"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBrand, updateBrand } from "@/lib/actions/brand-actions";
import { Plus, Pencil, Loader2 } from "lucide-react";

interface BrandFormProps {
  brand?: {
    id: string;
    name: string;
    description: string | null;
  };
}

export function BrandForm({ brand }: BrandFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!brand;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      if (isEdit) {
        await updateBrand(brand.id, formData);
      } else {
        await createBrand(formData);
      }
      setOpen(false);
    } catch (error) {
      console.error(error);
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
          <Button>
            <Plus className="mr-2 size-4" />
            เพิ่มแบรนด์
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "แก้ไขแบรนด์" : "สร้างแบรนด์ใหม่"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "แก้ไขข้อมูลแบรนด์"
              : "กรอกข้อมูลเพื่อสร้างแบรนด์ใหม่ในระบบ"}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">ชื่อแบรนด์</Label>
              <Input
                id="name"
                name="name"
                defaultValue={brand?.name ?? ""}
                placeholder="ชื่อแบรนด์"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={brand?.description ?? ""}
                placeholder="คำอธิบายแบรนด์ (ไม่บังคับ)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "บันทึก" : "สร้างแบรนด์"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
