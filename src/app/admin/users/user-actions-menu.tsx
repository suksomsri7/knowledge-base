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
import { toggleUserActive, deleteUser } from "@/lib/actions/user-actions";
import { MoreHorizontal, Power, Trash2 } from "lucide-react";

interface UserActionsProps {
  user: {
    id: string;
    displayName: string;
    isActive: boolean;
  };
}

export function UserActions({ user }: UserActionsProps) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      await toggleUserActive(user.id, !user.isActive);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`ยืนยันลบผู้ใช้ "${user.displayName}" ?`)) return;
    setLoading(true);
    try {
      await deleteUser(user.id);
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
          {user.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-4" />
          ลบผู้ใช้
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
