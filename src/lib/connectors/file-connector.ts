import * as XLSX from "xlsx";
import Papa from "papaparse";
import type { Connector, ConnectorConfig, ConnectorResult } from "./types";
import { parseAmount, parseDate } from "@/lib/utils";

export class FileConnector implements Connector {
  private buffer: Buffer | null = null;
  private fileName = "";
  private fileType: "csv" | "xlsx" = "csv";

  async connect(config: ConnectorConfig): Promise<void> {
    if (!config.buffer || !config.fileName) {
      throw new Error("File buffer and fileName are required");
    }
    this.buffer = config.buffer as Buffer;
    this.fileName = config.fileName as string;
    const ext = this.fileName.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      this.fileType = "xlsx";
    } else if (ext === "csv") {
      this.fileType = "csv";
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.fetchData();
      return result.columns.length > 0;
    } catch {
      return false;
    }
  }

  async fetchData(): Promise<ConnectorResult> {
    if (!this.buffer) throw new Error("Not connected");

    if (this.fileType === "xlsx") {
      const workbook = XLSX.read(this.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });
      const columns = json.length > 0 ? Object.keys(json[0]) : [];
      return { columns, rows: json, metadata: { sheetName } };
    }

    const text = this.buffer.toString("utf-8");
    const parsed = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    if (parsed.errors.length > 0) {
      throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
    }

    const columns = parsed.meta.fields ?? [];
    return { columns, rows: parsed.data };
  }

  normalize(
    rows: Record<string, unknown>[],
    mapping: Record<string, string>
  ): Record<string, unknown>[] {
    return rows.map((row) => {
      const normalized: Record<string, unknown> = {};
      for (const [sourceCol, canonicalField] of Object.entries(mapping)) {
        const value = row[sourceCol];
        if (canonicalField === "amount") {
          normalized[canonicalField] = parseAmount(value);
        } else if (canonicalField === "date") {
          normalized[canonicalField] = parseDate(value)?.toISOString() ?? null;
        } else if (canonicalField === "quantity") {
          const qty = parseAmount(value);
          normalized[canonicalField] = qty !== null ? Math.round(qty) : null;
        } else {
          normalized[canonicalField] = value !== undefined && value !== "" ? String(value).trim() : null;
        }
      }
      return normalized;
    });
  }

  async disconnect(): Promise<void> {
    this.buffer = null;
    this.fileName = "";
  }
}

export function validateDataset(
  rows: Record<string, unknown>[],
  requiredFields: string[]
): { valid: boolean; errors: { row: number; field?: string; message: string }[] } {
  const errors: { row: number; field?: string; message: string }[] = [];
  const seenIds = new Set<string>();

  if (rows.length === 0) {
    errors.push({ row: 0, message: "Dataset is empty" });
    return { valid: false, errors };
  }

  rows.forEach((row, index) => {
    const rowNum = index + 2; // account for header

    for (const field of requiredFields) {
      const value = row[field];
      if (value === null || value === undefined || value === "") {
        errors.push({ row: rowNum, field, message: `Missing required field: ${field}` });
      }
    }

    if (row.amount !== null && row.amount !== undefined) {
      const amount = typeof row.amount === "number" ? row.amount : parseFloat(String(row.amount));
      if (isNaN(amount)) {
        errors.push({ row: rowNum, field: "amount", message: "Invalid amount" });
      }
    }

    if (row.date) {
      const date = new Date(String(row.date));
      if (isNaN(date.getTime())) {
        errors.push({ row: rowNum, field: "date", message: "Invalid date" });
      }
    }

    const id = row.external_id ? String(row.external_id) : null;
    if (id) {
      if (seenIds.has(id)) {
        errors.push({ row: rowNum, field: "external_id", message: `Duplicate ID: ${id}` });
      }
      seenIds.add(id);
    }
  });

  return { valid: errors.length === 0, errors };
}
