"use server";

import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export async function logAudit(params: {
  userId: string;
  brandId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    userId: params.userId,
    brandId: params.brandId || null,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId || null,
    details: params.details || {},
  });
}
