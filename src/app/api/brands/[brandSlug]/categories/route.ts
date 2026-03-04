import { db } from "@/lib/db";
import { brands, categories } from "@/lib/db/schema";
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

  const categoryList = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.brandId, brand.id));

  return NextResponse.json({
    brandId: brand.id,
    categories: categoryList,
  });
}
