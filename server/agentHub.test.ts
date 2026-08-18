import { describe, expect, it, vi } from "vitest";

vi.mock("./services/agentTools", () => ({
  checkIntegrationsHealth: vi.fn(async () => ({
    github: { status: "connected", tokenConfigured: false },
    huggingface: { status: "optional", tokenConfigured: false },
  })),
}));

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
});
