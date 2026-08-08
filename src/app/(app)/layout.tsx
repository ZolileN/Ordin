import { auth } from "@/lib/auth";
import { getActiveOrganization } from "@/lib/tenant";
import { AppLayout } from "@/components/layout/app-layout";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organization = await getActiveOrganization(session.user.id);
  if (!organization) redirect("/signup");

  return (
    <AppLayout organizationName={organization.name} userName={session.user.name}>
      {children}
    </AppLayout>
  );
}
