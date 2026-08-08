import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveOrganization } from "@/lib/tenant";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RunControlButton } from "@/components/controls/run-control-button";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";

export default async function ControlDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organization = await getActiveOrganization(session.user.id);
  if (!organization) redirect("/signup");

  const control = await db.control.findFirst({
    where: { id, organizationId: organization.id },
    include: {
      sources: { include: { dataset: true } },
      runs: { orderBy: { createdAt: "desc" }, take: 5 },
      rules: true,
    },
  });

  if (!control) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href="/controls" className="hover:underline">Controls</Link> / {control.name}
          </p>
          <h1 className="text-2xl font-semibold text-zinc-900">{control.name}</h1>
          <p className="text-sm text-zinc-500">{control.description}</p>
        </div>
        {control.status === "ACTIVE" && (
          <RunControlButton controlId={control.id} organizationId={organization.id} />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Status</CardTitle></CardHeader>
          <CardContent><Badge status={control.status === "ACTIVE" ? "RESOLVED" : "OPEN"}>{control.status}</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Tolerance</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{formatCurrency(Number(control.tolerance))}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Data Sources</CardTitle></CardHeader>
          <CardContent>
            {control.sources.map((s) => (
              <p key={s.id} className="text-sm text-zinc-600">{s.role}: {s.dataset?.name ?? "Not configured"}</p>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Runs</CardTitle></CardHeader>
        <CardContent>
          {control.runs.length === 0 ? (
            <p className="text-sm text-zinc-400">No runs yet. Click Run to execute this control.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {control.runs.map((run) => {
                const metrics = run.metrics as Record<string, number>;
                return (
                  <Link key={run.id} href={`/controls/runs/${run.id}`} className="flex justify-between py-3 hover:bg-zinc-50 -mx-2 px-2 rounded-md">
                    <div>
                      <Badge status={run.status === "COMPLETED" ? "RESOLVED" : "OPEN"}>{run.status}</Badge>
                      <span className="ml-2 text-sm text-zinc-500">
                        {run.completedAt ? new Date(run.completedAt).toLocaleString() : "Running..."}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(metrics?.financialExposure ?? 0)}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
