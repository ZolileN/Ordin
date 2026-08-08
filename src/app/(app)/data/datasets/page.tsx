import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveOrganization } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function DatasetsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organization = await getActiveOrganization(session.user.id);
  if (!organization) redirect("/signup");

  const datasets = await db.dataset.findMany({
    where: { organizationId: organization.id },
    include: { dataSource: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Datasets</h1>
        <p className="text-sm text-zinc-500">Uploaded and normalized datasets</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-zinc-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Rows</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {datasets.map((d) => (
                <tr key={d.id} className="hover:bg-zinc-50">
                  <td className="px-5 py-3 font-medium">{d.name}</td>
                  <td className="px-5 py-3 text-zinc-500">{d.dataSource.name}</td>
                  <td className="px-5 py-3">{d.rowCount.toLocaleString()}</td>
                  <td className="px-5 py-3">{d.status}</td>
                  <td className="px-5 py-3 text-zinc-400">{new Date(d.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {datasets.length === 0 && <p className="py-12 text-center text-sm text-zinc-400">No datasets yet</p>}
        </CardContent>
      </Card>
    </div>
  );
}
