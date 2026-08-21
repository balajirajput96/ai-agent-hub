import { afterEach, describe, expect, it, vi } from "vitest";
import { inspectGitHubWorkflowHealth } from "./githubWorkflowHealth";

const originalToken = process.env.GITHUB_TOKEN;

afterEach(() => {
  if (originalToken) process.env.GITHUB_TOKEN = originalToken;
  else delete process.env.GITHUB_TOKEN;
});

describe("GitHub workflow health inspection", () => {
  it("records a successful latest workflow without exposing credential data", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          workflow_runs: [
            { id: 123, name: "CI", status: "completed", conclusion: "success" },
          ],
        }),
        { status: 200 }
      )
    );

    const health = await inspectGitHubWorkflowHealth(fetcher);
    expect(health).toEqual({
      status: "passed",
      validationToken: "github-workflow-passed",
      blocker: null,
      recommendation:
        "Wait for the next scheduled hourly website health check.",
    });
    expect(String(fetcher.mock.calls[0][0])).toContain(
      "actions/runs?per_page=1"
    );
    expect(JSON.stringify(health)).not.toContain("test-token");
  });

  it("returns a bounded unavailable status when the approved credential is absent", async () => {
    delete process.env.GITHUB_TOKEN;
    await expect(inspectGitHubWorkflowHealth()).resolves.toMatchObject({
      status: "unavailable",
      validationToken: "github-workflow-unavailable",
    });
  });
});
