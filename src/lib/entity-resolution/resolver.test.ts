import { describe, it, expect } from "vitest";
import { resolveEntity, createEntityCandidate } from "@/lib/entity-resolution/resolver";
import { normalizeName, parseAmount, parseDate } from "@/lib/utils";

describe("Entity Resolution", () => {
  const candidates = [
    createEntityCandidate("1", "ABC (PTY) LTD", "SAGE-001"),
    createEntityCandidate("2", "Metro Plumbing Services"),
    createEntityCandidate("3", "Sunrise Electrical Co"),
  ];

  it("matches by external ID", () => {
    const result = resolveEntity({ externalId: "SAGE-001" }, candidates);
    expect(result?.entityId).toBe("1");
    expect(result?.method).toBe("external_id");
  });

  it("matches by normalized name", () => {
    const result = resolveEntity({ name: "ABC PTY LTD" }, candidates);
    expect(result?.entityId).toBe("1");
    expect(result?.method).toBe("normalized_name");
  });

  it("matches with fuzzy threshold", () => {
    const result = resolveEntity({ name: "Metro Plumbng Services" }, candidates, { fuzzyThreshold: 0.75 });
    expect(result?.entityId).toBe("2");
    expect(result?.method).toBe("fuzzy");
  });

  it("returns null when no match", () => {
    const result = resolveEntity({ name: "Completely Different Corp" }, candidates);
    expect(result).toBeNull();
  });
});

describe("Normalization", () => {
  it("normalizes company names", () => {
    expect(normalizeName("ABC (PTY) LTD")).toBe("abc");
    expect(normalizeName("ABC Construction")).toBe("abc construction");
  });

  it("parses amounts", () => {
    expect(parseAmount("R18,400")).toBe(18400);
    expect(parseAmount("18400")).toBe(18400);
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("invalid")).toBeNull();
  });

  it("parses dates", () => {
    const date = parseDate("2026-08-04");
    expect(date).toBeInstanceOf(Date);
    expect(parseDate("invalid")).toBeNull();
  });
});
