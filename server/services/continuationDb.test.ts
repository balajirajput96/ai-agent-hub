import { describe, expect, it } from "vitest";
import {
  buildContinuationValidation,
  decideContinuation,
  getHourlyIdempotencyKey,
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
    expect(buildContinuationValidation(1, 2400)).toEqual({
      validationStatus:
        "database-probe-passed,schedule-ownership-passed,cycle-1-within-2400-limit",
      nextRecommendedAction:
        "Wait for the next scheduled hourly website health check.",
    });
    expect(
      buildContinuationValidation(2400, 2400).nextRecommendedAction
    ).toContain("Pause");
  });
});
