import { describe, expect, it } from "vitest";
import {
  getMigrationCheckStatus,
  shouldRunMigrationCheck,
} from "../scripts/maintenanceDatabaseCheck.mjs";

describe("maintenance database check policy", () => {
  it("runs schema validation when a database URL is configured", () => {
    expect(shouldRunMigrationCheck({ DATABASE_URL: "mysql://example" })).toBe(
      true
    );
    expect(getMigrationCheckStatus({ DATABASE_URL: "mysql://example" })).toBe(
      null
    );
  });

  it("records an explicit non-failing skip when CI has no database credential", () => {
    expect(shouldRunMigrationCheck({})).toBe(false);
    expect(getMigrationCheckStatus({})).toBe(
      "skipped_database_url_unavailable"
    );
  });
});
