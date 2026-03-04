import { db } from "@/lib/db";
import { brands, roles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ brandSlug: string }> }
) {
  const { brandSlug } = await params;

  const [brand] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(eq(brands.slug, brandSlug))
    .limit(1);

  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const roleList = await db
    .select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
      permissions: roles.permissions,
    })
    .from(roles)
    .where(eq(roles.brandId, brand.id));

  return NextResponse.json({ roles: roleList });
}
