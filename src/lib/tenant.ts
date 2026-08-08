import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasRole } from "@/lib/constants";
import type { MembershipRole } from "@prisma/client";
import { redirect } from "next/navigation";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function getSession() {
  return auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}

export async function getMembership(userId: string, organizationId: string) {
  return db.membership.findUnique({
    where: {
      userId_organizationId: { userId, organizationId },
    },
  });
}

export async function requireMembership(organizationId: string) {
  const session = await requireAuth();
  const membership = await getMembership(session.user.id, organizationId);
  if (!membership) {
    throw new ForbiddenError("You do not have access to this organization.");
  }
  return { session, membership };
}

export async function requireRole(organizationId: string, role: MembershipRole) {
  const { session, membership } = await requireMembership(organizationId);
  if (!hasRole(membership.role, role)) {
    throw new ForbiddenError(`Requires ${role} role or higher.`);
  }
  return { session, membership };
}

export async function getUserOrganizations(userId: string) {
  return db.membership.findMany({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getActiveOrganization(userId: string) {
  const memberships = await getUserOrganizations(userId);
  if (memberships.length === 0) return null;
  return memberships[0].organization;
}

export function scopeToOrganization<T extends { organizationId: string }>(
  organizationId: string
) {
  return { organizationId } as Pick<T, "organizationId">;
}
