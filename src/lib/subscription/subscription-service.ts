import { db } from "@/lib/db";
import { PLAN_LIMITS, type PlanLimitKey } from "@/lib/constants";
import type { SubscriptionPlan } from "@prisma/client";

export class SubscriptionLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubscriptionLimitError";
  }
}

async function getOrganizationPlan(organizationId: string): Promise<SubscriptionPlan> {
  const subscription = await db.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });
  return subscription?.plan.name ?? "STARTER";
}

function getLimit(plan: SubscriptionPlan, key: PlanLimitKey): number | boolean {
  return PLAN_LIMITS[plan][key];
}

export async function canCreateControl(organizationId: string): Promise<boolean> {
  const plan = await getOrganizationPlan(organizationId);
  const max = getLimit(plan, "maxControls") as number;
  const count = await db.control.count({
    where: { organizationId, status: { not: "ARCHIVED" } },
  });
  return count < max;
}

export async function canAddDataSource(organizationId: string): Promise<boolean> {
  const plan = await getOrganizationPlan(organizationId);
  const max = getLimit(plan, "maxDataSources") as number;
  const count = await db.dataSource.count({ where: { organizationId } });
  return count < max;
}

export async function canAddEntity(organizationId: string): Promise<boolean> {
  const plan = await getOrganizationPlan(organizationId);
  const max = getLimit(plan, "maxEntities") as number;
  const count = await db.entity.count({ where: { organizationId } });
  return count < max;
}

export async function canAddBranch(organizationId: string): Promise<boolean> {
  const plan = await getOrganizationPlan(organizationId);
  const max = getLimit(plan, "maxBranches") as number;
  if (max === 0) return false;
  const entities = await db.entity.findMany({
    where: { organizationId },
    include: { _count: { select: { branches: true } } },
  });
  const totalBranches = entities.reduce((sum, e) => sum + e._count.branches, 0);
  return totalBranches < max;
}

export async function canAddUser(organizationId: string): Promise<boolean> {
  const plan = await getOrganizationPlan(organizationId);
  const max = getLimit(plan, "maxUsers") as number;
  const count = await db.membership.count({ where: { organizationId } });
  return count < max;
}

export async function hasFeature(
  organizationId: string,
  feature: PlanLimitKey
): Promise<boolean> {
  const plan = await getOrganizationPlan(organizationId);
  const value = getLimit(plan, feature);
  return typeof value === "boolean" ? value : true;
}

export async function assertCanCreateControl(organizationId: string): Promise<void> {
  if (!(await canCreateControl(organizationId))) {
    throw new SubscriptionLimitError(
      "Control limit reached for your subscription plan. Upgrade to add more controls."
    );
  }
}

export async function assertCanAddDataSource(organizationId: string): Promise<void> {
  if (!(await canAddDataSource(organizationId))) {
    throw new SubscriptionLimitError(
      "Data source limit reached for your subscription plan."
    );
  }
}

export async function getSubscriptionSummary(organizationId: string) {
  const subscription = await db.subscription.findUnique({
    where: { organizationId },
    include: { plan: { include: { features: true } } },
  });

  if (!subscription) return null;

  const [controls, dataSources, entities, users] = await Promise.all([
    db.control.count({ where: { organizationId, status: { not: "ARCHIVED" } } }),
    db.dataSource.count({ where: { organizationId } }),
    db.entity.count({ where: { organizationId } }),
    db.membership.count({ where: { organizationId } }),
  ]);

  const plan = subscription.plan.name;
  const limits = PLAN_LIMITS[plan];

  return {
    plan: subscription.plan,
    status: subscription.status,
    usage: { controls, dataSources, entities, users },
    limits,
    currentPeriodEnd: subscription.currentPeriodEnd,
  };
}
