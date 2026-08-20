import { and, desc, eq, sql } from "drizzle-orm";
import { continuationControls, continuationCycles } from "../../drizzle/schema";
import { getDb } from "../db";

export const CONTINUATION_CONTROL_NAME = "hourly-engineering-continuation";

export type ContinuationDecision =
  | "completed"
  | "duplicate"
  | "disabled"
  | "cycle_limit_reached"
  | "orphaned_schedule";

export function getHourlyIdempotencyKey(date = new Date()) {
  const hour = new Date(date);
  hour.setUTCMinutes(0, 0, 0);
  return `hourly-continuation:${hour.toISOString()}`;
}

export function decideContinuation(
  control: {
    isEnabled: boolean;
    maxCycles: number;
    completedCycles: number;
    scheduleCronTaskUid: string | null;
  },
  taskUid: string
): Exclude<ContinuationDecision, "completed" | "duplicate"> | null {
  if (!control.scheduleCronTaskUid || control.scheduleCronTaskUid !== taskUid) {
    return "orphaned_schedule";
  }
  if (!control.isEnabled) return "disabled";
  if (control.completedCycles >= control.maxCycles) {
    return "cycle_limit_reached";
  }
  return null;
}

export function buildContinuationValidation(
  executionNumber: number,
  maxCycles: number
) {
  return {
    validationStatus: [
      "database-probe-passed",
      "schedule-ownership-passed",
      `cycle-${executionNumber}-within-${maxCycles}-limit`,
    ].join(","),
    nextRecommendedAction:
      executionNumber >= maxCycles
        ? "Pause the hourly continuation schedule because the configured cycle limit has been reached."
        : "Wait for the next scheduled hourly website health check.",
  };
}

export async function getContinuationStatus(limit = 8) {
  const db = await getDb();
  if (!db) return { control: null, cycles: [] };
  const [control] = await db
    .select()
    .from(continuationControls)
    .where(eq(continuationControls.name, CONTINUATION_CONTROL_NAME))
    .limit(1);
  if (!control) return { control: null, cycles: [] };
  const cycles = await db
    .select()
    .from(continuationCycles)
    .where(eq(continuationCycles.controlId, control.id))
    .orderBy(desc(continuationCycles.createdAt))
    .limit(limit);
  return { control, cycles };
}

export async function runHourlyContinuation(taskUid: string, now = new Date()) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [control] = await db
    .select()
    .from(continuationControls)
    .where(eq(continuationControls.name, CONTINUATION_CONTROL_NAME))
    .limit(1);

  if (!control) {
    return {
      decision: "orphaned_schedule" as const,
      message: "No continuation control is configured for this project.",
    };
  }

  const decision = decideContinuation(control, taskUid);
  if (decision) {
    return {
      decision,
      message:
        decision === "cycle_limit_reached"
          ? "The 2,400-cycle limit has been reached."
          : "The incoming schedule does not own an enabled continuation control.",
    };
  }

  const idempotencyKey = getHourlyIdempotencyKey(now);
  const [existing] = await db
    .select()
    .from(continuationCycles)
    .where(
      and(
        eq(continuationCycles.controlId, control.id),
        eq(continuationCycles.idempotencyKey, idempotencyKey)
      )
    )
    .limit(1);
  if (existing) {
    return {
      decision: "duplicate" as const,
      message: "This hourly continuation cycle was already recorded.",
      cycle: existing,
    };
  }

  const executionNumber = control.completedCycles + 1;
  try {
    await db.execute(sql`SELECT 1 AS health_probe`);
    const validation = buildContinuationValidation(
      executionNumber,
      control.maxCycles
    );
    const [inserted] = await db.insert(continuationCycles).values({
      controlId: control.id,
      idempotencyKey,
      executionNumber,
      triggeredByTaskUid: taskUid,
      action: "website-health-check",
      result: "completed",
      recoveryAttempt: 0,
      validationStatus: validation.validationStatus,
      remainingBlocker: null,
      nextRecommendedAction: validation.nextRecommendedAction,
    });
    await db
      .update(continuationControls)
      .set({ completedCycles: executionNumber, lastCycleAt: now })
      .where(eq(continuationControls.id, control.id));
    const [cycle] = await db
      .select()
      .from(continuationCycles)
      .where(eq(continuationCycles.id, Number(inserted.insertId)))
      .limit(1);
    return {
      decision: "completed" as const,
      message: "Website continuation health check completed.",
      cycle,
    };
  } catch (error) {
    if (String(error).toLowerCase().includes("duplicate")) {
      return {
        decision: "duplicate" as const,
        message:
          "This hourly continuation cycle was recorded by a concurrent retry.",
      };
    }
    throw error;
  }
}
