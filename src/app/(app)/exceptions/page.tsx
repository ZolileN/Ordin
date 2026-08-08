import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveOrganization } from "@/lib/tenant";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { redirect } from "next/navigation";
import { differenceInDays } from "date-fns";

export default async function ExceptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string; status?: string; assigned?: string; run?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organization = await getActiveOrganization(session.user.id);
  if (!organization) redirect("/signup");

  const where: Record<string, unknown> = { organizationId: organization.id };

  if (params.severity) where.severity = params.severity;
  if (params.status) where.status = params.status;
  else if (!params.run) where.status = { in: ["OPEN", "ASSIGNED", "INVESTIGATING"] };
  if (params.assigned === "me") where.assignedToId = session.user.id;
  if (params.run) where.controlRunId = params.run;

  const exceptions = await db.exception.findMany({
    where,
    include: {
      assignedTo: { select: { name: true } },
      controlRun: { include: { control: { select: { name: true } } } },
    },
    orderBy: [{ severity: "desc" }, { financialImpact: "desc" }],
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Exceptions</h1>
        <p className="text-sm text-zinc-500">{exceptions.length} exceptions</p>
      </div>

      <div className="flex gap-2">
        {[
          { label: "All Open", href: "/exceptions" },
          { label: "Critical", href: "/exceptions?severity=CRITICAL" },
          { label: "Assigned to Me", href: "/exceptions?assigned=me" },
          { label: "Resolved", href: "/exceptions?status=RESOLVED" },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-zinc-500">
                <th className="px-5 py-3 font-medium">Severity</th>
                <th className="px-5 py-3 font-medium">Exception</th>
                <th className="px-5 py-3 font-medium">Control</th>
                <th className="px-5 py-3 font-medium">Impact</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {exceptions.map((ex) => (
                <tr key={ex.id} className="hover:bg-zinc-50">
                  <td className="px-5 py-3">
                    <Badge variant="severity" severity={ex.severity}>{ex.severity}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/exceptions/${ex.id}`} className="font-medium text-zinc-900 hover:underline">
                      {ex.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-zinc-500">{ex.controlRun.control.name}</td>
                  <td className="px-5 py-3 font-medium">{formatCurrency(Number(ex.financialImpact))}</td>
                  <td className="px-5 py-3">
                    <Badge variant="status" status={ex.status}>{ex.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-zinc-400">
                    {differenceInDays(new Date(), ex.detectedAt)}d
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {exceptions.length === 0 && (
            <p className="py-12 text-center text-sm text-zinc-400">No exceptions found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
