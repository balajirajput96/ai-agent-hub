import { describe, expect, it } from "vitest";
import {
  buildContinuationValidation,
  decideContinuation,
  getHourlyIdempotencyKey,
  isValidHeartbeatTaskUid,
} from "./continuationDb";

describe("hourly continuation decisions", () => {
  it("normalizes all retries in one UTC hour to the same idempotency key", () => {
    expect(getHourlyIdempotencyKey(new Date("2026-08-20T19:00:01.000Z"))).toBe(
      getHourlyIdempotencyKey(new Date("2026-08-20T19:59:59.000Z"))
    );
  });

  it("blocks unknown schedules, disabled controls, and exhausted controls", () => {
    const base = {
      scheduleCronTaskUid: "hourly-task",
      isEnabled: true,
      maxCycles: 2400,
      completedCycles: 0,
    };
    expect(decideContinuation(base, "other-task")).toBe("orphaned_schedule");
    expect(
      decideContinuation({ ...base, isEnabled: false }, "hourly-task")
    ).toBe("disabled");
    expect(
      decideContinuation({ ...base, completedCycles: 2400 }, "hourly-task")
    ).toBe("cycle_limit_reached");
  });

  it("records a bounded, dynamic validation outcome", () => {
    const validation = buildContinuationValidation(1, 2400);
    expect(validation.validationStatus).toContain("database-probe-passed");
    expect(validation.validationStatus).toContain(
      "github-workflow-unavailable"
    );
    expect(validation.remainingBlocker).toContain("not configured");
    expect(validation.nextRecommendedAction).toContain("Keep local");
    expect(
      buildContinuationValidation(2400, 2400).nextRecommendedAction
    ).toContain("Pause");
  });

  it("records a bounded GitHub workflow status in the validation result", () => {
    const validation = buildContinuationValidation(8, 2400, {
      status: "attention",
      validationToken: "github-workflow-attention",
      blocker: "GitHub run 42 is failure.",
      recommendation: "Review the latest GitHub workflow outcome.",
    });

    expect(validation.validationStatus).toContain("github-workflow-attention");
    expect(validation.remainingBlocker).toBe("GitHub run 42 is failure.");
    expect(validation.nextRecommendedAction).toContain("Review");
  });

  it("accepts only bounded non-secret Heartbeat task identities", () => {
    expect(isValidHeartbeatTaskUid("bh5jRHZ5ZcqgSaCtVr8uax")).toBe(true);
    expect(isValidHeartbeatTaskUid("too short")).toBe(false);
    expect(isValidHeartbeatTaskUid("task uid with spaces")).toBe(false);
  });
});
