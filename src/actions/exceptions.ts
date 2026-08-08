"use server";

import { db } from "@/lib/db";
import { requireMembership } from "@/lib/tenant";
import { hasFeature } from "@/lib/subscription/subscription-service";
import { createAuditEvent } from "@/lib/audit/audit-service";
import { uploadFile } from "@/lib/storage/storage";
import { revalidatePath } from "next/cache";
import type { ExceptionStatus } from "@prisma/client";

export async function updateExceptionStatusAction(
  exceptionId: string,
  organizationId: string,
  status: ExceptionStatus
) {
  const { session } = await requireMembership(organizationId);

  const exception = await db.exception.update({
    where: { id: exceptionId },
    data: {
      status,
      ...(status === "RESOLVED" || status === "CLOSED" ? { resolvedAt: new Date() } : {}),
    },
  });

  await createAuditEvent({
    organizationId,
    actorId: session.user.id,
    action: "EXCEPTION_STATUS_CHANGED",
    entity: "Exception",
    entityId: exceptionId,
    metadata: { status },
  });

  revalidatePath(`/exceptions/${exceptionId}`);
  revalidatePath("/exceptions");
  revalidatePath("/dashboard");
  return exception;
}

export async function assignExceptionAction(
  exceptionId: string,
  organizationId: string,
  assigneeId: string
) {
  const { session } = await requireMembership(organizationId);

  const canAssign = await hasFeature(organizationId, "exceptionAssignment");
  if (!canAssign) {
    return { error: "Exception assignment requires Growth plan or higher" };
  }

  const exception = await db.exception.update({
    where: { id: exceptionId },
    data: { assignedToId: assigneeId, status: "ASSIGNED" },
  });

  await db.notification.create({
    data: {
      organizationId,
      userId: assigneeId,
      type: "EXCEPTION_ASSIGNED",
      title: "Exception assigned to you",
      message: exception.title,
      metadata: { exceptionId },
    },
  });

  await createAuditEvent({
    organizationId,
    actorId: session.user.id,
    action: "EXCEPTION_ASSIGNED",
    entity: "Exception",
    entityId: exceptionId,
    metadata: { assigneeId },
  });

  revalidatePath(`/exceptions/${exceptionId}`);
  return exception;
}

export async function addCommentAction(
  exceptionId: string,
  organizationId: string,
  content: string
) {
  const { session } = await requireMembership(organizationId);

  const canComment = await hasFeature(organizationId, "comments");
  if (!canComment) {
    return { error: "Comments require Growth plan or higher" };
  }

  const comment = await db.exceptionComment.create({
    data: {
      exceptionId,
      userId: session.user.id,
      content,
    },
    include: { user: { select: { name: true, email: true } } },
  });

  await createAuditEvent({
    organizationId,
    actorId: session.user.id,
    action: "COMMENT_ADDED",
    entity: "Exception",
    entityId: exceptionId,
  });

  revalidatePath(`/exceptions/${exceptionId}`);
  return comment;
}

export async function resolveExceptionAction(
  exceptionId: string,
  organizationId: string,
  summary: string,
  details?: string
) {
  const { session } = await requireMembership(organizationId);

  const resolution = await db.resolution.create({
    data: {
      exceptionId,
      userId: session.user.id,
      status: "APPROVED",
      summary,
      details,
    },
  });

  await db.exception.update({
    where: { id: exceptionId },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });

  await createAuditEvent({
    organizationId,
    actorId: session.user.id,
    action: "EXCEPTION_RESOLVED",
    entity: "Exception",
    entityId: exceptionId,
    metadata: { summary },
  });

  revalidatePath(`/exceptions/${exceptionId}`);
  revalidatePath("/exceptions");
  revalidatePath("/dashboard");
  return resolution;
}

export async function attachEvidenceAction(
  exceptionId: string,
  organizationId: string,
  formData: FormData
) {
  const { session } = await requireMembership(organizationId);

  const canAttach = await hasFeature(organizationId, "evidence");
  if (!canAttach) {
    return { error: "Evidence attachments require Growth plan or higher" };
  }

  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileKey = await uploadFile(organizationId, file.name, buffer, file.type);

  const evidence = await db.exceptionEvidence.create({
    data: {
      exceptionId,
      userId: session.user.id,
      fileName: file.name,
      fileKey,
      fileSize: file.size,
      mimeType: file.type,
    },
  });

  await createAuditEvent({
    organizationId,
    actorId: session.user.id,
    action: "EVIDENCE_ADDED",
    entity: "Exception",
    entityId: exceptionId,
    metadata: { fileName: file.name },
  });

  revalidatePath(`/exceptions/${exceptionId}`);
  return evidence;
}
