import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isSuperAdmin = (session.user as Record<string, unknown>).isSuperAdmin as boolean;

  if (isSuperAdmin) {
    redirect("/admin");
  }

  redirect("/brands");
}
