import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveOrganization } from "@/lib/tenant";
import { hasFeature } from "@/lib/subscription/subscription-service";
import { ExceptionDetailClient } from "@/components/exceptions/exception-detail-client";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";

export default async function ExceptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organization = await getActiveOrganization(session.user.id);
  if (!organization) redirect("/signup");

  const exception = await db.exception.findFirst({
    where: { id, organizationId: organization.id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      comments: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      evidence: true,
      controlRun: { include: { control: { select: { name: true } } } },
    },
  });

  if (!exception) notFound();

  const members = await db.membership.findMany({
    where: { organizationId: organization.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const [canAssign, canComment, canAttachEvidence] = await Promise.all([
    hasFeature(organization.id, "exceptionAssignment"),
    hasFeature(organization.id, "comments"),
    hasFeature(organization.id, "evidence"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-zinc-500">
          <Link href="/exceptions" className="hover:underline">Exceptions</Link> / {exception.title}
        </p>
      </div>
      <ExceptionDetailClient
        exception={{
          ...exception,
          financialImpact: Number(exception.financialImpact),
          expectedAmount: exception.expectedAmount ? Number(exception.expectedAmount) : null,
          actualAmount: exception.actualAmount ? Number(exception.actualAmount) : null,
          variance: exception.variance ? Number(exception.variance) : null,
          detectedAt: exception.detectedAt.toISOString(),
          comments: exception.comments.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
          })),
          evidence: exception.evidence.map((e) => ({
            ...e,
            createdAt: e.createdAt.toISOString(),
          })),
        }}
        organizationId={organization.id}
        userId={session.user.id}
        members={members.map((m) => m.user)}
        canAssign={canAssign}
        canComment={canComment}
        canAttachEvidence={canAttachEvidence}
      />
    </div>
  );
}
