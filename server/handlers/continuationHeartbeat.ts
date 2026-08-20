import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { runHourlyContinuation } from "../services/continuationDb";

export async function continuationHeartbeat(req: Request, res: Response) {
  let taskUid: string | undefined;
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }
    taskUid = user.taskUid;
  } catch {
    return res.status(403).json({ error: "cron-only" });
  }

  try {
    const result = await runHourlyContinuation(taskUid);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      context: { path: req.path },
      timestamp: new Date().toISOString(),
    });
  }
}
