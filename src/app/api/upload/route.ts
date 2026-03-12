import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToBunny } from "@/lib/bunny";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const brandId = formData.get("brandId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "bin";
    const uniqueName = `${crypto.randomUUID()}.${ext}`;
    const subPath = brandId ? `brands/${brandId}` : "general";

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToBunny(buffer, uniqueName, subPath);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
