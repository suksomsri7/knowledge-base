"use client";

import { useRouter } from "next/navigation";
import { toggleFlowActive, deleteFlow } from "@/lib/actions/flow-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Power, Trash2 } from "lucide-react";

export function FlowActions({
  flowId,
  isActive,
  brandSlug,
  agentSlug,
}: {
  flowId: string;
  isActive: boolean;
  brandSlug: string;
  agentSlug: string;
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={async () => {
            await toggleFlowActive(flowId, !isActive, brandSlug, agentSlug);
            router.refresh();
          }}
        >
          <Power className="w-4 h-4 mr-2" />
          {isActive ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600"
          onClick={async () => {
            if (confirm("ลบ Flow นี้?")) {
              await deleteFlow(flowId, brandSlug, agentSlug);
              router.refresh();
            }
          }}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          ลบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
