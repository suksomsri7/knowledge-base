import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BrandSidebar } from "@/components/layout/brand-sidebar";
import { BrandMobileHeader } from "@/components/layout/brand-mobile-header";

export default async function BrandLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ brandSlug: string }>;
}) {
  const { brandSlug } = await params;

  const [brand] = await db
    .select()
    .from(brands)
    .where(eq(brands.slug, brandSlug))
    .limit(1);

  if (!brand) notFound();

  return (
    <div className="flex h-screen bg-neutral-50">
      <div className="hidden md:block">
        <BrandSidebar brandName={brand.name} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <BrandMobileHeader brandSlug={brandSlug} brandName={brand.name} />
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
