import { describe, it, expect } from "vitest";
import { runRevenueIntegrityControl } from "@/lib/control-engine/revenue-integrity";
import type { NormalizedRecord } from "@/lib/control-engine/types";
import { calculateIntegrityScore, calculateSeverity } from "@/lib/control-engine/types";

function makeOrder(id: string, amount: number, status = "completed"): NormalizedRecord {
  return { external_id: id, customer: "Test Co", date: "2026-08-01", status, amount };
}

function makeInvoice(id: string, orderRef: string, amount: number): NormalizedRecord {
  return { external_id: id, customer: "Test Co", date: "2026-08-02", reference: orderRef, amount };
}

describe("Revenue Integrity Control", () => {
  it("matches 95 of 100 completed orders with invoices", () => {
    const orders: NormalizedRecord[] = [];
    const invoices: NormalizedRecord[] = [];

    for (let i = 1; i <= 100; i++) {
      const id = `ORD-${i}`;
      orders.push(makeOrder(id, 10000));
      if (i <= 95) {
        invoices.push(makeInvoice(`INV-${i}`, id, 10000));
      }
    }

    const result = runRevenueIntegrityControl(orders, invoices);

    expect(result.metrics.matched).toBe(95);
    expect(result.metrics.unmatched).toBe(5);
    expect(result.exceptions.filter((e) => e.type === "MISSING_INVOICE")).toHaveLength(5);
  });

  it("detects partial invoices", () => {
    const orders = [makeOrder("ORD-1", 10000)];
    const invoices = [makeInvoice("INV-1", "ORD-1", 6000)];

    const result = runRevenueIntegrityControl(orders, invoices);

    expect(result.metrics.partial).toBe(1);
    expect(result.exceptions.some((e) => e.type === "PARTIAL_INVOICE")).toBe(true);
    expect(result.exceptions[0].financialImpact).toBe(4000);
  });

  it("detects amount mismatches", () => {
    const orders = [makeOrder("ORD-1", 10000)];
    const invoices = [makeInvoice("INV-1", "ORD-1", 12000)];

    const result = runRevenueIntegrityControl(orders, invoices);

    expect(result.exceptions.some((e) => e.type === "AMOUNT_MISMATCH")).toBe(true);
  });

  it("detects duplicate invoices", () => {
    const orders = [makeOrder("ORD-1", 10000)];
    const invoices = [
      makeInvoice("INV-1A", "ORD-1", 10000),
      makeInvoice("INV-1B", "ORD-1", 10000),
    ];

    const result = runRevenueIntegrityControl(orders, invoices);

    expect(result.metrics.duplicates).toBe(1);
    expect(result.exceptions.some((e) => e.type === "DUPLICATE_INVOICE")).toBe(true);
  });

  it("detects unmatched invoices", () => {
    const orders: NormalizedRecord[] = [];
    const invoices = [makeInvoice("INV-1", "ORD-NONEXISTENT", 5000)];

    const result = runRevenueIntegrityControl(orders, invoices);

    expect(result.exceptions.some((e) => e.type === "UNMATCHED_INVOICE")).toBe(true);
  });

  it("ignores non-completed orders", () => {
    const orders = [makeOrder("ORD-1", 10000, "pending")];
    const invoices: NormalizedRecord[] = [];

    const result = runRevenueIntegrityControl(orders, invoices);

    expect(result.metrics.totalSource).toBe(0);
    expect(result.exceptions).toHaveLength(0);
  });

  it("respects tolerance", () => {
    const orders = [makeOrder("ORD-1", 10000)];
    const invoices = [makeInvoice("INV-1", "ORD-1", 10050)];

    const result = runRevenueIntegrityControl(orders, invoices, { tolerance: 100 });
    expect(result.metrics.matched).toBe(1);
    expect(result.exceptions).toHaveLength(0);
  });

  it("calculates financial exposure", () => {
    const orders = [
      makeOrder("ORD-1", 10000),
      makeOrder("ORD-2", 20000),
      makeOrder("ORD-3", 15000),
    ];
    const invoices = [makeInvoice("INV-1", "ORD-1", 10000)];

    const result = runRevenueIntegrityControl(orders, invoices);

    expect(result.metrics.financialExposure).toBe(35000);
  });
});

describe("Severity Calculation", () => {
  it("assigns correct severity levels", () => {
    expect(calculateSeverity(100)).toBe("LOW");
    expect(calculateSeverity(5000)).toBe("MEDIUM");
    expect(calculateSeverity(15000)).toBe("HIGH");
    expect(calculateSeverity(60000)).toBe("CRITICAL");
  });
});

describe("Integrity Score", () => {
  it("returns 100 for perfect match", () => {
    const score = calculateIntegrityScore({
      totalSource: 100,
      totalTarget: 100,
      matched: 100,
      partial: 0,
      unmatched: 0,
      duplicates: 0,
      exceptions: 0,
      financialExposure: 0,
      matchRate: 100,
    });
    expect(score).toBe(100);
  });

  it("decreases with issues", () => {
    const score = calculateIntegrityScore({
      totalSource: 100,
      totalTarget: 100,
      matched: 80,
      partial: 10,
      unmatched: 10,
      duplicates: 0,
      exceptions: 20,
      financialExposure: 50000,
      matchRate: 80,
    });
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThan(0);
  });
});
