import { db } from "@/lib/db";
import { brands, roles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { RoleForm } from "./role-form";
import { DeleteRoleButton } from "./delete-role-button";

export default async function RolesPage({
  params,
}: {
  params: Promise<{ brandSlug: string }>;
}) {
  const { brandSlug } = await params;
  const session = await auth();

  const [brand] = await db
    .select()
    .from(brands)
    .where(eq(brands.slug, brandSlug))
    .limit(1);

  if (!brand) notFound();

  const roleList = await db
    .select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
      permissions: roles.permissions,
      isDefault: roles.isDefault,
    })
    .from(roles)
    .where(eq(roles.brandId, brand.id));

  const isSuperAdmin = session?.user?.isSuperAdmin ?? false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
        {isSuperAdmin && (
          <RoleForm brandId={brand.id} brandSlug={brandSlug} />
        )}
      </div>

      {roleList.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">No roles yet.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  {isSuperAdmin && <TableHead className="w-[100px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleList.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      {role.name}
                      {role.isDefault && (
                        <Badge variant="secondary" className="ml-2">
                          Default
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {role.description ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.map((perm) => (
                          <Badge
                            key={perm}
                            variant="outline"
                            className="text-xs"
                          >
                            {PERMISSIONS[perm as Permission] ?? perm}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <RoleForm
                            brandId={brand.id}
                            brandSlug={brandSlug}
                            role={role}
                          />
                          <DeleteRoleButton
                            roleId={role.id}
                            brandSlug={brandSlug}
                          />
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
