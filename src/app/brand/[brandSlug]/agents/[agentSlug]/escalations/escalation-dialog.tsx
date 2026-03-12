"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveEscalation, assignEscalation, dismissEscalation } from "@/lib/actions/escalation-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EscalationDialogProps {
  escalation: {
    id: string;
    question: string;
    aiAttemptedAnswer: string | null;
    status: string;
  };
  brandSlug: string;
  agentSlug: string;
  categories: { id: string; name: string }[];
  users: { id: string; displayName: string }[];
}

export function EscalationDialog({
  escalation,
  brandSlug,
  agentSlug,
  categories,
  users,
}: EscalationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolutionType, setResolutionType] = useState("added_to_kb");
  const router = useRouter();

  async function handleResolve(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("resolutionType", resolutionType);
      await resolveEscalation(escalation.id, brandSlug, agentSlug, formData);
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDismiss() {
    if (!confirm("ปิด escalation นี้?")) return;
    await dismissEscalation(escalation.id, brandSlug, agentSlug);
    setOpen(false);
    router.refresh();
  }

  async function handleAssign(userId: string) {
    await assignEscalation(escalation.id, userId, brandSlug, agentSlug);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">ตอบ</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Resolve Escalation</DialogTitle>
        </DialogHeader>

        <div className="p-3 bg-neutral-50 rounded text-sm mb-4">
          <p className="font-medium mb-1">คำถาม:</p>
          <p>{escalation.question}</p>
          {escalation.aiAttemptedAnswer && (
            <>
              <p className="font-medium mt-2 mb-1">AI attempted:</p>
              <p className="text-neutral-500">{escalation.aiAttemptedAnswer}</p>
            </>
          )}
        </div>

        <form onSubmit={handleResolve} className="space-y-4">
          <div className="space-y-2">
            <Label>คำตอบ</Label>
            <Textarea name="answer" rows={4} required placeholder="พิมพ์คำตอบ..." />
          </div>

          <div className="space-y-2">
            <Label>หมายเหตุ (admin only)</Label>
            <Input name="adminNotes" placeholder="optional notes" />
          </div>

          <div className="space-y-2">
            <Label>Resolution Type</Label>
            <div className="space-y-2">
              {[
                { value: "added_to_kb", label: "เพิ่มไปยัง Knowledge Base" },
                { value: "direct_reply", label: "ตอบตรง (ไม่เพิ่ม KB)" },
                { value: "not_relevant", label: "ไม่เกี่ยวข้อง" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="resType"
                    value={opt.value}
                    checked={resolutionType === opt.value}
                    onChange={() => setResolutionType(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {resolutionType === "added_to_kb" && (
            <>
              <div className="space-y-2">
                <Label>หมวดหมู่</Label>
                <Select name="categoryId">
                  <SelectTrigger>
                    <SelectValue placeholder="เลือก (ไม่บังคับ)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ไม่ระบุ</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Keywords (comma-separated)</Label>
                <Input name="keywords" placeholder="keyword1, keyword2" />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>มอบหมายให้</Label>
            <Select onValueChange={handleAssign}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleDismiss}>
              ปิด (Dismiss)
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "กำลังบันทึก..." : "Resolve"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
