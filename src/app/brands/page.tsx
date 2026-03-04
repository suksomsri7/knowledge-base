import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { brands, brandMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import Link from "next/link";

export default async function BrandsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isSuperAdmin = (session.user as Record<string, unknown>).isSuperAdmin as boolean;

  let userBrands: (typeof brands.$inferSelect)[];

  if (isSuperAdmin) {
    userBrands = await db
      .select()
      .from(brands)
      .where(eq(brands.isActive, true))
      .orderBy(brands.name);
  } else {
    const memberships = await db
      .select({ brand: brands })
      .from(brandMembers)
      .innerJoin(brands, eq(brandMembers.brandId, brands.id))
      .where(eq(brandMembers.userId, session.user.id!))
      .orderBy(brands.name);

    userBrands = memberships
      .map((m) => m.brand)
      .filter((b) => b.isActive);
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-bold tracking-tight">เลือกแบรนด์</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          เลือกแบรนด์ที่ต้องการจัดการ
        </p>

        {userBrands.length === 0 ? (
          <div className="mt-12 text-center text-muted-foreground">
            <Building2 className="mx-auto size-12 opacity-30" />
            <p className="mt-4">คุณยังไม่มีสิทธิ์เข้าถึงแบรนด์ใดๆ</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userBrands.map((brand) => (
              <Link key={brand.id} href={`/brand/${brand.slug}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{brand.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {brand.slug}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {brand.description || "ไม่มีคำอธิบาย"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
