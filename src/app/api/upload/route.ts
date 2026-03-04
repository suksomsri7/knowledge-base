import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { uploadToBunny } from "@/lib/bunny";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const brandId = formData.get("brandId") as string;

  if (!file || !brandId) {
    return NextResponse.json(
      { error: "File and brandId required" },
      { status: 400 }
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large (max 10MB)" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${timestamp}-${safeName}`;
  const path = `brands/${brandId}`;

  const fileUrl = await uploadToBunny(buffer, fileName, path);

  const [attachment] = await db
    .insert(attachments)
    .values({
      brandId,
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy: session.user.id,
    })
    .returning();

  return NextResponse.json({
    url: fileUrl,
    fileName: file.name,
    fileSize: file.size,
    id: attachment.id,
  });
}
