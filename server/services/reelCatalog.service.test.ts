import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({ getDb: vi.fn() }));

import { getDb } from "../db";
import { getReelProductionStatus } from "./reelCatalog";

type QueryRow = Record<string, unknown>;

function queryWithRows(rows: QueryRow[]) {
  const query = {
    from: vi.fn(),
    where: vi.fn(),
    innerJoin: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    then: <TResult1 = QueryRow[], TResult2 = never>(
      onfulfilled?:
        | ((value: QueryRow[]) => TResult1 | PromiseLike<TResult1>)
        | null,
      onrejected?:
        | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
        | null
    ) => Promise.resolve(rows).then(onfulfilled, onrejected),
  };
  query.from.mockReturnValue(query);
  query.where.mockReturnValue(query);
  query.innerJoin.mockReturnValue(query);
  query.orderBy.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  return query;
}

function databaseForOwner(ownerId: number) {
  const ownerReel = {
    id: ownerId * 10,
    userId: ownerId,
    reelNumber: 1,
    status: "script_ready",
  };
  const otherOwnerId = ownerId === 101 ? 202 : 101;
  const queries = [
    queryWithRows([]),
    queryWithRows([ownerReel]),
    queryWithRows([
      {
        reel_retry_queue: { status: "queued", reelId: ownerReel.id },
        reel_catalog: { userId: ownerId },
      },
      {
        reel_retry_queue: { status: "queued", reelId: otherOwnerId * 10 },
        reel_catalog: { userId: otherOwnerId },
      },
    ]),
  ];
  return {
    select: vi.fn(() => {
      const query = queries.shift();
      if (!query) throw new Error("Unexpected database select");
      return query;
    }),
  };
}

describe("reel production status ownership", () => {
  beforeEach(() => vi.mocked(getDb).mockReset());

  it("counts only the current owner’s queued retries in production status", async () => {
    vi.mocked(getDb).mockResolvedValue(databaseForOwner(101) as never);
    expect((await getReelProductionStatus(101)).retryQueuedReels).toBe(1);
    vi.mocked(getDb).mockResolvedValue(databaseForOwner(202) as never);
    expect((await getReelProductionStatus(202)).retryQueuedReels).toBe(1);
  });
});
