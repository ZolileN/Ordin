import { PrismaClient } from "@prisma/client";
import { executeControlRun } from "../src/lib/control-engine/engine";

const prisma = new PrismaClient();

async function main() {
  const control = await prisma.control.findFirst({
    where: { status: "ACTIVE" },
    include: { organization: true },
  });

  if (!control) {
    console.log("No active control found");
    return;
  }

  console.log(`Running control: ${control.name} for ${control.organization.name}`);
  const result = await executeControlRun(control.id, control.organizationId);
  console.log("Metrics:", result.metrics);
  console.log(`Created ${result.exceptions.length} exceptions`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
