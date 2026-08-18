import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");

describe("client loading strategy", () => {
  it("defers markdown parsing from the primary route", async () => {
    const [appSource, dashboardSource, markdownSource, viteSource] = await Promise.all([
      readFile(path.join(projectRoot, "client/src/App.tsx"), "utf8"),
      readFile(path.join(projectRoot, "client/src/pages/ChatDashboard.tsx"), "utf8"),
      readFile(path.join(projectRoot, "client/src/components/MarkdownContent.tsx"), "utf8"),
      readFile(path.join(projectRoot, "vite.config.ts"), "utf8"),
    ]);

    expect(appSource).not.toContain("FacebookProfileWorkspace");
    expect(dashboardSource).toContain('lazy(() => import("@/components/MarkdownContent"))');
    expect(dashboardSource).toContain('useState<"chat" | "sessions" | "logs">("chat")');
    expect(dashboardSource).toContain('CardTitle className="text-2xl font-bold tracking-tight text-white"');
    expect(dashboardSource).not.toContain('from "streamdown"');
    expect(markdownSource).toContain('from "streamdown"');
    expect(viteSource).toContain("manualChunks(id)");
    expect(viteSource).toContain('return "react-vendor"');
  });
});
