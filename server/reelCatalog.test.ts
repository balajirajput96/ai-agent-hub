import { describe, expect, it } from "vitest";
import {
  REEL_0001,
  REEL_0001_DRIVE_FOLDER_ID,
  REEL_0001_SOURCE_RECORD,
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
});
