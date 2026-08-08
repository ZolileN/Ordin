import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveOrganization } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function EntitiesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organization = await getActiveOrganization(session.user.id);
  if (!organization) redirect("/signup");

  const entities = await db.entity.findMany({
    where: { organizationId: organization.id },
    include: { _count: { select: { branches: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Entities</h1>
        <p className="text-sm text-zinc-500">Business entities in your organization</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-zinc-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">External ID</th>
                <th className="px-5 py-3 font-medium">Branches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {entities.map((e) => (
                <tr key={e.id}>
                  <td className="px-5 py-3 font-medium">{e.name}</td>
                  <td className="px-5 py-3 text-zinc-500">{e.externalId ?? "—"}</td>
                  <td className="px-5 py-3">{e._count.branches}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
