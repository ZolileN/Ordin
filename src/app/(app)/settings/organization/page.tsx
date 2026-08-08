import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveOrganization } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function OrganizationSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organization = await getActiveOrganization(session.user.id);
  if (!organization) redirect("/signup");

  const members = await db.membership.findMany({
    where: { organizationId: organization.id },
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Organization</h1>
        <p className="text-sm text-zinc-500">{organization.name}</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-zinc-500">Name</dt><dd className="font-medium">{organization.name}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">Slug</dt><dd>{organization.slug}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">Members</dt><dd>{members.length}</dd></div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
