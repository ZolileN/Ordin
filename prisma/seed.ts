import { PrismaClient, SubscriptionPlan } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PLAN_FEATURES = {
  STARTER: {
    maxControls: "1",
    maxDataSources: "2",
    maxEntities: "1",
    maxBranches: "0",
    maxUsers: "1",
  },
  GROWTH: {
    maxControls: "5",
    maxDataSources: "10",
    maxEntities: "3",
    maxBranches: "5",
    maxUsers: "10",
    exceptionAssignment: "true",
    comments: "true",
    evidence: "true",
  },
  BUSINESS: {
    maxControls: "100",
    maxDataSources: "100",
    maxEntities: "50",
    maxBranches: "200",
    maxUsers: "100",
    exceptionAssignment: "true",
    comments: "true",
    evidence: "true",
    apiAccess: "true",
    webhooks: "true",
  },
};

const CUSTOMERS = [
  "ABC Construction", "Metro Plumbing", "Sunrise Electrical", "Coastal HVAC",
  "Premier Roofing", "Delta Landscaping", "Urban Painting", "Peak Security",
  "Green Gardens", "Swift Logistics", "Nova IT Services", "Crystal Cleaning",
  "Iron Works Ltd", "Bright Spark Electric", "Flow Plumbing Co",
];

function randomAmount(): number {
  return Math.round((Math.random() * 50000 + 500) / 100) * 100;
}

function randomDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d.toISOString().split("T")[0];
}

