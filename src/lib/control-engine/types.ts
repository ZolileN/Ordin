import type { ExceptionSeverity, ExceptionType, MatchStatus } from "@prisma/client";

export interface NormalizedRecord {
  external_id?: string | null;
  customer?: string | null;
  reference?: string | null;
  date?: string | null;
  status?: string | null;
  amount?: number | null;
  quantity?: number | null;
  product?: string | null;
  branch?: string | null;
  currency?: string | null;
  [key: string]: unknown;
}

export interface ControlMatch {
  status: MatchStatus;
  sourceRecord: NormalizedRecord;
  targetRecord?: NormalizedRecord | null;
  variance?: number;
  metadata?: Record<string, unknown>;
}

export interface ControlException {
  type: ExceptionType;
  title: string;
  description: string;
  severity: ExceptionSeverity;
  financialImpact: number;
  expectedAmount?: number;
  actualAmount?: number;
  variance?: number;
  sourceRecords: NormalizedRecord[];
}

export interface ControlMetrics {
  totalSource: number;
  totalTarget: number;
  matched: number;
  partial: number;
  unmatched: number;
  duplicates: number;
  exceptions: number;
  financialExposure: number;
  matchRate: number;
}

export interface ControlRunResult {
  matches: ControlMatch[];
  exceptions: ControlException[];
  metrics: ControlMetrics;
}

export interface ControlEngineConfig {
  tolerance: number;
  completedStatuses?: string[];
  matchField?: string;
}

const DEFAULT_COMPLETED_STATUSES = ["completed", "complete", "done", "closed", "fulfilled"];

export function isCompletedStatus(status: string | null | undefined, completedStatuses: string[]): boolean {
  if (!status) return false;
  return completedStatuses.includes(status.toLowerCase().trim());
}

export function calculateSeverity(financialImpact: number): ExceptionSeverity {
  if (financialImpact >= 50000) return "CRITICAL";
  if (financialImpact >= 10000) return "HIGH";
  if (financialImpact >= 1000) return "MEDIUM";
  return "LOW";
}

export function calculateMetrics(
  matches: ControlMatch[],
  exceptions: ControlException[]
): ControlMetrics {
  const matched = matches.filter((m) => m.status === "MATCHED").length;
  const partial = matches.filter((m) => m.status === "PARTIAL").length;
  const unmatched = matches.filter((m) => m.status === "UNMATCHED").length;
  const duplicates = matches.filter((m) => m.status === "DUPLICATE").length;
  const totalSource = matches.length;
  const financialExposure = exceptions.reduce((sum, e) => sum + e.financialImpact, 0);
  const matchRate = totalSource > 0 ? (matched / totalSource) * 100 : 100;

  return {
    totalSource,
    totalTarget: 0,
    matched,
    partial,
    unmatched,
    duplicates,
    exceptions: exceptions.length,
    financialExposure,
    matchRate,
  };
}

export function calculateIntegrityScore(metrics: ControlMetrics): number {
  if (metrics.totalSource === 0) return 100;
  const weightedIssues =
    metrics.unmatched * 1.0 +
    metrics.partial * 0.5 +
    metrics.duplicates * 0.3;
  const score = Math.max(0, 100 - (weightedIssues / metrics.totalSource) * 100);
  return Math.round(score * 10) / 10;
}
