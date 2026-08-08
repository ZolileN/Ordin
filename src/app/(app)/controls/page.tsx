import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveOrganization } from "@/lib/tenant";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Play, Plus } from "lucide-react";
import { RunControlButton } from "@/components/controls/run-control-button";

export default async function ControlsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organization = await getActiveOrganization(session.user.id);
  if (!organization) redirect("/signup");

  const controls = await db.control.findMany({
    where: { organizationId: organization.id },
    include: {
      runs: {
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        take: 1,
      },
      sources: { include: { dataset: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Controls</h1>
          <p className="text-sm text-zinc-500">Manage business integrity controls</p>
        </div>
        <Button asChild>
          <Link href="/controls/new">
            <Plus className="h-4 w-4" />
            Create Control
          </Link>
        </Button>
      </div>

      {controls.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <p className="text-sm text-zinc-500">No controls yet. Create your first control to get started.</p>
            <Button className="mt-4" asChild>
              <Link href="/controls/new">Create Control</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {controls.map((control) => {
            const latestRun = control.runs[0];
            const metrics = latestRun?.metrics as Record<string, number> | undefined;
            return (
              <Card key={control.id}>
                <CardContent className="flex items-center justify-between p-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-zinc-900">{control.name}</h3>
                      <Badge status={control.status === "ACTIVE" ? "RESOLVED" : "OPEN"}>
                        {control.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{control.description}</p>
                    {metrics && (
                      <div className="mt-2 flex gap-4 text-xs text-zinc-400">
                        <span>{formatNumber(metrics.matched ?? 0)} matched</span>
                        <span>{formatNumber(metrics.exceptions ?? 0)} exceptions</span>
                        <span>{formatCurrency(metrics.financialExposure ?? 0)} exposure</span>
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/controls/${control.id}`}>View</Link>
                    </Button>
                    {control.status === "ACTIVE" && (
                      <RunControlButton controlId={control.id} organizationId={organization.id} />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
