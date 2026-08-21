import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const continuationMocks = vi.hoisted(() => ({
  bootstrapContinuationControl: vi.fn(),
}));

vi.mock("./services/continuationDb", () => ({
  bootstrapContinuationControl: continuationMocks.bootstrapContinuationControl,
  getContinuationStatus: vi.fn(),
}));

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin",
    email: "admin@example.com",
    name: "AI Agent Hub Administrator",
    loginMethod: "manus",
    role: "admin",
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

describe("continuation bootstrap mutation", () => {
  beforeEach(() => {
    continuationMocks.bootstrapContinuationControl.mockReset();
  });

  it("allows an admin to persist an approved Heartbeat identity", async () => {
    const persistedControl = {
      id: 1,
      name: "hourly-engineering-continuation",
      scheduleCronTaskUid: "bh5jRHZ5ZcqgSaCtVr8uax",
      maxCycles: 2400,
    };
    continuationMocks.bootstrapContinuationControl.mockResolvedValue(
      persistedControl
    );

    const caller = appRouter.createCaller(createAdminContext());
    await expect(
      caller.agentHub.bootstrapContinuationControl({
        taskUid: "bh5jRHZ5ZcqgSaCtVr8uax",
      })
    ).resolves.toEqual(persistedControl);
    expect(continuationMocks.bootstrapContinuationControl).toHaveBeenCalledWith(
      "bh5jRHZ5ZcqgSaCtVr8uax"
    );
  });
});
