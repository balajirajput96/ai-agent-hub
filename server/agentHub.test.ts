import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-oauth-user",
    email: "agent-hub@example.com",
    name: "AI Agent Operator",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("AI Agent Hub Router Tests", () => {
  it("checks integration health correctly", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const health = await caller.agentHub.checkHealth();
    expect(health).toHaveProperty("github");
    expect(health).toHaveProperty("huggingface");
    expect(health.github).toHaveProperty("status");
    expect(health.huggingface).toHaveProperty("status");
  });

  it("prevents non-admin users from bootstrapping continuation controls", async () => {
    const caller = appRouter.createCaller(createTestContext());

    await expect(
      caller.agentHub.bootstrapContinuationControl({
        taskUid: "bh5jRHZ5ZcqgSaCtVr8uax",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
