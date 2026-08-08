import { auth } from "@/lib/auth";
import { getActiveOrganization } from "@/lib/tenant";
import { getAuditEvents } from "@/lib/audit/audit-service";
import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function AuditLogPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organization = await getActiveOrganization(session.user.id);
  if (!organization) redirect("/signup");

  const events = await getAuditEvents(organization.id, { limit: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Audit Log</h1>
        <p className="text-sm text-zinc-500">Complete audit trail for {organization.name}</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-zinc-500">
                <th className="px-5 py-3 font-medium">Timestamp</th>
                <th className="px-5 py-3 font-medium">Actor</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-zinc-50">
                  <td className="px-5 py-3 text-zinc-400">{new Date(e.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-3">{e.actor?.name ?? e.actor?.email ?? "System"}</td>
                  <td className="px-5 py-3 font-medium">{e.action}</td>
                  <td className="px-5 py-3 text-zinc-500">{e.entity}{e.entityId ? ` (${e.entityId.slice(0, 8)}...)` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {events.length === 0 && <p className="py-12 text-center text-sm text-zinc-400">No audit events yet</p>}
        </CardContent>
      </Card>
    </div>
  );
}
