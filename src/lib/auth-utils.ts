import { db } from "@/lib/db";
import { brandMembers, roles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getBrandPermissions(userId: string, brandId: string): Promise<string[]> {
  const [membership] = await db
    .select({
      permissions: roles.permissions,
    })
    .from(brandMembers)
    .leftJoin(roles, eq(brandMembers.roleId, roles.id))
    .where(
      and(
        eq(brandMembers.userId, userId),
        eq(brandMembers.brandId, brandId),
        eq(brandMembers.isActive, true)
      )
    )
    .limit(1);

  if (!membership?.permissions) return [];
  return membership.permissions as string[];
}

export async function requireBrandPermission(
  brandId: string,
  permission: string | string[]
): Promise<{ userId: string; isSuperAdmin: boolean; permissions: string[] }> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.isSuperAdmin) {
    return { userId: session.user.id, isSuperAdmin: true, permissions: ["*"] };
  }

  const permissions = await getBrandPermissions(session.user.id, brandId);
  const required = Array.isArray(permission) ? permission : [permission];
  const hasAccess = required.some((p) => permissions.includes(p));

  if (!hasAccess) {
    redirect("/brands");
  }

  return { userId: session.user.id, isSuperAdmin: false, permissions };
}
