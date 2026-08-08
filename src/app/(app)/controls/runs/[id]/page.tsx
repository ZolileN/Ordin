import { auth } from "@/lib/auth";
import { getControlRunResults } from "@/lib/control-engine/engine";
import { getActiveOrganization } from "@/lib/tenant";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";

export default async function ControlRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organization = await getActiveOrganization(session.user.id);
  if (!organization) redirect("/signup");

  const run = await getControlRunResults(id, organization.id);
  if (!run) notFound();

  const metrics = run.metrics as Record<string, number>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-zinc-500">
          <Link href="/controls/runs" className="hover:underline">Control Runs</Link>
          {" / "}
          {run.control.name}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Run Results</h1>
        <p className="text-sm text-zinc-500">
          {run.completedAt ? new Date(run.completedAt).toLocaleString() : "In progress"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard title="Total Records" value={formatNumber(metrics?.totalSource ?? 0)} />
        <StatCard title="Matched" value={formatNumber(metrics?.matched ?? 0)} />
        <StatCard title="Partial" value={formatNumber(metrics?.partial ?? 0)} />
        <StatCard title="Unmatched" value={formatNumber(metrics?.unmatched ?? 0)} />
        <StatCard title="Duplicates" value={formatNumber(metrics?.duplicates ?? 0)} />
        <StatCard title="Exceptions" value={formatNumber(metrics?.exceptions ?? 0)} />
        <StatCard title="Exposure" value={formatCurrency(metrics?.financialExposure ?? 0)} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Exceptions</CardTitle>
          <Link href={`/exceptions?run=${run.id}`} className="text-sm text-zinc-500 hover:text-zinc-900">
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {run.exceptions.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-400">No exceptions found</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {run.exceptions.slice(0, 20).map((ex) => (
                <Link
                  key={ex.id}
                  href={`/exceptions/${ex.id}`}
                  className="flex items-center justify-between py-3 hover:bg-zinc-50 -mx-2 px-2 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="severity" severity={ex.severity}>{ex.severity}</Badge>
                    <span className="text-sm font-medium">{ex.title}</span>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(Number(ex.financialImpact))}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
