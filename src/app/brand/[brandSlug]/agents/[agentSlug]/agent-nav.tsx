"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  GitBranch,
  AlertTriangle,
  BarChart3,
  Settings,
} from "lucide-react";

const navItems = [
  { key: "", label: "Dashboard", icon: LayoutDashboard },
  { key: "/knowledge", label: "Knowledge", icon: BookOpen },
  { key: "/categories", label: "Categories", icon: FolderTree },
  { key: "/flows", label: "Flows", icon: GitBranch },
  { key: "/escalations", label: "Escalations", icon: AlertTriangle },
  { key: "/analytics", label: "Analytics", icon: BarChart3 },
  { key: "/settings", label: "Settings", icon: Settings },
];

export function AgentNav({
  brandSlug,
  agentSlug,
}: {
  brandSlug: string;
  agentSlug: string;
}) {
  const pathname = usePathname();
  const basePath = `/brand/${brandSlug}/agents/${agentSlug}`;

  return (
    <nav className="flex gap-1 border-b pb-px overflow-x-auto">
      {navItems.map((item) => {
        const href = `${basePath}${item.key}`;
        const isActive =
          item.key === ""
            ? pathname === basePath
            : pathname.startsWith(href);
        return (
          <Link
            key={item.key}
            href={href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm rounded-t-lg whitespace-nowrap transition-colors border-b-2",
              isActive
                ? "border-neutral-900 text-neutral-900 font-medium"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
