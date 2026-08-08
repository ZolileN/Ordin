import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveOrganization } from "@/lib/tenant";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { calculateIntegrityScore } from "@/lib/control-engine/types";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organization = await getActiveOrganization(session.user.id);
  if (!organization) redirect("/signup");

  const orgId = organization.id;

  const [openExceptions, criticalExceptions, controls, latestRuns, recentExceptions] =
    await Promise.all([
      db.exception.count({
        where: { organizationId: orgId, status: { in: ["OPEN", "ASSIGNED", "INVESTIGATING"] } },
      }),
      db.exception.count({
        where: { organizationId: orgId, severity: "CRITICAL", status: { notIn: ["CLOSED", "FALSE_POSITIVE", "RESOLVED", "VERIFIED"] } },
      }),
      db.control.findMany({
        where: { organizationId: orgId, status: "ACTIVE" },
        include: {
          runs: {
            where: { status: "COMPLETED" },
            orderBy: { completedAt: "desc" },
            take: 1,
          },
        },
      }),
      db.controlRun.findMany({
        where: { organizationId: orgId, status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        take: 5,
        include: { control: { select: { name: true } } },
      }),
      db.exception.findMany({
        where: { organizationId: orgId, status: { in: ["OPEN", "ASSIGNED", "INVESTIGATING"] } },
        orderBy: [{ severity: "desc" }, { financialImpact: "desc" }],
        take: 8,
        include: { controlRun: { include: { control: { select: { name: true } } } } },
      }),
    ]);

  const financialExposure = await db.exception.aggregate({
    where: {
      organizationId: orgId,
      status: { in: ["OPEN", "ASSIGNED", "INVESTIGATING"] },
    },
    _sum: { financialImpact: true },
  });

  const exposure = Number(financialExposure._sum.financialImpact ?? 0);

  let integrityScore = 100;
  const latestMetrics = latestRuns[0]?.metrics as Record<string, number> | undefined;
  if (latestMetrics) {
    integrityScore = calculateIntegrityScore({
      totalSource: latestMetrics.totalSource ?? 0,
      totalTarget: latestMetrics.totalTarget ?? 0,
      matched: latestMetrics.matched ?? 0,
      partial: latestMetrics.partial ?? 0,
      unmatched: latestMetrics.unmatched ?? 0,
      duplicates: latestMetrics.duplicates ?? 0,
      exceptions: latestMetrics.exceptions ?? 0,
      financialExposure: latestMetrics.financialExposure ?? 0,
      matchRate: latestMetrics.matchRate ?? 100,
    });
  }

  const failedRuns = await db.controlRun.count({
    where: { organizationId: orgId, status: "FAILED" },
  });

  const severityData = [
    { name: "Critical", value: await db.exception.count({ where: { organizationId: orgId, severity: "CRITICAL", status: { notIn: ["CLOSED", "FALSE_POSITIVE"] } } }), color: "#dc2626" },
    { name: "High", value: await db.exception.count({ where: { organizationId: orgId, severity: "HIGH", status: { notIn: ["CLOSED", "FALSE_POSITIVE"] } } }), color: "#ea580c" },
    { name: "Medium", value: await db.exception.count({ where: { organizationId: orgId, severity: "MEDIUM", status: { notIn: ["CLOSED", "FALSE_POSITIVE"] } } }), color: "#d97706" },
    { name: "Low", value: await db.exception.count({ where: { organizationId: orgId, severity: "LOW", status: { notIn: ["CLOSED", "FALSE_POSITIVE"] } } }), color: "#71717a" },
  ].filter((d) => d.value > 0);

  const runChartData = latestRuns
    .slice()
    .reverse()
    .map((run) => ({
      name: run.control.name.slice(0, 20),
      matched: (run.metrics as Record<string, number>)?.matched ?? 0,
      exceptions: (run.metrics as Record<string, number>)?.exceptions ?? 0,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500">Business integrity overview for {organization.name}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Business Integrity"
          value={formatPercent(integrityScore)}
          subtitle="Across active controls"
          className="col-span-2 lg:col-span-1"
        />
        <StatCard title="Open Exceptions" value={formatNumber(openExceptions)} />
        <StatCard title="Critical" value={formatNumber(criticalExceptions)} />
        <StatCard title="Financial Exposure" value={formatCurrency(exposure)} />
        <StatCard title="Active Controls" value={formatNumber(controls.length)} />
        <StatCard title="Failed Runs" value={formatNumber(failedRuns)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exception Severity</CardTitle>
          </CardHeader>
          <CardContent>
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {severityData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-zinc-400">No open exceptions</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Control Runs</CardTitle>
          </CardHeader>
          <CardContent>
            {runChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={runChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="matched" fill="#22c55e" name="Matched" />
                  <Bar dataKey="exceptions" fill="#ef4444" name="Exceptions" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-zinc-400">No control runs yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Exceptions Requiring Attention</CardTitle>
          <Link href="/exceptions" className="text-sm text-zinc-500 hover:text-zinc-900">
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {recentExceptions.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-400">
              No open exceptions. Run a control to detect issues.
            </p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {recentExceptions.map((ex) => (
                <Link
                  key={ex.id}
                  href={`/exceptions/${ex.id}`}
                  className="flex items-center justify-between py-3 hover:bg-zinc-50 -mx-2 px-2 rounded-md transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="severity" severity={ex.severity}>
                        {ex.severity}
                      </Badge>
                      <span className="truncate text-sm font-medium text-zinc-900">{ex.title}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-400">
                      {ex.controlRun.control.name}
                    </p>
                  </div>
                  <span className="ml-4 shrink-0 text-sm font-medium text-zinc-700">
                    {formatCurrency(Number(ex.financialImpact))}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
