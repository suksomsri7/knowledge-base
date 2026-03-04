"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { addMemberToBrand } from "@/lib/actions/brand-actions";

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface Role {
  id: string;
  name: string;
}

interface AddMemberDialogProps {
  brandId: string;
  brandSlug: string;
}

export function AddMemberDialog({ brandId, brandSlug }: AddMemberDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    if (!open) return;

    Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch(`/api/brands/${brandSlug}/roles`).then((r) => r.json()),
    ]).then(([usersData, rolesData]) => {
      setUsers(usersData);
      setRoles(rolesData.roles);
    });
  }, [open, brandSlug]);

  async function handleSubmit() {
    if (!selectedUser || !selectedRole) return;
    setLoading(true);

    try {
      await addMemberToBrand(brandId, selectedUser, selectedRole);
      setOpen(false);
      setSelectedUser("");
      setSelectedRole("");
      router.refresh();
    } catch (error) {
      console.error("Failed to add member:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 size-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>User</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.displayName} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedUser || !selectedRole}
            >
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
