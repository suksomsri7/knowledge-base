"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAgentSettings, regenerateApiKey } from "@/lib/actions/agent-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, RefreshCw, Key } from "lucide-react";

interface AgentSettingsFormProps {
  agent: {
    id: string;
    apiKey: string;
    answerThreshold: number;
    escalateThreshold: number;
    disclaimerMessage: string | null;
    noAnswerMessage: string | null;
  };
  brandSlug: string;
  agentSlug: string;
}

export function AgentSettingsForm({ agent, brandSlug, agentSlug }: AgentSettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(agent.apiKey);
  const [copied, setCopied] = useState(false);
  const [answerThreshold, setAnswerThreshold] = useState(agent.answerThreshold);
  const [escalateThreshold, setEscalateThreshold] = useState(agent.escalateThreshold);
  const router = useRouter();

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await updateAgentSettings(agent.id, brandSlug, agentSlug, formData);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    if (!confirm("การสร้าง API Key ใหม่จะทำให้ Key เก่าใช้ไม่ได้ ต้องการดำเนินการ?")) return;
    const newKey = await regenerateApiKey(agent.id, brandSlug);
    setApiKey(newKey);
  }

  function handleCopy() {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Key className="w-4 h-4" />
          API Key
        </h3>
        <p className="text-sm text-neutral-500">
          ใช้ Key นี้ใน Header <code className="px-1 py-0.5 bg-neutral-100 rounded text-xs">X-API-Key</code> เมื่อเรียก API
        </p>
        <div className="flex gap-2">
          <Input value={apiKey} readOnly className="font-mono text-sm" />
          <Button variant="outline" size="icon" onClick={handleCopy} title="Copy">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleRegenerate} title="Regenerate">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        {copied && <p className="text-xs text-green-600">Copied!</p>}
      </div>

      <form onSubmit={handleSave} className="bg-white border rounded-lg p-6 space-y-6">
        <h3 className="font-semibold">Confidence Thresholds</h3>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>
              Answer Threshold: <span className="font-mono">{answerThreshold}</span>
            </Label>
            <input
              type="range"
              name="answerThreshold"
              min={0}
              max={100}
              value={answerThreshold}
              onChange={(e) => setAnswerThreshold(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-neutral-500">
              Confidence ≥ {answerThreshold} → ตอบอัตโนมัติ
            </p>
          </div>

          <div className="space-y-2">
            <Label>
              Escalate Threshold: <span className="font-mono">{escalateThreshold}</span>
            </Label>
            <input
              type="range"
              name="escalateThreshold"
              min={0}
              max={100}
              value={escalateThreshold}
              onChange={(e) => setEscalateThreshold(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-neutral-500">
              Confidence {escalateThreshold}–{answerThreshold - 1} → ตอบพร้อม disclaimer | {"<"} {escalateThreshold} → escalate
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Messages</h3>
          <div className="space-y-2">
            <Label htmlFor="disclaimerMessage">Disclaimer Message</Label>
            <Textarea
              id="disclaimerMessage"
              name="disclaimerMessage"
              rows={3}
              defaultValue={agent.disclaimerMessage ?? ""}
              placeholder="ข้อความเมื่อ confidence อยู่ระหว่าง threshold"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="noAnswerMessage">No Answer Message</Label>
            <Textarea
              id="noAnswerMessage"
              name="noAnswerMessage"
              rows={3}
              defaultValue={agent.noAnswerMessage ?? ""}
              placeholder="ข้อความเมื่อ confidence ต่ำกว่า escalate threshold"
            />
          </div>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </Button>
      </form>
    </div>
  );
}
