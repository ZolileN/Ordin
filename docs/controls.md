# Controls

## Control Engine

The control engine is generic. Each control type implements reconciliation logic that produces:

- **Matches** — Records that agree (fully, partially, or not at all)
- **Exceptions** — Actionable issues with financial impact
- **Metrics** — Summary statistics for dashboard display

## Revenue Integrity: Completed Orders → Invoices

### Logic

1. Filter orders to completed status
2. Match orders to invoices by order reference or external ID
3. For each completed order:
   - No invoice → `MISSING_INVOICE` exception
   - Multiple invoices → `DUPLICATE_INVOICE` exception
   - Invoice amount < order amount → `PARTIAL_INVOICE` exception
   - Amount differs beyond tolerance → `AMOUNT_MISMATCH` exception
4. Unmatched invoices → `UNMATCHED_INVOICE` exception

### Severity

Based on financial impact:
- **CRITICAL:** ≥ R50,000
- **HIGH:** ≥ R10,000
- **MEDIUM:** ≥ R1,000
- **LOW:** < R1,000

### Metrics

```json
{
  "totalSource": 12482,
  "matched": 11973,
  "partial": 318,
  "unmatched": 191,
  "duplicates": 15,
  "exceptions": 524,
  "financialExposure": 284000,
  "matchRate": 96.1
}
```

## Control Library (Future)

| Control | Category | Status |
|---------|----------|--------|
| Completed Orders → Invoices | Revenue | **Available** |
| Invoices → Payments | Revenue | Coming soon |
| PO → Supplier Invoice | Payables | Coming soon |
| POS → Inventory | Inventory | Coming soon |
| Bank → Accounting | Banking | Coming soon |
| Timesheets → Payroll | Payroll | Coming soon |

## Adding a New Control

1. Implement reconciliation logic in `src/lib/control-engine/`
2. Add template to `CONTROL_TEMPLATES` in `src/lib/constants.ts`
3. Add `ControlTemplateId` enum value in Prisma schema
4. Wire into `executeControlRun()` dispatch
