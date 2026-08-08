import { auth } from "@/lib/auth";
import { getActiveOrganization } from "@/lib/tenant";
import { CreateControlWizard } from "@/components/controls/create-control-wizard";
import { redirect } from "next/navigation";

export default async function NewControlPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organization = await getActiveOrganization(session.user.id);
  if (!organization) redirect("/signup");

  return <CreateControlWizard organizationId={organization.id} />;
}
