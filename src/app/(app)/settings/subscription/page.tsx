import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveOrganization } from "@/lib/tenant";
import { getSubscriptionSummary } from "@/lib/subscription/subscription-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

export default async function SubscriptionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organization = await getActiveOrganization(session.user.id);
  if (!organization) redirect("/signup");

  const summary = await getSubscriptionSummary(organization.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Subscription</h1>
        <p className="text-sm text-zinc-500">Plan and usage for {organization.name}</p>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Current Plan</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{summary.plan.displayName}</p>
              <p className="text-sm text-zinc-500">
                {formatCurrency(summary.plan.minPriceZar)} – {formatCurrency(summary.plan.maxPriceZar)}/month
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                Renews {new Date(summary.currentPeriodEnd).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Usage</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { label: "Controls", used: summary.usage.controls, max: summary.limits.maxControls },
                { label: "Data Sources", used: summary.usage.dataSources, max: summary.limits.maxDataSources },
                { label: "Entities", used: summary.usage.entities, max: summary.limits.maxEntities },
                { label: "Users", used: summary.usage.users, max: summary.limits.maxUsers },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-zinc-500">{item.label}</span>
                  <span>{item.used} / {item.max}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
