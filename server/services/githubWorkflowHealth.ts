export type GitHubWorkflowHealth = {
  status: "passed" | "attention" | "unavailable";
  validationToken: string;
  blocker: string | null;
  recommendation: string;
};

type WorkflowRun = {
  id?: number;
  status?: string;
  conclusion?: string | null;
  name?: string;
};

type WorkflowRunsResponse = {
  workflow_runs?: WorkflowRun[];
};

const repository =
  process.env.CONTINUATION_GITHUB_REPOSITORY ??
  process.env.GITHUB_REPOSITORY ??
  "balajirajput96/ai-agent-hub";

function isValidRepository(value: string) {
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value);
}

export async function inspectGitHubWorkflowHealth(
  fetcher: typeof fetch = fetch
): Promise<GitHubWorkflowHealth> {
  const token = process.env.GITHUB_TOKEN;
  if (!token || !isValidRepository(repository)) {
    return {
      status: "unavailable",
      validationToken: "github-workflow-unavailable",
      blocker:
        "GitHub workflow inspection is not configured for this continuation cycle.",
      recommendation:
        "Keep local and scheduled validation active; restore the approved GitHub credential only through provider settings.",
    };
  }

  try {
    const response = await fetcher(
      `https://api.github.com/repos/${repository}/actions/runs?per_page=1`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: AbortSignal.timeout(5_000),
      }
    );

    if (!response.ok) {
      return {
        status: "unavailable",
        validationToken: "github-workflow-unavailable",
        blocker: `GitHub workflow inspection returned HTTP ${response.status}.`,
        recommendation:
          "Review the approved GitHub integration if workflow inspection remains unavailable.",
      };
    }

    const payload = (await response.json()) as WorkflowRunsResponse;
    const run = payload.workflow_runs?.[0];
    if (!run) {
      return {
        status: "attention",
        validationToken: "github-workflow-no-runs",
        blocker:
          "No GitHub workflow run was returned for the configured repository.",
        recommendation:
          "Review the repository workflow configuration before relying on hosted validation.",
      };
    }

    const isSuccessful =
      run.status === "completed" && run.conclusion === "success";
    if (isSuccessful) {
      return {
        status: "passed",
        validationToken: "github-workflow-passed",
        blocker: null,
        recommendation:
          "Wait for the next scheduled hourly website health check.",
      };
    }

    const runLabel = run.id ? `run ${run.id}` : "the latest workflow run";
    return {
      status: "attention",
      validationToken: "github-workflow-attention",
      blocker: `GitHub ${runLabel} is ${run.conclusion ?? run.status ?? "not complete"}.`,
      recommendation:
        "Review the latest GitHub workflow outcome before the next maintenance cycle.",
    };
  } catch {
    return {
      status: "unavailable",
      validationToken: "github-workflow-unavailable",
      blocker:
        "GitHub workflow inspection could not complete within the bounded check window.",
      recommendation:
        "Keep local and scheduled validation active; recheck GitHub workflow access on the next cycle.",
    };
  }
}
