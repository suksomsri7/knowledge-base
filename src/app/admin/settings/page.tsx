import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Server, Shield } from "lucide-react";

export default async function SettingsPage() {
  let dbStatus = "connected";
  try {
    await db.select({ value: count() }).from(users);
  } catch {
    dbStatus = "disconnected";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">ตั้งค่าระบบ</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        ข้อมูลและการตั้งค่าระบบ
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              เวอร์ชัน
            </CardTitle>
            <Server className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">v0.1.0</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Next.js 15 App Router
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ฐานข้อมูล
            </CardTitle>
            <Database className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge
                variant={dbStatus === "connected" ? "default" : "destructive"}
              >
                {dbStatus === "connected" ? "เชื่อมต่อแล้ว" : "ไม่สามารถเชื่อมต่อ"}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              PostgreSQL (Neon) + Drizzle ORM
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              การยืนยันตัวตน
            </CardTitle>
            <Shield className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">NextAuth.js v5</div>
            <p className="mt-1 text-xs text-muted-foreground">
              JWT Strategy + Credentials Provider
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
