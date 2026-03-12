"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createKnowledgeItem, updateKnowledgeItem } from "@/lib/actions/knowledge-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
}

interface KnowledgeFormProps {
  agentId: string;
  brandSlug: string;
  agentSlug: string;
  categories: Category[];
  initialData?: {
    id: string;
    type: string;
    question: string;
    answer: string;
    categoryId: string | null;
    keywords: string[] | null;
    tags: string[] | null;
    reviewAt: Date | null;
  };
}

export function KnowledgeForm({
  agentId,
  brandSlug,
  agentSlug,
  categories,
  initialData,
}: KnowledgeFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(initialData?.type ?? "faq");
  const router = useRouter();
  const isEdit = !!initialData;

  const typeLabels: Record<string, { question: string; questionPlaceholder: string; answer: string; answerPlaceholder: string }> = {
    faq: {
      question: "คำถาม",
      questionPlaceholder: "เช่น ราคาแพ็กเกจทัวร์ญี่ปุ่นเท่าไร?",
      answer: "คำตอบ",
      answerPlaceholder: "คำตอบสำหรับคำถามนี้",
    },
    info: {
      question: "หัวข้อ",
      questionPlaceholder: "เช่น นโยบายการคืนเงิน",
      answer: "เนื้อหา",
      answerPlaceholder: "รายละเอียดข้อมูล",
    },
    procedure: {
      question: "ชื่อขั้นตอน",
      questionPlaceholder: "เช่น ขั้นตอนการจองทริป",
      answer: "รายละเอียดขั้นตอน",
      answerPlaceholder: "ขั้นตอนที่ 1: ...\nขั้นตอนที่ 2: ...\nขั้นตอนที่ 3: ...",
    },
  };

  const labels = typeLabels[selectedType] ?? typeLabels.faq;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      if (isEdit) {
        await updateKnowledgeItem(initialData!.id, brandSlug, agentSlug, formData);
      } else {
        await createKnowledgeItem(agentId, brandSlug, agentSlug, formData);
      }
      router.push(`/brand/${brandSlug}/agents/${agentSlug}/knowledge`);
    } catch {
      alert("Error saving knowledge item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white border rounded-lg p-6">
      <div className="space-y-2">
        <Label htmlFor="type">ประเภท</Label>
        <Select name="type" defaultValue={initialData?.type ?? "faq"} onValueChange={setSelectedType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="faq">FAQ (ถาม-ตอบ)</SelectItem>
            <SelectItem value="info">Info (ข้อมูล)</SelectItem>
            <SelectItem value="procedure">Procedure (ขั้นตอน)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="question">{labels.question}</Label>
        <Input
          id="question"
          name="question"
          required
          defaultValue={initialData?.question ?? ""}
          placeholder={labels.questionPlaceholder}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="answer">{labels.answer}</Label>
        <Textarea
          id="answer"
          name="answer"
          required
          rows={8}
          defaultValue={initialData?.answer ?? ""}
          placeholder={labels.answerPlaceholder}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">หมวดหมู่</Label>
        <Select name="categoryId" defaultValue={initialData?.categoryId ?? "none"}>
          <SelectTrigger>
            <SelectValue placeholder="เลือกหมวดหมู่ (ไม่บังคับ)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">ไม่ระบุ</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="keywords">Keywords (คั่นด้วย comma)</Label>
        <Input
          id="keywords"
          name="keywords"
          defaultValue={initialData?.keywords?.join(", ") ?? ""}
          placeholder="ราคา, แพ็กเกจ, ญี่ปุ่น"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (คั่นด้วย comma)</Label>
        <Input
          id="tags"
          name="tags"
          defaultValue={initialData?.tags?.join(", ") ?? ""}
          placeholder="popular, pricing"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reviewAt">กำหนดตรวจสอบ</Label>
        <Input
          id="reviewAt"
          name="reviewAt"
          type="date"
          defaultValue={
            initialData?.reviewAt
              ? new Date(initialData.reviewAt).toISOString().split("T")[0]
              : ""
          }
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "กำลังบันทึก..." : isEdit ? "บันทึก" : "สร้าง Knowledge"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/brand/${brandSlug}/agents/${agentSlug}/knowledge`)}
        >
          ยกเลิก
        </Button>
      </div>
    </form>
  );
}