async function main() {
  console.log("Seeding Ordin database...");

  for (const planName of ["STARTER", "GROWTH", "BUSINESS"] as SubscriptionPlan[]) {
    const existing = await prisma.plan.findUnique({ where: { name: planName } });
    if (!existing) {
      const prices = { STARTER: [500, 1500], GROWTH: [2000, 5000], BUSINESS: [5000, 15000] };
      const plan = await prisma.plan.create({
        data: {
          name: planName,
          displayName: planName.charAt(0) + planName.slice(1).toLowerCase(),
          minPriceZar: prices[planName][0],
          maxPriceZar: prices[planName][1],
          description: `${planName} plan for Ordin`,
          features: {
            create: Object.entries(PLAN_FEATURES[planName]).map(([key, value]) => ({
              key,
              value,
            })),
          },
        },
      });
      console.log(`Created plan: ${plan.displayName}`);
    }
  }

  const growthPlan = await prisma.plan.findUnique({ where: { name: "GROWTH" } });
  if (!growthPlan) throw new Error("Growth plan not found");

  const passwordHash = await bcrypt.hash("demo1234", 12);

  const existingUser = await prisma.user.findUnique({ where: { email: "demo@acme.services" } });
  if (existingUser) {
    console.log("Demo data already exists, skipping...");
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: "Demo User",
      email: "demo@acme.services",
      passwordHash,
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: "Acme Services",
      slug: "acme-services",
      subscription: {
        create: {
          planId: growthPlan.id,
          status: "ACTIVE",
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      memberships: {
        create: { userId: user.id, role: "OWNER" },
      },
      entities: {
        create: { name: "Acme Services (Pty) Ltd" },
      },
    },
    include: { entities: true },
  });

  const ordersSource = await prisma.dataSource.create({
    data: {
      organizationId: org.id,
      name: "Orders Export",
      type: "FILE_CSV",
      status: "ACTIVE",
    },
  });

  const invoicesSource = await prisma.dataSource.create({
    data: {
      organizationId: org.id,
      name: "Invoices Export",
      type: "FILE_CSV",
      status: "ACTIVE",
    },
  });

  const TOTAL_ORDERS = 1000;
  const orders: Array<{
    external_id: string;
    customer: string;
    date: string;
    status: string;
    amount: number;
  }> = [];

  for (let i = 1; i <= TOTAL_ORDERS; i++) {
    orders.push({
      external_id: `ORD-${String(i).padStart(5, "0")}`,
      customer: CUSTOMERS[i % CUSTOMERS.length],
      date: randomDate(90),
      status: i <= 950 ? "completed" : "pending",
      amount: randomAmount(),
    });
  }

  const invoices: Array<{
    external_id: string;
    customer: string;
    date: string;
    reference: string;
    amount: number;
  }> = [];

  const anomalyIndices = new Set<number>();

  for (let i = 1; i <= 950; i++) {
    const order = orders[i - 1];
    let amount = order.amount;

    if (i % 47 === 0) {
      anomalyIndices.add(i);
      continue;
    }

    if (i % 31 === 0) {
      amount = Math.round(order.amount * 0.6);
      anomalyIndices.add(i);
    } else if (i % 23 === 0) {
      amount = order.amount + randomAmount() * 0.1;
      anomalyIndices.add(i);
    } else if (i % 19 === 0) {
      invoices.push({
        external_id: `INV-${String(i).padStart(5, "0")}-A`,
        customer: order.customer,
        date: randomDate(60),
        reference: order.external_id,
        amount: order.amount,
      });
      invoices.push({
        external_id: `INV-${String(i).padStart(5, "0")}-B`,
        customer: order.customer,
        date: randomDate(60),
        reference: order.external_id,
        amount: order.amount,
      });
      anomalyIndices.add(i);
      continue;
    }

    invoices.push({
      external_id: `INV-${String(i).padStart(5, "0")}`,
      customer: order.customer,
      date: randomDate(60),
      reference: order.external_id,
      amount,
    });
  }

  for (let i = 951; i <= 970; i++) {
    invoices.push({
      external_id: `INV-UNMATCHED-${i}`,
      customer: CUSTOMERS[i % CUSTOMERS.length],
      date: randomDate(30),
      reference: `ORD-FAKE-${i}`,
      amount: randomAmount(),
    });
  }

  const ordersDataset = await prisma.dataset.create({
    data: {
      organizationId: org.id,
      dataSourceId: ordersSource.id,
      name: "Orders Q3 2026",
      fileName: "orders.csv",
      status: "NORMALIZED",
      rowCount: orders.length,
      columnMapping: {
        order_id: "external_id",
        customer: "customer",
        order_date: "date",
        status: "status",
        amount: "amount",
      },
      columns: {
        create: [
          { name: "order_id", index: 0, dataType: "string" },
          { name: "customer", index: 1, dataType: "string" },
          { name: "order_date", index: 2, dataType: "date" },
          { name: "status", index: 3, dataType: "string" },
          { name: "amount", index: 4, dataType: "number" },
        ],
      },
    },
  });

  const invoicesDataset = await prisma.dataset.create({
    data: {
      organizationId: org.id,
      dataSourceId: invoicesSource.id,
      name: "Invoices Q3 2026",
      fileName: "invoices.csv",
      status: "NORMALIZED",
      rowCount: invoices.length,
      columnMapping: {
        invoice_id: "external_id",
        customer: "customer",
        invoice_date: "date",
        order_reference: "reference",
        amount: "amount",
      },
      columns: {
        create: [
          { name: "invoice_id", index: 0, dataType: "string" },
          { name: "customer", index: 1, dataType: "string" },
          { name: "invoice_date", index: 2, dataType: "date" },
          { name: "order_reference", index: 3, dataType: "string" },
          { name: "amount", index: 4, dataType: "number" },
        ],
      },
    },
  });

  const BATCH = 100;
  for (let i = 0; i < orders.length; i += BATCH) {
    await prisma.datasetRecord.createMany({
      data: orders.slice(i, i + BATCH).map((o) => ({
        datasetId: ordersDataset.id,
        externalId: o.external_id,
        rawData: o,
        normalized: o,
      })),
    });
  }

  for (let i = 0; i < invoices.length; i += BATCH) {
    await prisma.datasetRecord.createMany({
      data: invoices.slice(i, i + BATCH).map((inv) => ({
        datasetId: invoicesDataset.id,
        externalId: inv.external_id,
        rawData: inv,
        normalized: inv,
      })),
    });
  }

  const control = await prisma.control.create({
    data: {
      organizationId: org.id,
      name: "Completed Orders → Invoices",
      description: "Revenue integrity control for Acme Services",
      category: "REVENUE",
      templateId: "REVENUE_ORDERS_TO_INVOICES",
      status: "ACTIVE",
      tolerance: 0,
      ownerId: user.id,
      sources: {
        create: [
          { role: "orders", datasetId: ordersDataset.id, dataSourceId: ordersSource.id },
          { role: "invoices", datasetId: invoicesDataset.id, dataSourceId: invoicesSource.id },
        ],
      },
      rules: {
        create: [
          { name: "Missing Invoice", condition: { type: "missing_invoice" }, severity: "HIGH", order: 1 },
          { name: "Amount Mismatch", condition: { type: "amount_mismatch" }, severity: "MEDIUM", order: 2 },
        ],
      },
    },
  });

  console.log(`Created organization: ${org.name}`);
  console.log(`Created ${orders.length} orders and ${invoices.length} invoices`);
  console.log(`Created control: ${control.name}`);
  console.log(`Demo login: demo@acme.services / demo1234`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
