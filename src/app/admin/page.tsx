export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { brands, users, articles } from "@/lib/db/schema";
import { count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, FileText } from "lucide-react";

export default async function AdminDashboard() {
  const [[brandCount], [userCount], [articleCount]] = await Promise.all([
    db.select({ value: count() }).from(brands),
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(articles),
  ]);

  const stats = [
    {
      title: "แบรนด์ทั้งหมด",
      value: brandCount.value,
      icon: Building2,
    },
    {
      title: "ผู้ใช้ทั้งหมด",
      value: userCount.value,
      icon: Users,
    },
    {
      title: "บทความทั้งหมด",
      value: articleCount.value,
      icon: FileText,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">แดชบอร์ด</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        ภาพรวมของระบบ Knowledge Base
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
