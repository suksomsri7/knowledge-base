import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { escalations } from "@/lib/db/schema";
import { validateApiKey, unauthorizedResponse, logApiCall } from "@/lib/kb-search";
import { z } from "zod";

const escalateSchema = z.object({
  question: z.string().min(1),
  customerContext: z.string().optional(),
  aiAttemptedAnswer: z.string().optional(),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  sessionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const start = Date.now();
  const agent = await validateApiKey(request);
  if (!agent) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = escalateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { question, customerContext, aiAttemptedAnswer, priority, sessionId } = parsed.data;

  const [escalation] = await db
    .insert(escalations)
    .values({
      agentId: agent.id,
      question,
      customerContext: customerContext ?? null,
      aiAttemptedAnswer: aiAttemptedAnswer ?? null,
      priority,
      sessionId: sessionId ?? null,
    })
    .returning({ id: escalations.id, status: escalations.status });

  const responseMs = Date.now() - start;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? null;
  await logApiCall(agent.id, "escalate", question, 0, null, "escalate", responseMs, ip);

  return NextResponse.json({
    id: escalation.id,
    status: escalation.status,
    message: "Escalation created successfully",
  });
}
