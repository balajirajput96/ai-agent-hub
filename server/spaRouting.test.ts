import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { useHashLocation } from "wouter/use-hash-location";
import { isSpaFallbackPath } from "./_core/spaFallback";

const projectRoot = path.resolve(import.meta.dirname, "..");
const appSource = fs.readFileSync(
  path.join(projectRoot, "client", "src", "App.tsx"),
  "utf8"
);
const dashboardSource = fs.readFileSync(
  path.join(projectRoot, "client", "src", "pages", "ChatDashboard.tsx"),
  "utf8"
);
const reelsWorkspaceSource = fs.readFileSync(
  path.join(projectRoot, "client", "src", "pages", "HindiReelsWorkspace.tsx"),
  "utf8"
);

describe("production-safe SPA routing", () => {
  it("maps private workspace routes into the hash fragment", () => {
    expect(useHashLocation.hrefs("/hindi-reels")).toBe("#/hindi-reels");
    expect(useHashLocation.hrefs("/facebook-profile")).toBe(
      "#/facebook-profile"
    );
  });

  it("keeps API paths outside the HTML fallback", () => {
    expect(isSpaFallbackPath("/hindi-reels")).toBe(true);
    expect(isSpaFallbackPath("/facebook-profile")).toBe(true);
    expect(isSpaFallbackPath("/api")).toBe(false);
    expect(isSpaFallbackPath("/api/trpc")).toBe(false);
    expect(isSpaFallbackPath("/api/scheduled/hourly-continuation")).toBe(false);
  });

  it("keeps the application and workspace links on hash routing", () => {
    expect(appSource).toContain("Router hook={useHashLocation}");
    expect(dashboardSource).toContain('href="#/hindi-reels"');
    expect(dashboardSource).toContain('href="#/facebook-profile"');
    expect(reelsWorkspaceSource).toContain('href="#/"');
  });
});
