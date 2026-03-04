"use server";

import { db } from "@/lib/db";
import { brands, roles, brandMembers } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { DEFAULT_ROLES } from "@/lib/permissions";
import { logAudit } from "@/lib/actions/audit-actions";

const brandSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
});

export async function createBrand(formData: FormData) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) throw new Error("Unauthorized");

  const parsed = brandSchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  const slug = slugify(parsed.name);

  const [brand] = await db
    .insert(brands)
    .values({
      name: parsed.name,
      slug,
      description: parsed.description || null,
      createdBy: session.user.id,
    })
    .returning();

  for (const [roleName, permissions] of Object.entries(DEFAULT_ROLES)) {
    await db.insert(roles).values({
      brandId: brand.id,
      name: roleName,
      permissions,
      isDefault: roleName === "Viewer",
    });
  }

  await logAudit({ userId: session.user.id, brandId: brand.id, action: "create", resourceType: "brand", resourceId: brand.id, details: { name: parsed.name } });

  revalidatePath("/admin/brands");
  return brand;
}

export async function updateBrand(brandId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) throw new Error("Unauthorized");

  const parsed = brandSchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  await db
    .update(brands)
    .set({
      name: parsed.name,
      description: parsed.description || null,
      updatedAt: new Date(),
    })
    .where(eq(brands.id, brandId));

  await logAudit({ userId: session.user.id, brandId, action: "update", resourceType: "brand", resourceId: brandId, details: { name: parsed.name } });

  revalidatePath("/admin/brands");
}

export async function toggleBrandActive(brandId: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) throw new Error("Unauthorized");

  await db
    .update(brands)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(brands.id, brandId));

  await logAudit({ userId: session.user.id, brandId, action: "toggle_active", resourceType: "brand", resourceId: brandId, details: { isActive } });

  revalidatePath("/admin/brands");
}

export async function deleteBrand(brandId: string) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) throw new Error("Unauthorized");

  await db.delete(brands).where(eq(brands.id, brandId));

  await logAudit({ userId: session.user.id, brandId, action: "delete", resourceType: "brand", resourceId: brandId });

  revalidatePath("/admin/brands");
}

export async function addMemberToBrand(
  brandId: string,
  userId: string,
  roleId: string
) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) throw new Error("Unauthorized");

  await db
    .insert(brandMembers)
    .values({ brandId, userId, roleId })
    .onConflictDoUpdate({
      target: [brandMembers.brandId, brandMembers.userId],
      set: { roleId, isActive: true },
    });

  await logAudit({ userId: session.user.id, brandId, action: "add_member", resourceType: "brand_member", details: { targetUserId: userId, roleId } });

  revalidatePath("/admin/brands");
  revalidatePath("/brands");
}

export async function removeMemberFromBrand(brandId: string, userId: string) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) throw new Error("Unauthorized");

  await db
    .delete(brandMembers)
    .where(
      and(
        eq(brandMembers.brandId, brandId),
        eq(brandMembers.userId, userId)
      )
    );

  await logAudit({ userId: session.user.id, brandId, action: "remove_member", resourceType: "brand_member", details: { targetUserId: userId } });

  revalidatePath("/admin/brands");
  revalidatePath("/brands");
}
