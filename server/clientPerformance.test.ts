import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");

describe("client loading strategy", () => {
  it("defers markdown parsing from the primary route", async () => {
    const [appSource, dashboardSource, markdownSource, viteSource] =
      await Promise.all([
        readFile(path.join(projectRoot, "client/src/App.tsx"), "utf8"),
        readFile(
          path.join(projectRoot, "client/src/pages/ChatDashboard.tsx"),
          "utf8"
        ),
        readFile(
          path.join(projectRoot, "client/src/components/MarkdownContent.tsx"),
          "utf8"
        ),
        readFile(path.join(projectRoot, "vite.config.ts"), "utf8"),
      ]);

    expect(appSource).not.toContain("FacebookProfileWorkspace");
    expect(dashboardSource).toMatch(
      /lazy\(\s*\(\)\s*=>\s*import\("@\/components\/MarkdownContent"\)\s*\)/
    );
    expect(dashboardSource).toMatch(
      /useState<\s*"chat"\s*\|\s*"sessions"\s*\|\s*"logs"\s*>\(\s*"chat"\s*\)/
    );
    expect(dashboardSource).toMatch(
      /CardTitle\s+className="text-2xl font-bold tracking-tight text-white"/
    );
    expect(dashboardSource).toContain("Refresh status");
    expect(dashboardSource).toContain("healthQuery.refetch()");
    expect(dashboardSource).toMatch(
      /never paste\s+a key into this app or chat/
    );
    expect(dashboardSource).toContain("provider’s interactive Google sign-in");
    expect(dashboardSource).not.toContain('from "streamdown"');
    expect(markdownSource).toContain('from "streamdown"');
    expect(viteSource).toContain("manualChunks(id)");
    expect(viteSource).toContain('return "react-vendor"');
  });
});
