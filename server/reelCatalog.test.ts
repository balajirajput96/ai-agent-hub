import { describe, expect, it } from "vitest";
import {
  REEL_0001,
  REEL_0001_DRIVE_FOLDER_ID,
  REEL_0001_SOURCE_RECORD,
  REELS_PER_BATCH,
  REEL_TARGET,
  getBatchNumber,
  getNextEligibleReelNumber,
  getQueuedRetryCountForOwner,
  getReelUniqueKey,
} from "./services/reelCatalog";

describe("Reel 0001 catalog definition", () => {
  it("keeps the pilot in a non-completed state until media and Drive verification occur", () => {
    expect(REEL_0001.status).toBe("script_ready");
    expect(REEL_0001.lastBlocker).toContain("pending");
  });

  it("stores a 9:16 Hindi plan with durable, non-secret references", () => {
    const visualPlan = JSON.parse(REEL_0001.visualPlan) as {
      format: string;
      durationSeconds: number;
      narrationLanguage: string;
      scenes: unknown[];
    };
    expect(visualPlan.format).toBe("9:16");
    expect(visualPlan.durationSeconds).toBe(60);
    expect(visualPlan.narrationLanguage).toBe("hi-IN");
    expect(visualPlan.scenes).toHaveLength(5);
    expect(REEL_0001.driveFolderId).toBe(REEL_0001_DRIVE_FOLDER_ID);
    expect(REEL_0001.sourceRecordPath).toBe(REEL_0001_SOURCE_RECORD);
  });

  it("maps the 3,000-reel mission into deterministic 30-reel batches", () => {
    expect(REEL_TARGET).toBe(3000);
    expect(REELS_PER_BATCH).toBe(30);
    expect(getBatchNumber(1)).toBe(1);
    expect(getBatchNumber(30)).toBe(1);
    expect(getBatchNumber(31)).toBe(2);
    expect(getBatchNumber(3000)).toBe(100);
  });

  it("keeps unique topic keys stable and prioritizes unfinished reels", () => {
    expect(
      getReelUniqueKey("Memory: recall and updating", "Neuroscience")
    ).toBe("neuroscience-memory-recall-and-updating");
    expect(
      getNextEligibleReelNumber([
        { reelNumber: 1, status: "uploaded" },
        { reelNumber: 2, status: "research_ready" },
      ])
    ).toBe(2);
    expect(
      getNextEligibleReelNumber([{ reelNumber: 1, status: "uploaded" }])
    ).toBe(2);
  });

  it("excludes another owner’s queued retry from the current owner’s count", () => {
    const retryRows = [
      { reel_retry_queue: { status: "queued" }, reel_catalog: { userId: 101 } },
      { reel_retry_queue: { status: "queued" }, reel_catalog: { userId: 202 } },
      {
        reel_retry_queue: { status: "resolved" },
        reel_catalog: { userId: 101 },
      },
    ];

    expect(getQueuedRetryCountForOwner(retryRows, 101)).toBe(1);
    expect(getQueuedRetryCountForOwner(retryRows, 202)).toBe(1);
  });
});
