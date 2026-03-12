"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveFlowStep, deleteFlowStep } from "@/lib/actions/flow-actions";
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
import { Plus, Trash2, GripVertical } from "lucide-react";

interface StepOption {
  label: string;
  keywords: string[];
  nextStepId: string | null;
}

interface Step {
  id: string;
  stepOrder: number;
  type: string;
  message: string;
  options: StepOption[];
  isFinal: boolean;
}

export function FlowStepEditor({
  flowId,
  brandSlug,
  agentSlug,
  steps,
}: {
  flowId: string;
  brandSlug: string;
  agentSlug: string;
  steps: Step[];
}) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="space-y-4">
      {steps.map((step, idx) => (
        <StepCard
          key={step.id}
          step={step}
          index={idx}
          flowId={flowId}
          brandSlug={brandSlug}
          agentSlug={agentSlug}
          allSteps={steps}
          onRefresh={() => router.refresh()}
        />
      ))}

      {showNew ? (
        <NewStepForm
          flowId={flowId}
          brandSlug={brandSlug}
          agentSlug={agentSlug}
          onDone={() => {
            setShowNew(false);
            router.refresh();
          }}
          onCancel={() => setShowNew(false)}
        />
      ) : (
        <Button variant="outline" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 mr-2" />
          เพิ่ม Step
        </Button>
      )}
    </div>
  );
}

function StepCard({
  step,
  index,
  flowId,
  brandSlug,
  agentSlug,
  allSteps,
  onRefresh,
}: {
  step: Step;
  index: number;
  flowId: string;
  brandSlug: string;
  agentSlug: string;
  allSteps: Step[];
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("ลบ step นี้?")) return;
    await deleteFlowStep(step.id, brandSlug, agentSlug, flowId);
    onRefresh();
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("stepId", step.id);
      await saveFlowStep(flowId, brandSlug, agentSlug, formData);
      setEditing(false);
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  const typeLabel: Record<string, string> = {
    ask: "ถามลูกค้า",
    answer: "ตอบ/แจ้งข้อมูล",
    condition: "เงื่อนไข",
  };

  if (editing) {
    return (
      <form onSubmit={handleSave} className="bg-white border rounded-lg p-4 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 space-y-2">
            <Label>Type</Label>
            <Select name="type" defaultValue={step.type}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ask">ถามลูกค้า</SelectItem>
                <SelectItem value="answer">ตอบ/แจ้งข้อมูล</SelectItem>
                <SelectItem value="condition">เงื่อนไข</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isFinal" value="true" defaultChecked={step.isFinal} />
              Final step
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea name="message" rows={3} defaultValue={step.message} required />
        </div>
        <input type="hidden" name="options" value={JSON.stringify(step.options)} />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={loading}>บันทึก</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>ยกเลิก</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 flex items-start gap-3">
      <div className="text-neutral-300 pt-1">
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-neutral-400">Step {index + 1}</span>
          <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs">
            {typeLabel[step.type] ?? step.type}
          </span>
          {step.isFinal && (
            <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs">Final</span>
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap">{step.message}</p>
        {step.options.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {step.options.map((opt, i) => (
              <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                {opt.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>แก้ไข</Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={handleDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function NewStepForm({
  flowId,
  brandSlug,
  agentSlug,
  onDone,
  onCancel,
}: {
  flowId: string;
  brandSlug: string;
  agentSlug: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<StepOption[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("options", JSON.stringify(options));
      await saveFlowStep(flowId, brandSlug, agentSlug, formData);
      onDone();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border-2 border-dashed rounded-lg p-4 space-y-3">
      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          <Label>Type</Label>
          <Select name="type" defaultValue="ask">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ask">ถามลูกค้า</SelectItem>
              <SelectItem value="answer">ตอบ/แจ้งข้อมูล</SelectItem>
              <SelectItem value="condition">เงื่อนไข</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isFinal" value="true" />
            Final step
          </label>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea name="message" rows={3} placeholder="ข้อความถึงลูกค้า..." required />
      </div>
      <div className="space-y-2">
        <Label>Options (สำหรับ type ask)</Label>
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              value={opt.label}
              onChange={(e) => {
                const updated = [...options];
                updated[i] = { ...updated[i], label: e.target.value };
                setOptions(updated);
              }}
              placeholder="Label"
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-red-500 h-8 w-8"
              onClick={() => setOptions(options.filter((_, j) => j !== i))}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOptions([...options, { label: "", keywords: [], nextStepId: null }])}
        >
          <Plus className="w-3 h-3 mr-1" />
          เพิ่ม Option
        </Button>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "กำลังบันทึก..." : "เพิ่ม Step"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>ยกเลิก</Button>
      </div>
    </form>
  );
}
