import { describe, it, expect } from "vitest";
import { PLAN_LIMITS } from "@/lib/constants";

describe("Subscription Limits", () => {
  it("enforces starter plan limits", () => {
    expect(PLAN_LIMITS.STARTER.maxControls).toBe(1);
    expect(PLAN_LIMITS.STARTER.maxDataSources).toBe(2);
    expect(PLAN_LIMITS.STARTER.maxEntities).toBe(1);
    expect(PLAN_LIMITS.STARTER.exceptionAssignment).toBe(false);
  });

  it("enforces growth plan limits", () => {
    expect(PLAN_LIMITS.GROWTH.maxControls).toBe(5);
    expect(PLAN_LIMITS.GROWTH.exceptionAssignment).toBe(true);
    expect(PLAN_LIMITS.GROWTH.comments).toBe(true);
    expect(PLAN_LIMITS.GROWTH.apiAccess).toBe(false);
  });

  it("enforces business plan limits", () => {
    expect(PLAN_LIMITS.BUSINESS.maxControls).toBe(100);
    expect(PLAN_LIMITS.BUSINESS.apiAccess).toBe(true);
    expect(PLAN_LIMITS.BUSINESS.webhooks).toBe(true);
    expect(PLAN_LIMITS.BUSINESS.approvalWorkflows).toBe(true);
  });
});
