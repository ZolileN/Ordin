import { Prisma } from "@prisma/client";
import type { AuditAction } from "@prisma/client";
import { db } from "@/lib/db";

interface AuditEventInput {
  organizationId: string;
  actorId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function createAuditEvent(input: AuditEventInput) {
  return db.auditEvent.create({
    data: {
      organizationId: input.organizationId,
      actorId: input.actorId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function getAuditEvents(
  organizationId: string,
  options?: { limit?: number; offset?: number }
) {
  return db.auditEvent.findMany({
    where: { organizationId },
    include: {
      actor: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  });
}
