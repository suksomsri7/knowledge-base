"use server";

import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateBrandSettings(
  brandId: string,
  brandSlug: string,
  data: { description?: string; logoUrl?: string }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db
    .update(brands)
    .set({
      description: data.description ?? null,
      logoUrl: data.logoUrl ?? null,
      updatedAt: new Date(),
    })
    .where(eq(brands.id, brandId));

  revalidatePath(`/brand/${brandSlug}/settings`);
}
