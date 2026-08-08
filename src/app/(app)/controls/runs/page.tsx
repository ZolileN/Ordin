import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveOrganization } from "@/lib/tenant";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ControlRunsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organization = await getActiveOrganization(session.user.id);
  if (!organization) redirect("/signup");

  const runs = await db.controlRun.findMany({
    where: { organizationId: organization.id },
    include: { control: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Control Runs</h1>
        <p className="text-sm text-zinc-500">History of control executions</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500">
                <th className="px-5 py-3 font-medium">Control</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Matched</th>
                <th className="px-5 py-3 font-medium">Exceptions</th>
                <th className="px-5 py-3 font-medium">Exposure</th>
                <th className="px-5 py-3 font-medium">Run Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {runs.map((run) => {
                const metrics = run.metrics as Record<string, number>;
                return (
                  <tr key={run.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3">
                      <Link href={`/controls/runs/${run.id}`} className="font-medium text-zinc-900 hover:underline">
                        {run.control.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Badge status={run.status === "COMPLETED" ? "RESOLVED" : run.status === "FAILED" ? "OPEN" : "INVESTIGATING"}>
                        {run.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{formatNumber(metrics?.matched ?? 0)}</td>
                    <td className="px-5 py-3 text-zinc-600">{formatNumber(metrics?.exceptions ?? 0)}</td>
                    <td className="px-5 py-3 text-zinc-600">{formatCurrency(metrics?.financialExposure ?? 0)}</td>
                    <td className="px-5 py-3 text-zinc-400">
                      {run.completedAt ? new Date(run.completedAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {runs.length === 0 && (
            <p className="py-12 text-center text-sm text-zinc-400">No control runs yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
