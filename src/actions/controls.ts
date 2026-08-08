"use server";

import { db } from "@/lib/db";
import { requireMembership } from "@/lib/tenant";
import { assertCanCreateControl } from "@/lib/subscription/subscription-service";
import { createAuditEvent } from "@/lib/audit/audit-service";
import { executeControlRun } from "@/lib/control-engine/engine";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function createControlAction(
  organizationId: string,
  data: {
    name: string;
    description?: string;
    templateId: string;
    ordersDatasetId?: string;
    invoicesDatasetId?: string;
    tolerance?: number;
  }
) {
  const { session } = await requireMembership(organizationId);
  await assertCanCreateControl(organizationId);

  const control = await db.control.create({
    data: {
      organizationId,
      name: data.name,
      description: data.description,
      category: "REVENUE",
      templateId: data.templateId as "REVENUE_ORDERS_TO_INVOICES",
      status: data.ordersDatasetId && data.invoicesDatasetId ? "ACTIVE" : "DRAFT",
      tolerance: data.tolerance ?? 0,
      ownerId: session.user.id,
      sources: {
        create: [
          ...(data.ordersDatasetId
            ? [{ role: "orders", datasetId: data.ordersDatasetId }]
            : []),
          ...(data.invoicesDatasetId
            ? [{ role: "invoices", datasetId: data.invoicesDatasetId }]
            : []),
        ],
      },
      rules: {
        create: [
          {
            name: "Missing Invoice",
            description: "Completed order with no matching invoice",
            condition: { type: "missing_invoice" },
            severity: "HIGH",
            order: 1,
          },
          {
            name: "Amount Mismatch",
            description: "Order and invoice amounts differ beyond tolerance",
            condition: { type: "amount_mismatch" },
            severity: "MEDIUM",
            order: 2,
          },
        ],
      },
    },
  });

  await createAuditEvent({
    organizationId,
    actorId: session.user.id,
    action: "CONTROL_CREATED",
    entity: "Control",
    entityId: control.id,
  });

  revalidatePath("/controls");
  return control;
}

export async function runControlAction(controlId: string, organizationId: string) {
  const { session } = await requireMembership(organizationId);
  const result = await executeControlRun(controlId, organizationId, session.user.id);
  revalidatePath("/controls");
  revalidatePath("/dashboard");
  revalidatePath("/exceptions");
  return result;
}

export async function updateControlAction(
  controlId: string,
  organizationId: string,
  data: { name?: string; description?: string; tolerance?: number; status?: string }
) {
  const { session } = await requireMembership(organizationId);

  const control = await db.control.update({
    where: { id: controlId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.tolerance !== undefined && { tolerance: data.tolerance }),
      ...(data.status && { status: data.status as "ACTIVE" | "PAUSED" | "DRAFT" }),
    },
  });

  await createAuditEvent({
    organizationId,
    actorId: session.user.id,
    action: "CONTROL_UPDATED",
    entity: "Control",
    entityId: controlId,
    metadata: data,
  });

  revalidatePath("/controls");
  return control;
}
