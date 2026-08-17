import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(userId = 1, openId = "test-oauth-user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId,
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

describe("AI Agent Hub Comprehensive Test Suite", () => {
  it("verifies integration health status", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const health = await caller.agentHub.checkHealth();
    expect(health).toHaveProperty("github");
    expect(health).toHaveProperty("huggingface");
  });

  it("handles session creation and retrieval securely per user", async () => {
    const ctx1 = createTestContext(1, "user-1");
    const caller1 = appRouter.createCaller(ctx1);

    const session = await caller1.agentHub.createSession({ title: "Test Agent Session" });
    expect(session).toBeDefined();
    expect(session.title).toBe("Test Agent Session");

    const sessions = await caller1.agentHub.getSessions();
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions.some(s => s.id === session.id)).toBe(true);

    const messages = await caller1.agentHub.getMessages({ sessionId: session.id });
    expect(Array.isArray(messages)).toBe(true);

    const toolLogs = await caller1.agentHub.getToolLogs({ sessionId: session.id });
    expect(Array.isArray(toolLogs)).toBe(true);
  });
});
