import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");

describe("automation inventory validation", () => {
  it("accepts the committed non-secret automation inventory", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/validate-automation-inventory.mjs"],
      {
        cwd: projectRoot,
        encoding: "utf8",
      }
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('"status": "passed"');
    expect(result.stdout).toContain('"secretValuesRecorded": false');
  });
});
