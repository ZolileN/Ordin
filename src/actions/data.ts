"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireMembership } from "@/lib/tenant";
import { assertCanAddDataSource } from "@/lib/subscription/subscription-service";
import { createAuditEvent } from "@/lib/audit/audit-service";
import { FileConnector, validateDataset } from "@/lib/connectors/file-connector";
import { uploadFile } from "@/lib/storage/storage";
import { revalidatePath } from "next/cache";

export async function createDataSourceAction(
  organizationId: string,
  data: { name: string; type: "FILE_CSV" | "FILE_XLSX" }
) {
  const { session } = await requireMembership(organizationId);
  await assertCanAddDataSource(organizationId);

  const dataSource = await db.dataSource.create({
    data: {
      organizationId,
      name: data.name,
      type: data.type,
      status: "ACTIVE",
    },
  });

  await createAuditEvent({
    organizationId,
    actorId: session.user.id,
    action: "DATA_SOURCE_CREATED",
    entity: "DataSource",
    entityId: dataSource.id,
  });

  revalidatePath("/data/sources");
  return dataSource;
}

export async function uploadDatasetAction(
  organizationId: string,
  formData: FormData
) {
  const { session } = await requireMembership(organizationId);

  const file = formData.get("file") as File;
  const dataSourceId = formData.get("dataSourceId") as string;
  const name = formData.get("name") as string;
  const mappingJson = formData.get("mapping") as string;

  if (!file || !dataSourceId) {
    return { error: "File and data source are required" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileKey = await uploadFile(organizationId, file.name, buffer, file.type);

  const connector = new FileConnector();
  await connector.connect({ type: "file", buffer, fileName: file.name });
  const result = await connector.fetchData();
  await connector.disconnect();

  const mapping = mappingJson ? JSON.parse(mappingJson) : {};
  const normalized = connector.normalize(result.rows, mapping);

  const requiredFields = Object.values(mapping) as string[];
  const validation = validateDataset(normalized, requiredFields.filter((f) =>
    ["external_id", "amount", "date"].includes(f)
  ));

  const dataset = await db.dataset.create({
    data: {
      organizationId,
      dataSourceId,
      name: name || file.name,
      fileName: file.name,
      fileKey,
      status: validation.valid ? "NORMALIZED" : "ERROR",
      rowCount: result.rows.length,
      columnMapping: mapping,
      metadata: { validationErrors: validation.errors },
      columns: {
        create: result.columns.map((col, index) => ({
          name: col,
          index,
          dataType: "string",
          sampleValues: result.rows.slice(0, 3).map((r) => r[col]) as Prisma.InputJsonValue,
        })),
      },
      records: {
        create: result.rows.map((row, index) => ({
          externalId: row[Object.keys(mapping).find((k) => mapping[k] === "external_id") ?? ""]?.toString() ?? null,
          rawData: row as Prisma.InputJsonValue,
          normalized: normalized[index] as Prisma.InputJsonValue,
        })),
      },
    },
    include: { columns: true },
  });

  await createAuditEvent({
    organizationId,
    actorId: session.user.id,
    action: "DATASET_UPLOADED",
    entity: "Dataset",
    entityId: dataset.id,
    metadata: { fileName: file.name, rowCount: result.rows.length },
  });

  revalidatePath("/data/datasets");
  return { dataset, validation };
}

export async function previewFileAction(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const connector = new FileConnector();
  await connector.connect({ type: "file", buffer, fileName: file.name });
  const result = await connector.fetchData();
  await connector.disconnect();

  return {
    columns: result.columns,
    preview: result.rows.slice(0, 10),
    totalRows: result.rows.length,
  };
}
