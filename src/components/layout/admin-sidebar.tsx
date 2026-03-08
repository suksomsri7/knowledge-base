"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  LogOut,
  BookOpen,
  ChevronLeft,
  ScrollText,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/brands", label: "จัดการ KB", icon: FileText },
  { href: "/admin/brands", label: "Brands", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen bg-white border-r border-neutral-200 flex flex-col transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="p-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm truncate">Knowledge Base</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("ml-auto h-7 w-7", collapsed && "ml-0")}
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft
            className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")}
          />
        </Button>
      </div>

      <Separator />

      <nav className="flex-1 p-2 space-y-1">
        {adminLinks.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              )}
            >
              <link.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="p-2">
        {!collapsed && session?.user && (
          <Link href="/profile" className="block px-3 py-2 mb-1 rounded-lg hover:bg-neutral-100 transition-colors">
            <p className="text-sm font-medium truncate">{session.user.name}</p>
            <p className="text-xs text-neutral-500 truncate">@{session.user.email}</p>
          </Link>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors w-full"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>ออกจากระบบ</span>}
        </button>
      </div>
    </aside>
  );
}
