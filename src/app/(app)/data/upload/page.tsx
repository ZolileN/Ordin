import { auth } from "@/lib/auth";
import { getActiveOrganization } from "@/lib/tenant";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organization = await getActiveOrganization(session.user.id);
  if (!organization) redirect("/signup");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Upload Data</h1>
        <p className="text-sm text-zinc-500">Upload CSV or XLSX files for control execution</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center py-16">
          <p className="text-sm text-zinc-500 mb-4">
            To upload data, create a control with the guided setup wizard.
          </p>
          <Button asChild>
            <Link href="/controls/new">Create Control with Upload</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
