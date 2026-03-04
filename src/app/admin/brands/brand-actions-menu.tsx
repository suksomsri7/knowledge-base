"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleBrandActive, deleteBrand } from "@/lib/actions/brand-actions";
import { MoreHorizontal, Power, Trash2 } from "lucide-react";

interface BrandActionsProps {
  brand: {
    id: string;
    name: string;
    isActive: boolean;
  };
}

export function BrandActions({ brand }: BrandActionsProps) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      await toggleBrandActive(brand.id, !brand.isActive);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`ยืนยันลบแบรนด์ "${brand.name}" ?`)) return;
    setLoading(true);
    try {
      await deleteBrand(brand.id);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={loading}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleToggle}>
          <Power className="mr-2 size-4" />
          {brand.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-4" />
          ลบแบรนด์
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
