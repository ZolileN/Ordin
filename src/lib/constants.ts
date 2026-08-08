import type { MembershipRole } from "@prisma/client";

export const PLAN_LIMITS = {
  STARTER: {
    maxControls: 1,
    maxDataSources: 2,
    maxEntities: 1,
    maxBranches: 0,
    maxUsers: 1,
    csvIngestion: true,
    automatedIngestion: false,
    exceptionAssignment: false,
    comments: false,
    evidence: false,
    advancedMatching: false,
    customRules: false,
    apiAccess: false,
    webhooks: false,
    approvalWorkflows: false,
  },
  GROWTH: {
    maxControls: 5,
    maxDataSources: 10,
    maxEntities: 3,
    maxBranches: 5,
    maxUsers: 10,
    csvIngestion: true,
    automatedIngestion: true,
    exceptionAssignment: true,
    comments: true,
    evidence: true,
    advancedMatching: true,
    customRules: true,
    apiAccess: false,
    webhooks: false,
    approvalWorkflows: false,
  },
  BUSINESS: {
    maxControls: 100,
    maxDataSources: 100,
    maxEntities: 50,
    maxBranches: 200,
    maxUsers: 100,
    csvIngestion: true,
    automatedIngestion: true,
    exceptionAssignment: true,
    comments: true,
    evidence: true,
    advancedMatching: true,
    customRules: true,
    apiAccess: true,
    webhooks: true,
    approvalWorkflows: true,
  },
} as const;

export type PlanLimitKey = keyof (typeof PLAN_LIMITS)["STARTER"];

export const ROLE_HIERARCHY: Record<MembershipRole, number> = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export function hasRole(userRole: MembershipRole, requiredRole: MembershipRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export const CANONICAL_FIELDS = [
  "external_id",
  "entity_id",
  "customer",
  "supplier",
  "reference",
  "date",
  "status",
  "amount",
  "quantity",
  "product",
  "branch",
  "currency",
] as const;

export type CanonicalField = (typeof CANONICAL_FIELDS)[number];

export const CONTROL_TEMPLATES = [
  {
    id: "REVENUE_ORDERS_TO_INVOICES" as const,
    name: "Completed Orders → Invoices",
    category: "REVENUE" as const,
    description: "Identify completed orders that were not correctly invoiced.",
    available: true,
    requiredSources: ["orders", "invoices"],
  },
  {
    id: "INVOICES_TO_PAYMENTS" as const,
    name: "Invoices → Payments",
    category: "REVENUE" as const,
    description: "Reconcile issued invoices against received payments.",
    available: false,
    requiredSources: ["invoices", "payments"],
  },
  {
    id: "PO_TO_SUPPLIER_INVOICE" as const,
    name: "PO → Supplier Invoice",
    category: "PAYABLES" as const,
    description: "Match purchase orders to supplier invoices.",
    available: false,
    requiredSources: ["purchase_orders", "supplier_invoices"],
  },
  {
    id: "POS_TO_INVENTORY" as const,
    name: "POS → Inventory",
    category: "INVENTORY" as const,
    description: "Verify POS sales against inventory movements.",
    available: false,
    requiredSources: ["pos_sales", "inventory"],
  },
  {
    id: "BANK_TO_ACCOUNTING" as const,
    name: "Bank → Accounting",
    category: "BANKING" as const,
    description: "Reconcile bank transactions with accounting entries.",
    available: false,
    requiredSources: ["bank", "accounting"],
  },
  {
    id: "TIMESHEETS_TO_PAYROLL" as const,
    name: "Timesheets → Payroll",
    category: "PAYROLL" as const,
    description: "Match timesheet hours to payroll records.",
    available: false,
    requiredSources: ["timesheets", "payroll"],
  },
];
