import { db } from "@/lib/db";
import { brands, brandMembers } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BrandForm } from "./brand-form";
import { BrandActions } from "./brand-actions-menu";

export default async function BrandsPage() {
  const allBrands = await db.select().from(brands).orderBy(brands.createdAt);

  const memberCounts = await db
    .select({
      brandId: brandMembers.brandId,
      count: count(),
    })
    .from(brandMembers)
    .groupBy(brandMembers.brandId);

  const memberCountMap = new Map(
    memberCounts.map((m) => [m.brandId, m.count])
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">จัดการแบรนด์</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            จัดการแบรนด์ทั้งหมดในระบบ
          </p>
        </div>
        <BrandForm />
      </div>

      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อแบรนด์</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>สมาชิก</TableHead>
              <TableHead>วันที่สร้าง</TableHead>
              <TableHead className="w-[100px]">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allBrands.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  ยังไม่มีแบรนด์ในระบบ
                </TableCell>
              </TableRow>
            ) : (
              allBrands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {brand.slug}
                  </TableCell>
                  <TableCell>
                    <Badge variant={brand.isActive ? "default" : "secondary"}>
                      {brand.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </Badge>
                  </TableCell>
                  <TableCell>{memberCountMap.get(brand.id) ?? 0}</TableCell>
                  <TableCell>
                    {new Date(brand.createdAt).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <BrandForm brand={brand} />
                      <BrandActions brand={brand} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
