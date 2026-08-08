"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  updateExceptionStatusAction,
  assignExceptionAction,
  addCommentAction,
  resolveExceptionAction,
  attachEvidenceAction,
} from "@/actions/exceptions";
import { toast } from "sonner";
import type { ExceptionSeverity, ExceptionStatus } from "@prisma/client";

interface ExceptionDetailClientProps {
  exception: {
    id: string;
    title: string;
    description: string;
    severity: ExceptionSeverity;
    status: ExceptionStatus;
    financialImpact: number;
    expectedAmount: number | null;
    actualAmount: number | null;
    variance: number | null;
    sourceRecords: unknown;
    detectedAt: string;
    assignedTo: { id: string; name: string | null; email: string } | null;
    comments: { id: string; content: string; createdAt: string; user: { name: string | null; email: string } }[];
    evidence: { id: string; fileName: string; createdAt: string }[];
    controlRun: { control: { name: string } };
  };
  organizationId: string;
  userId: string;
  members: { id: string; name: string | null; email: string }[];
  canAssign: boolean;
  canComment: boolean;
  canAttachEvidence: boolean;
}

export function ExceptionDetailClient({
  exception,
  organizationId,
  userId,
  members,
  canAssign,
  canComment,
  canAttachEvidence,
}: ExceptionDetailClientProps) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [resolveSummary, setResolveSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const sourceRecords = exception.sourceRecords as Record<string, unknown>[];
  const age = Math.floor((Date.now() - new Date(exception.detectedAt).getTime()) / (1000 * 60 * 60 * 24));

  async function handleStatus(status: ExceptionStatus) {
    await updateExceptionStatusAction(exception.id, organizationId, status);
    toast.success(`Status updated to ${status}`);
    router.refresh();
  }

  async function handleAssign(assigneeId: string) {
    const result = await assignExceptionAction(exception.id, organizationId, assigneeId);
    if ("error" in result && result.error) toast.error(result.error);
    else { toast.success("Exception assigned"); router.refresh(); }
  }

  async function handleComment() {
    if (!comment.trim()) return;
    const result = await addCommentAction(exception.id, organizationId, comment);
    if ("error" in result && result.error) toast.error(result.error);
    else { setComment(""); toast.success("Comment added"); router.refresh(); }
  }

  async function handleResolve() {
    if (!resolveSummary.trim()) return;
    setLoading(true);
    await resolveExceptionAction(exception.id, organizationId, resolveSummary);
    toast.success("Exception resolved");
    router.refresh();
    setLoading(false);
  }

  async function handleEvidence(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    const result = await attachEvidenceAction(exception.id, organizationId, formData);
    if ("error" in result && result.error) toast.error(result.error);
    else { toast.success("Evidence attached"); router.refresh(); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                  exception.severity === "CRITICAL" ? "bg-red-100 text-red-800" :
                  exception.severity === "HIGH" ? "bg-orange-100 text-orange-800" :
                  exception.severity === "MEDIUM" ? "bg-amber-100 text-amber-800" :
                  "bg-zinc-100 text-zinc-700"
                }`}>{exception.severity}</span>
                <h2 className="mt-2 text-xl font-semibold">{exception.title}</h2>
                <p className="mt-1 text-2xl font-bold text-zinc-900">
                  R{exception.financialImpact.toLocaleString()} financial impact
                </p>
              </div>
              <span className="rounded-md border px-2 py-1 text-xs">{exception.status}</span>
            </div>
            <p className="mt-4 text-sm text-zinc-600">{exception.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Source Records</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {sourceRecords.map((record, i) => (
                <div key={i} className="rounded-md border border-zinc-200 p-4">
                  <p className="mb-2 text-xs font-medium uppercase text-zinc-400">Record {i + 1}</p>
                  {Object.entries(record).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-1 text-sm">
                      <span className="text-zinc-500">{key}</span>
                      <span className="font-medium">{String(value ?? "—")}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {canComment && (
          <Card>
            <CardHeader><CardTitle className="text-base">Comments</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {exception.comments.map((c) => (
                <div key={c.id} className="rounded-md bg-zinc-50 p-3">
                  <p className="text-sm">{c.content}</p>
                  <p className="mt-1 text-xs text-zinc-400">{c.user.name ?? c.user.email} · {new Date(c.createdAt).toLocaleString()}</p>
                </div>
              ))}
              <div className="flex gap-2">
                <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..." />
                <Button onClick={handleComment}>Post</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Control</span><span>{exception.controlRun.control.name}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Age</span><span>{age} days</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Expected</span><span>R{(exception.expectedAmount ?? 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Actual</span><span>R{(exception.actualAmount ?? 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Variance</span><span>R{Math.abs(exception.variance ?? 0).toLocaleString()}</span></div>
            {exception.assignedTo && (
              <div className="flex justify-between"><span className="text-zinc-500">Assigned</span><span>{exception.assignedTo.name}</span></div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {canAssign && (
              <select
                className="w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm"
                onChange={(e) => e.target.value && handleAssign(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Assign to...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name ?? m.email}</option>
                ))}
              </select>
            )}
            <Button variant="outline" size="sm" className="w-full" onClick={() => handleStatus("INVESTIGATING")}>
              Mark Investigating
            </Button>
            <Button variant="outline" size="sm" className="w-full" onClick={() => handleStatus("FALSE_POSITIVE")}>
              False Positive
            </Button>
            <Input
              placeholder="Resolution summary..."
              value={resolveSummary}
              onChange={(e) => setResolveSummary(e.target.value)}
            />
            <Button size="sm" className="w-full" onClick={handleResolve} disabled={loading}>
              Resolve
            </Button>
            {canAttachEvidence && (
              <div>
                <label className="flex w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-50">
                  Attach Evidence
                  <input type="file" className="hidden" onChange={handleEvidence} />
                </label>
                {exception.evidence.map((e) => (
                  <p key={e.id} className="mt-1 text-xs text-zinc-400">{e.fileName}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
