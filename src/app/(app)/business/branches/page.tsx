import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveOrganization } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function BranchesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organization = await getActiveOrganization(session.user.id);
  if (!organization) redirect("/signup");

  const branches = await db.branch.findMany({
    where: { entity: { organizationId: organization.id } },
    include: { entity: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Branches</h1>
        <p className="text-sm text-zinc-500">Branch locations across entities</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {branches.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-400">No branches configured</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-zinc-500">
                  <th className="px-5 py-3 font-medium">Branch</th>
                  <th className="px-5 py-3 font-medium">Entity</th>
                  <th className="px-5 py-3 font-medium">Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {branches.map((b) => (
                  <tr key={b.id}>
                    <td className="px-5 py-3 font-medium">{b.name}</td>
                    <td className="px-5 py-3 text-zinc-500">{b.entity.name}</td>
                    <td className="px-5 py-3">{b.code ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
