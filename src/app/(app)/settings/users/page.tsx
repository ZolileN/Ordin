import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveOrganization } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function UsersPage() {
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
        <h1 className="text-2xl font-semibold text-zinc-900">Users</h1>
        <p className="text-sm text-zinc-500">Team members and roles</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-zinc-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-5 py-3 font-medium">{m.user.name ?? "—"}</td>
                  <td className="px-5 py-3 text-zinc-500">{m.user.email}</td>
                  <td className="px-5 py-3">{m.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
