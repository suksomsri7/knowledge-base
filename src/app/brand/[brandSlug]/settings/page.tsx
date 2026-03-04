import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";

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

  const fields = [
    { label: "Brand Name", value: brand.name },
    { label: "Slug", value: brand.slug },
    { label: "Description", value: brand.description || "—" },
    { label: "Status", value: brand.isActive ? "Active" : "Inactive" },
    { label: "Created", value: formatDate(brand.createdAt) },
    { label: "Last Updated", value: formatDate(brand.updatedAt) },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Brand Information</CardTitle>
          <CardDescription>Read-only brand details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field) => (
            <div key={field.label} className="space-y-1">
              <Label className="text-muted-foreground">{field.label}</Label>
              <p className="text-sm font-medium">{field.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
