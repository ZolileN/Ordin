import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { runRevenueIntegrityControl } from "./revenue-integrity";
import type { NormalizedRecord } from "./types";
import { createAuditEvent } from "@/lib/audit/audit-service";
import { Decimal } from "@prisma/client/runtime/library";

export async function executeControlRun(
  controlId: string,
  organizationId: string,
  actorId?: string
) {
  const control = await db.control.findFirst({
    where: { id: controlId, organizationId },
    include: {
      sources: { include: { dataset: { include: { records: true } } } },
    },
  });

  if (!control) throw new Error("Control not found");

  const run = await db.controlRun.create({
    data: {
      organizationId,
      controlId,
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    const ordersSource = control.sources.find((s) => s.role === "orders");
    const invoicesSource = control.sources.find((s) => s.role === "invoices");

    if (!ordersSource?.dataset || !invoicesSource?.dataset) {
      throw new Error("Control requires both orders and invoices datasets");
    }

    const orders: NormalizedRecord[] = ordersSource.dataset.records.map(
      (r) => r.normalized as NormalizedRecord
    );
    const invoices: NormalizedRecord[] = invoicesSource.dataset.records.map(
      (r) => r.normalized as NormalizedRecord
    );

    const tolerance = Number(control.tolerance);
    const result = runRevenueIntegrityControl(orders, invoices, { tolerance });

    await db.match.createMany({
      data: result.matches.map((m) => ({
        controlRunId: run.id,
        status: m.status,
        sourceRecord: m.sourceRecord as Prisma.InputJsonValue,
        targetRecord: (m.targetRecord ?? undefined) as Prisma.InputJsonValue | undefined,
        variance: m.variance ?? null,
        metadata: (m.metadata ?? {}) as Prisma.InputJsonValue,
      })),
    });

    await db.exception.createMany({
      data: result.exceptions.map((e) => ({
        organizationId,
        controlRunId: run.id,
        type: e.type,
        title: e.title,
        description: e.description,
        severity: e.severity,
        status: "OPEN" as const,
        financialImpact: e.financialImpact,
        expectedAmount: e.expectedAmount ?? null,
        actualAmount: e.actualAmount ?? null,
        variance: e.variance ?? null,
        sourceRecords: e.sourceRecords as Prisma.InputJsonValue,
      })),
    });

    const updatedRun = await db.controlRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        metrics: result.metrics as unknown as Prisma.InputJsonValue,
      },
    });

    await createAuditEvent({
      organizationId,
      actorId,
      action: "CONTROL_EXECUTED",
      entity: "ControlRun",
      entityId: run.id,
      metadata: { controlId, metrics: result.metrics },
    });

    return { run: updatedRun, ...result };
  } catch (error) {
    await db.controlRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}

export async function getControlRunResults(controlRunId: string, organizationId: string) {
  const run = await db.controlRun.findFirst({
    where: { id: controlRunId, organizationId },
    include: {
      control: true,
      matches: { orderBy: { createdAt: "asc" } },
      exceptions: {
        orderBy: [{ severity: "desc" }, { financialImpact: "desc" }],
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  return run;
}

export async function getLatestControlRun(controlId: string, organizationId: string) {
  return db.controlRun.findFirst({
    where: { controlId, organizationId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    include: {
      matches: true,
      exceptions: true,
    },
  });
}
