"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Menu, BookOpen, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function MobileHeader({
  links,
  title,
}: {
  links: NavLink[];
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="md:hidden sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div className="flex items-center justify-between px-4 h-14">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">{title}</SheetTitle>
            <div className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-sm">{title}</span>
            </div>
            <Separator />
            <nav className="p-2 space-y-1">
              {links.map((link) => {
                const isActive =
                  link.href === pathname ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-600 hover:bg-neutral-100"
                    )}
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-2 border-t">
              {session?.user && (
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100"
                >
                  <User className="w-4 h-4" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{session.user.name}</p>
                    <p className="text-xs text-neutral-500 truncate">
                      @{session.user.email}
                    </p>
                  </div>
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100 w-full"
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
        <span className="font-semibold text-sm">{title}</span>
        <div className="w-9" />
      </div>
    </div>
  );
}
