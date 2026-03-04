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
import { Checkbox } from "@/components/ui/checkbox";
import { createUser, updateUser } from "@/lib/actions/user-actions";
import { Plus, Pencil, Loader2 } from "lucide-react";

interface UserFormProps {
  user?: {
    id: string;
    email: string;
    displayName: string;
    isSuperAdmin: boolean;
  };
}

export function UserForm({ user }: UserFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(user?.isSuperAdmin ?? false);
  const isEdit = !!user;

  async function handleSubmit(formData: FormData) {
    formData.set("isSuperAdmin", isSuperAdmin.toString());
    setLoading(true);
    try {
      if (isEdit) {
        await updateUser(user.id, formData);
      } else {
        await createUser(formData);
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
            เพิ่มผู้ใช้
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "แก้ไขผู้ใช้" : "สร้างผู้ใช้ใหม่"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "แก้ไขข้อมูลผู้ใช้"
              : "กรอกข้อมูลเพื่อสร้างผู้ใช้ใหม่ในระบบ"}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">ชื่อที่แสดง</Label>
              <Input
                id="displayName"
                name="displayName"
                defaultValue={user?.displayName ?? ""}
                placeholder="ชื่อ-นามสกุล"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user?.email ?? ""}
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">
                รหัสผ่าน{isEdit && " (เว้นว่างหากไม่ต้องการเปลี่ยน)"}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={isEdit ? "••••••" : "อย่างน้อย 6 ตัวอักษร"}
                required={!isEdit}
                minLength={isEdit ? undefined : 6}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isSuperAdmin"
                checked={isSuperAdmin}
                onCheckedChange={(checked) =>
                  setIsSuperAdmin(checked === true)
                }
              />
              <Label htmlFor="isSuperAdmin" className="cursor-pointer">
                Super Admin
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "บันทึก" : "สร้างผู้ใช้"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
