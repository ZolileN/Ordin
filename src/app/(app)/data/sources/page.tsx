import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveOrganization } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

export default async function DataSourcesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organization = await getActiveOrganization(session.user.id);
  if (!organization) redirect("/signup");

  const sources = await db.dataSource.findMany({
    where: { organizationId: organization.id },
    include: { _count: { select: { datasets: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Data Sources</h1>
          <p className="text-sm text-zinc-500">Connected data sources for controls</p>
        </div>
        <Button asChild>
          <Link href="/data/upload"><Plus className="h-4 w-4" />Upload Data</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-zinc-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Datasets</th>
                <th className="px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {sources.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50">
                  <td className="px-5 py-3 font-medium">{s.name}</td>
                  <td className="px-5 py-3 text-zinc-500">{s.type}</td>
                  <td className="px-5 py-3 text-zinc-500">{s.status}</td>
                  <td className="px-5 py-3">{s._count.datasets}</td>
                  <td className="px-5 py-3 text-zinc-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sources.length === 0 && <p className="py-12 text-center text-sm text-zinc-400">No data sources yet</p>}
        </CardContent>
      </Card>
    </div>
  );
}
