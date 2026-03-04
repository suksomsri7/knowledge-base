"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Users,
  Settings,
  LogOut,
  BookOpen,
  ChevronLeft,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export function BrandSidebar({ brandName }: { brandName: string }) {
  const pathname = usePathname();
  const params = useParams();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const brandSlug = params.brandSlug as string;

  const brandLinks = [
    { href: `/brand/${brandSlug}`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/brand/${brandSlug}/articles`, label: "Articles", icon: FileText },
    { href: `/brand/${brandSlug}/categories`, label: "Categories", icon: FolderTree },
    { href: `/brand/${brandSlug}/members`, label: "Members", icon: Users },
    { href: `/brand/${brandSlug}/settings`, label: "Settings", icon: Settings },
  ];

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
          <span className="font-semibold text-sm truncate">{brandName}</span>
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
        {brandLinks.map((link) => {
          const isActive =
            link.href === `/brand/${brandSlug}`
              ? pathname === `/brand/${brandSlug}`
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

      <div className="p-2 space-y-1">
        <Link
          href="/brands"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>All Brands</span>}
        </Link>
        {!collapsed && session?.user && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium truncate">{session.user.name}</p>
            <p className="text-xs text-neutral-500 truncate">{session.user.email}</p>
          </div>
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
