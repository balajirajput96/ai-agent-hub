import { describe, expect, it } from "vitest";
import { getSafeRepositoryIdentity } from "../scripts/maintenanceIdentity.mjs";

describe("maintenance execution record identity", () => {
  it("uses the GitHub owner and repository when the environment value is safe", () => {
    expect(
      getSafeRepositoryIdentity(
        { GITHUB_REPOSITORY: "balajirajput96/ai-agent-hub" },
        "/workspace/ai-agent-hub"
      )
    ).toBe("balajirajput96/ai-agent-hub");
  });

  it("never falls back to a credential-bearing managed remote URL", () => {
    expect(getSafeRepositoryIdentity({}, "/workspace/ai-agent-hub")).toBe(
      "local:ai-agent-hub"
    );

    const unsafeRepositoryEnvironment = {
      GITHUB_REPOSITORY: "https://secret@host.example/repository",
    };

    expect(
      getSafeRepositoryIdentity(
        unsafeRepositoryEnvironment,
        "/workspace/ai-agent-hub"
      )
    ).toBe("local:ai-agent-hub");
  });
});
