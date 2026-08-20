import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  getUserSessions: vi.fn(),
  createSession: vi.fn(),
  getSessionMessages: vi.fn(),
  getSessionToolLogs: vi.fn(),
  checkIntegrationsHealth: vi.fn(),
}));

vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./services/chatDb", () => ({
  getUserSessions: mocks.getUserSessions,
  createSession: mocks.createSession,
  getSessionMessages: mocks.getSessionMessages,
  getSessionToolLogs: mocks.getSessionToolLogs,
  addMessage: vi.fn(),
  addToolLog: vi.fn(),
}));
vi.mock("./services/agentTools", () => ({
  checkIntegrationsHealth: mocks.checkIntegrationsHealth,
  searchGitHubRepos: vi.fn(),
  runHuggingFaceInference: vi.fn(),
}));

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(
  userId = 1,
  openId = "test-oauth-user"
): TrpcContext {
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
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("AI Agent Hub router", () => {
  const session = {
    id: 41,
    userId: 1,
    title: "Test Agent Session",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDb.mockResolvedValue({
      select: () => ({
        from: () => ({
          where: () => ({ limit: async () => [session] }),
        }),
      }),
    });
    mocks.getUserSessions.mockResolvedValue([session]);
    mocks.createSession.mockResolvedValue(session);
    mocks.getSessionMessages.mockResolvedValue([]);
    mocks.getSessionToolLogs.mockResolvedValue([]);
    mocks.checkIntegrationsHealth.mockResolvedValue({
      github: { status: "connected", tokenConfigured: true },
      huggingface: { status: "authorization_required", tokenConfigured: false },
    });
  });

  it("reports integration health without requiring network access", async () => {
    const health = await appRouter
      .createCaller(createTestContext())
      .agentHub.checkHealth();

    expect(health.github.status).toBe("connected");
    expect(health.huggingface.status).toBe("authorization_required");
  });

  it("keeps sessions, messages, and tool logs scoped to the authenticated user", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const created = await caller.agentHub.createSession({
      title: session.title,
    });

    expect(created).toMatchObject({ id: session.id, userId: 1 });
    await expect(
      caller.agentHub.getMessages({ sessionId: session.id })
    ).resolves.toEqual([]);
    await expect(
      caller.agentHub.getToolLogs({ sessionId: session.id })
    ).resolves.toEqual([]);
    expect(mocks.getUserSessions).not.toHaveBeenCalled();
  });
});
