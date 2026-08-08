import { auth } from "@/lib/auth";
import { getActiveOrganization } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organization = await getActiveOrganization(session.user.id);
  if (!organization) redirect("/signup");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Reports</h1>
        <p className="text-sm text-zinc-500">Business integrity reports and exports</p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-zinc-500">Custom reporting available on Business plan.</p>
          <p className="mt-2 text-xs text-zinc-400">Use the dashboard and exception views for current insights.</p>
        </CardContent>
      </Card>
    </div>
  );
}
