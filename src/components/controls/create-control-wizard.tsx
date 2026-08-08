"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CANONICAL_FIELDS } from "@/lib/constants";
import { createControlAction } from "@/actions/controls";
import { previewFileAction, uploadDatasetAction, createDataSourceAction } from "@/actions/data";
import { toast } from "sonner";

interface CreateControlPageProps {
  organizationId: string;
}

export function CreateControlWizard({ organizationId }: CreateControlPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const template = searchParams.get("template") ?? "REVENUE_ORDERS_TO_INVOICES";

  const [step, setStep] = useState(1);
  const [name, setName] = useState("Completed Orders → Invoices");
  const [ordersFile, setOrdersFile] = useState<File | null>(null);
  const [invoicesFile, setInvoicesFile] = useState<File | null>(null);
  const [ordersPreview, setOrdersPreview] = useState<{ columns: string[]; preview: Record<string, unknown>[] } | null>(null);
  const [invoicesPreview, setInvoicesPreview] = useState<{ columns: string[]; preview: Record<string, unknown>[] } | null>(null);
  const [ordersMapping, setOrdersMapping] = useState<Record<string, string>>({});
  const [invoicesMapping, setInvoicesMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const ordersDefaults: Record<string, string> = {
    order_id: "external_id",
    customer: "customer",
    order_date: "date",
    status: "status",
    amount: "amount",
  };

  const invoicesDefaults: Record<string, string> = {
    invoice_id: "external_id",
    customer: "customer",
    invoice_date: "date",
    order_reference: "reference",
    amount: "amount",
  };

  async function handleOrdersUpload(file: File) {
    setOrdersFile(file);
    const formData = new FormData();
    formData.set("file", file);
    const result = await previewFileAction(formData);
    if (result.columns) {
      setOrdersPreview(result as { columns: string[]; preview: Record<string, unknown>[] });
      const mapping: Record<string, string> = {};
      result.columns.forEach((col: string) => {
        const key = col.toLowerCase().replace(/\s+/g, "_");
        mapping[col] = ordersDefaults[key] ?? "";
      });
      setOrdersMapping(mapping);
    }
  }

  async function handleInvoicesUpload(file: File) {
    setInvoicesFile(file);
    const formData = new FormData();
    formData.set("file", file);
    const result = await previewFileAction(formData);
    if (result.columns) {
      setInvoicesPreview(result as { columns: string[]; preview: Record<string, unknown>[] });
      const mapping: Record<string, string> = {};
      result.columns.forEach((col: string) => {
        const key = col.toLowerCase().replace(/\s+/g, "_");
        mapping[col] = invoicesDefaults[key] ?? "";
      });
      setInvoicesMapping(mapping);
    }
  }

  async function handleCreate() {
    setLoading(true);
    try {
      const ordersSource = await createDataSourceAction(organizationId, {
        name: "Orders",
        type: "FILE_CSV",
      });

      const invoicesSource = await createDataSourceAction(organizationId, {
        name: "Invoices",
        type: "FILE_CSV",
      });

      const ordersForm = new FormData();
      ordersForm.set("file", ordersFile!);
      ordersForm.set("dataSourceId", ordersSource.id);
      ordersForm.set("name", "Orders Dataset");
      ordersForm.set("mapping", JSON.stringify(ordersMapping));
      const ordersResult = await uploadDatasetAction(organizationId, ordersForm);

      const invoicesForm = new FormData();
      invoicesForm.set("file", invoicesFile!);
      invoicesForm.set("dataSourceId", invoicesSource.id);
      invoicesForm.set("name", "Invoices Dataset");
      invoicesForm.set("mapping", JSON.stringify(invoicesMapping));
      const invoicesResult = await uploadDatasetAction(organizationId, invoicesForm);

      if (ordersResult.error || invoicesResult.error) {
        toast.error("Dataset upload failed");
        return;
      }

      const control = await createControlAction(organizationId, {
        name,
        description: "Revenue integrity: completed orders vs invoices",
        templateId: template,
        ordersDatasetId: ordersResult.dataset?.id,
        invoicesDatasetId: invoicesResult.dataset?.id,
      });

      toast.success("Control created successfully");
      router.push(`/controls/${control.id}`);
    } catch {
      toast.error("Failed to create control");
    } finally {
      setLoading(false);
    }
  }

  function MappingStep({
    preview,
    mapping,
    setMapping,
    title,
  }: {
    preview: { columns: string[]; preview: Record<string, unknown>[] } | null;
    mapping: Record<string, string>;
    setMapping: (m: Record<string, string>) => void;
    title: string;
  }) {
    if (!preview) return null;
    return (
      <div className="space-y-4">
        <h3 className="font-medium">{title} — Map Fields</h3>
        <div className="space-y-2">
          {preview.columns.map((col) => (
            <div key={col} className="flex items-center gap-3">
              <span className="w-40 truncate text-sm text-zinc-600">{col}</span>
              <span className="text-zinc-300">→</span>
              <select
                value={mapping[col] ?? ""}
                onChange={(e) => setMapping({ ...mapping, [col]: e.target.value })}
                className="flex-1 rounded-md border border-zinc-200 px-2 py-1 text-sm"
              >
                <option value="">— skip —</option>
                {CANONICAL_FIELDS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto rounded-md border border-zinc-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-zinc-50">
                {preview.columns.map((col) => (
                  <th key={col} className="px-3 py-2 text-left font-medium text-zinc-500">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.preview.slice(0, 5).map((row, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {preview.columns.map((col) => (
                    <td key={col} className="px-3 py-2 text-zinc-700">{String(row[col] ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Create Control</h1>
        <p className="text-sm text-zinc-500">Step {step} of 4 — Revenue Integrity</p>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`h-1 flex-1 rounded ${s <= step ? "bg-zinc-900" : "bg-zinc-200"}`} />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Configure Control</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Control Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <p className="text-sm text-zinc-500">
              This control compares completed orders against invoices to identify missing, partial, and mismatched billing.
            </p>
            <Button onClick={() => setStep(2)}>Continue</Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Upload Orders File</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input type="file" accept=".csv,.xlsx" onChange={(e) => e.target.files?.[0] && handleOrdersUpload(e.target.files[0])} />
            <MappingStep preview={ordersPreview} mapping={ordersMapping} setMapping={setOrdersMapping} title="Orders" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={!ordersPreview}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Upload Invoices File</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input type="file" accept=".csv,.xlsx" onChange={(e) => e.target.files?.[0] && handleInvoicesUpload(e.target.files[0])} />
            <MappingStep preview={invoicesPreview} mapping={invoicesMapping} setMapping={setInvoicesMapping} title="Invoices" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)} disabled={!invoicesPreview}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Review & Activate</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-zinc-50 p-4 text-sm space-y-1">
              <p><strong>Control:</strong> {name}</p>
              <p><strong>Orders:</strong> {ordersFile?.name} ({ordersPreview?.preview.length ?? 0}+ rows)</p>
              <p><strong>Invoices:</strong> {invoicesFile?.name} ({invoicesPreview?.preview.length ?? 0}+ rows)</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? "Creating..." : "Activate Control"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
