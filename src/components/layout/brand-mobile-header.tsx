"use client";

import { MobileHeader } from "./mobile-header";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Users,
  Shield,
  Settings,
} from "lucide-react";

export function BrandMobileHeader({
  brandSlug,
  brandName,
}: {
  brandSlug: string;
  brandName: string;
}) {
  const brandLinks = [
    { href: `/brand/${brandSlug}`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/brand/${brandSlug}/articles`, label: "Articles", icon: FileText },
    {
      href: `/brand/${brandSlug}/categories`,
      label: "Categories",
      icon: FolderTree,
    },
    { href: `/brand/${brandSlug}/members`, label: "Members", icon: Users },
    { href: `/brand/${brandSlug}/roles`, label: "Roles", icon: Shield },
    {
      href: `/brand/${brandSlug}/settings`,
      label: "Settings",
      icon: Settings,
    },
  ];

  return <MobileHeader links={brandLinks} title={brandName} />;
}
