"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { logAudit } from "@/lib/actions/audit-actions";

const createUserSchema = z.object({
  email: z.string().email("Invalid email"),
  displayName: z.string().min(1, "Name is required").max(100),
  password: z.string().min(6, "Password must be at least 6 characters"),
  isSuperAdmin: z.boolean().optional(),
});

const updateUserSchema = z.object({
  email: z.string().email("Invalid email"),
  displayName: z.string().min(1, "Name is required").max(100),
  password: z.string().optional(),
  isSuperAdmin: z.boolean().optional(),
});

export async function createUser(formData: FormData) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) throw new Error("Unauthorized");

  const parsed = createUserSchema.parse({
    email: formData.get("email"),
    displayName: formData.get("displayName"),
    password: formData.get("password"),
    isSuperAdmin: formData.get("isSuperAdmin") === "true",
  });

  const passwordHash = await bcrypt.hash(parsed.password, 12);

  const [user] = await db
    .insert(users)
    .values({
      email: parsed.email.toLowerCase(),
      displayName: parsed.displayName,
      passwordHash,
      isSuperAdmin: parsed.isSuperAdmin || false,
    })
    .returning();

  await logAudit({ userId: session.user.id, action: "create", resourceType: "user", resourceId: user.id, details: { email: parsed.email } });

  revalidatePath("/admin/users");
  return user;
}

export async function updateUser(userId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) throw new Error("Unauthorized");

  const parsed = updateUserSchema.parse({
    email: formData.get("email"),
    displayName: formData.get("displayName"),
    password: formData.get("password") || undefined,
    isSuperAdmin: formData.get("isSuperAdmin") === "true",
  });

  const updateData: Record<string, unknown> = {
    email: parsed.email.toLowerCase(),
    displayName: parsed.displayName,
    isSuperAdmin: parsed.isSuperAdmin || false,
    updatedAt: new Date(),
  };

  if (parsed.password && parsed.password.length >= 6) {
    updateData.passwordHash = await bcrypt.hash(parsed.password, 12);
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));

  await logAudit({ userId: session.user.id, action: "update", resourceType: "user", resourceId: userId, details: { email: parsed.email } });

  revalidatePath("/admin/users");
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) throw new Error("Unauthorized");

  await db
    .update(users)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(users.id, userId));

  await logAudit({ userId: session.user.id, action: "toggle_active", resourceType: "user", resourceId: userId, details: { isActive } });

  revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) throw new Error("Unauthorized");

  if (userId === session.user.id) throw new Error("Cannot delete yourself");

  await db.delete(users).where(eq(users.id, userId));

  await logAudit({ userId: session.user.id, action: "delete", resourceType: "user", resourceId: userId });

  revalidatePath("/admin/users");
}
