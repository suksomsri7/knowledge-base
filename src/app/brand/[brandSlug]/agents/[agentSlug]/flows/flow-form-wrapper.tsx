"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createFlow, updateFlow } from "@/lib/actions/flow-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FlowFormWrapperProps {
  agentId: string;
  brandSlug: string;
  agentSlug: string;
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    triggerKeywords: string[];
    priority: number;
  };
}

export function FlowFormWrapper({
  agentId,
  brandSlug,
  agentSlug,
  initialData,
}: FlowFormWrapperProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isEdit = !!initialData;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      if (isEdit) {
        await updateFlow(initialData!.id, brandSlug, agentSlug, formData);
        router.refresh();
      } else {
        const flow = await createFlow(agentId, brandSlug, agentSlug, formData);
        router.push(`/brand/${brandSlug}/agents/${agentSlug}/flows/${flow.id}`);
      }
    } catch {
      alert("Error saving flow");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white border rounded-lg p-6">
      <div className="space-y-2">
        <Label htmlFor="name">ชื่อ Flow</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={initialData?.name ?? ""}
          placeholder="e.g. จองทริป"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">คำอธิบาย</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initialData?.description ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="triggerKeywords">Trigger Keywords (คั่นด้วย comma)</Label>
        <Input
          id="triggerKeywords"
          name="triggerKeywords"
          defaultValue={initialData?.triggerKeywords.join(", ") ?? ""}
          placeholder="จองทริป, booking, จอง"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority (ยิ่งสูงยิ่งสำคัญ)</Label>
        <Input
          id="priority"
          name="priority"
          type="number"
          defaultValue={initialData?.priority ?? 0}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "กำลังบันทึก..." : isEdit ? "บันทึก" : "สร้าง Flow"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/brand/${brandSlug}/agents/${agentSlug}/flows`)}
        >
          ยกเลิก
        </Button>
      </div>
    </form>
  );
}
