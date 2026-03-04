import { db } from "@/lib/db";
import { brands, brandMembers, users, roles } from "@/lib/db/schema";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { MemberActions } from "./member-actions";
import { AddMemberDialog } from "./add-member-dialog";

export default async function MembersPage({
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

  const memberList = await db
    .select({
      id: brandMembers.id,
      userId: brandMembers.userId,
      isActive: brandMembers.isActive,
      joinedAt: brandMembers.joinedAt,
      userName: users.displayName,
      userEmail: users.email,
      roleName: roles.name,
    })
    .from(brandMembers)
    .leftJoin(users, eq(brandMembers.userId, users.id))
    .leftJoin(roles, eq(brandMembers.roleId, roles.id))
    .where(eq(brandMembers.brandId, brand.id));

  const isSuperAdmin = session?.user?.isSuperAdmin ?? false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Members</h1>
        {isSuperAdmin && <AddMemberDialog brandId={brand.id} brandSlug={brandSlug} />}
      </div>

      {memberList.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">No members yet.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  {isSuperAdmin && <TableHead className="w-[80px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberList.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.userName ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.userEmail ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {member.roleName ?? "No role"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={member.isActive ? "default" : "secondary"}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(member.joinedAt)}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        <MemberActions
                          brandId={brand.id}
                          userId={member.userId}
                        />
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
