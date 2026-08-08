import type { ControlEngineConfig, ControlException, ControlMatch, ControlRunResult, NormalizedRecord } from "./types";
import { calculateMetrics, calculateSeverity, isCompletedStatus } from "./types";

export function runRevenueIntegrityControl(
  orders: NormalizedRecord[],
  invoices: NormalizedRecord[],
  config: ControlEngineConfig = { tolerance: 0 }
): ControlRunResult {
  const tolerance = config.tolerance ?? 0;
  const completedStatuses = config.completedStatuses ?? ["completed", "complete", "done", "closed", "fulfilled"];
  const matchField = config.matchField ?? "external_id";

  const matches: ControlMatch[] = [];
  const exceptions: ControlException[] = [];

  const invoiceMap = new Map<string, NormalizedRecord[]>();
  const invoiceByOrderRef = new Map<string, NormalizedRecord[]>();

  for (const invoice of invoices) {
    const id = invoice.external_id ? String(invoice.external_id) : null;
    if (id) {
      const existing = invoiceMap.get(id) ?? [];
      existing.push(invoice);
      invoiceMap.set(id, existing);
    }

    const orderRef = invoice.reference ? String(invoice.reference) : null;
    if (orderRef) {
      const existing = invoiceByOrderRef.get(orderRef) ?? [];
      existing.push(invoice);
      invoiceByOrderRef.set(orderRef, existing);
    }
  }

  const matchedInvoiceIds = new Set<string>();
  const completedOrders = orders.filter((o) => isCompletedStatus(o.status as string, completedStatuses));

  for (const order of completedOrders) {
    const orderId = order.external_id ? String(order.external_id) : null;
    const orderAmount = (order.amount as number) ?? 0;

    let matchedInvoices: NormalizedRecord[] = [];

    if (orderId) {
      matchedInvoices = invoiceByOrderRef.get(orderId) ?? [];
      if (matchedInvoices.length === 0) {
        matchedInvoices = invoiceMap.get(orderId) ?? [];
      }
    }

    if (matchedInvoices.length === 0) {
      matches.push({
        status: "UNMATCHED",
        sourceRecord: order,
        targetRecord: null,
        variance: orderAmount,
      });

      exceptions.push({
        type: "MISSING_INVOICE",
        title: "Completed Order Not Invoiced",
        description: `Completed order ${orderId ?? "unknown"} has no matching invoice.`,
        severity: calculateSeverity(orderAmount),
        financialImpact: orderAmount,
        expectedAmount: orderAmount,
        actualAmount: 0,
        variance: orderAmount,
        sourceRecords: [order],
      });
      continue;
    }

    if (matchedInvoices.length > 1) {
      const totalInvoiceAmount = matchedInvoices.reduce(
        (sum, inv) => sum + ((inv.amount as number) ?? 0),
        0
      );

      matches.push({
        status: "DUPLICATE",
        sourceRecord: order,
        targetRecord: matchedInvoices[0],
        variance: totalInvoiceAmount - orderAmount,
        metadata: { duplicateCount: matchedInvoices.length },
      });

      matchedInvoices.forEach((inv) => {
        if (inv.external_id) matchedInvoiceIds.add(String(inv.external_id));
      });

      exceptions.push({
        type: "DUPLICATE_INVOICE",
        title: "Duplicate Invoices for Order",
        description: `Order ${orderId} has ${matchedInvoices.length} matching invoices.`,
        severity: calculateSeverity(Math.abs(totalInvoiceAmount - orderAmount)),
        financialImpact: Math.abs(totalInvoiceAmount - orderAmount),
        expectedAmount: orderAmount,
        actualAmount: totalInvoiceAmount,
        variance: totalInvoiceAmount - orderAmount,
        sourceRecords: [order, ...matchedInvoices],
      });
      continue;
    }

    const invoice = matchedInvoices[0];
    if (invoice.external_id) matchedInvoiceIds.add(String(invoice.external_id));

    const invoiceAmount = (invoice.amount as number) ?? 0;
    const variance = orderAmount - invoiceAmount;
    const absVariance = Math.abs(variance);

    if (absVariance <= tolerance) {
      matches.push({
        status: "MATCHED",
        sourceRecord: order,
        targetRecord: invoice,
        variance: 0,
      });
    } else if (invoiceAmount > 0 && invoiceAmount < orderAmount) {
      matches.push({
        status: "PARTIAL",
        sourceRecord: order,
        targetRecord: invoice,
        variance,
      });

      exceptions.push({
        type: "PARTIAL_INVOICE",
        title: "Partial Invoice",
        description: `Order ${orderId} invoiced for R${invoiceAmount.toLocaleString()} of R${orderAmount.toLocaleString()}.`,
        severity: calculateSeverity(absVariance),
        financialImpact: absVariance,
        expectedAmount: orderAmount,
        actualAmount: invoiceAmount,
        variance,
        sourceRecords: [order, invoice],
      });
    } else if (absVariance > tolerance) {
      matches.push({
        status: "PARTIAL",
        sourceRecord: order,
        targetRecord: invoice,
        variance,
      });

      exceptions.push({
        type: "AMOUNT_MISMATCH",
        title: "Amount Mismatch",
        description: `Order ${orderId} amount differs from invoice by R${absVariance.toLocaleString()}.`,
        severity: calculateSeverity(absVariance),
        financialImpact: absVariance,
        expectedAmount: orderAmount,
        actualAmount: invoiceAmount,
        variance,
        sourceRecords: [order, invoice],
      });
    } else {
      matches.push({
        status: "MATCHED",
        sourceRecord: order,
        targetRecord: invoice,
        variance: 0,
      });
    }
  }

  for (const invoice of invoices) {
    const invoiceId = invoice.external_id ? String(invoice.external_id) : null;
    if (!invoiceId || matchedInvoiceIds.has(invoiceId)) continue;

    const orderRef = invoice.reference ? String(invoice.reference) : null;
    const hasMatchingOrder = orderRef
      ? completedOrders.some((o) => String(o.external_id) === orderRef)
      : false;

    if (!hasMatchingOrder) {
      const invoiceAmount = (invoice.amount as number) ?? 0;
      matches.push({
        status: "UNMATCHED",
        sourceRecord: invoice,
        targetRecord: null,
      });

      exceptions.push({
        type: "UNMATCHED_INVOICE",
        title: "Unmatched Invoice",
        description: `Invoice ${invoiceId} has no matching completed order.`,
        severity: calculateSeverity(invoiceAmount),
        financialImpact: invoiceAmount,
        expectedAmount: 0,
        actualAmount: invoiceAmount,
        variance: invoiceAmount,
        sourceRecords: [invoice],
      });
    }
  }

  const metrics = calculateMetrics(matches, exceptions);
  metrics.totalTarget = invoices.length;

  return { matches, exceptions, metrics };
}
