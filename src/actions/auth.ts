"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { createAuditEvent } from "@/lib/audit/audit-service";
import { AuthError } from "next-auth";
import { z } from "zod";

const signUpSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  organizationName: z.string().min(1),
  plan: z.enum(["STARTER", "GROWTH", "BUSINESS"]).default("STARTER"),
});

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    organizationName: formData.get("organizationName"),
    plan: formData.get("plan") ?? "STARTER",
  });

  if (!parsed.success) {
    return { error: "Invalid form data" };
  }

  const { name, email, password, organizationName, plan } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "Email already registered" };

  const passwordHash = await bcrypt.hash(password, 12);
  const slug = slugify(organizationName) + "-" + Date.now().toString(36);

  const planRecord = await db.plan.findUnique({ where: { name: plan } });
  if (!planRecord) return { error: "Invalid plan" };

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      memberships: {
        create: {
          role: "OWNER",
          organization: {
            create: {
              name: organizationName,
              slug,
              subscription: {
                create: {
                  planId: planRecord.id,
                  status: "ACTIVE",
                  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
              },
              entities: {
                create: { name: organizationName },
              },
            },
          },
        },
      },
    },
    include: { memberships: { include: { organization: true } } },
  });

  await createAuditEvent({
    organizationId: user.memberships[0].organizationId,
    actorId: user.id,
    action: "ORGANIZATION_UPDATED",
    entity: "Organization",
    entityId: user.memberships[0].organizationId,
    metadata: { action: "created", plan },
  });

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Account created but sign in failed" };
    throw error;
  }

  return { success: true };
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", { email, password, redirect: false });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password" };
    throw error;
  }
}
