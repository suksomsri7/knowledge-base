"use server";

import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const roleSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  permissions: z.array(z.string()),
});

export async function createRole(
  brandId: string,
  brandSlug: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const permissions = formData.getAll("permissions") as string[];
  const parsed = roleSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    permissions,
  });

  await db.insert(roles).values({
    brandId,
    name: parsed.name,
    description: parsed.description || null,
    permissions: parsed.permissions,
  });

  revalidatePath(`/brand/${brandSlug}/roles`);
}

export async function updateRole(
  roleId: string,
  brandSlug: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const permissions = formData.getAll("permissions") as string[];
  const parsed = roleSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    permissions,
  });

  await db
    .update(roles)
    .set({
      name: parsed.name,
      description: parsed.description || null,
      permissions: parsed.permissions,
    })
    .where(eq(roles.id, roleId));

  revalidatePath(`/brand/${brandSlug}/roles`);
}

export async function deleteRole(roleId: string, brandSlug: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.delete(roles).where(eq(roles.id, roleId));
  revalidatePath(`/brand/${brandSlug}/roles`);
}
