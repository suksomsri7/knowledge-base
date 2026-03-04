import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireBrandPermission } from "@/lib/auth-utils";
import { BrandSettingsForm } from "./settings-form";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ brandSlug: string }>;
}) {
  const { brandSlug } = await params;

  const [brand] = await db
    .select()
    .from(brands)
    .where(eq(brands.slug, brandSlug))
    .limit(1);

  if (!brand) notFound();
  await requireBrandPermission(brand.id, "brand:settings");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <BrandSettingsForm brand={brand} brandSlug={brandSlug} />
    </div>
  );
}
