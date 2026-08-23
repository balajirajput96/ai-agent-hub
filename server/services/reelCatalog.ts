import { and, desc, eq } from "drizzle-orm";
import {
  reelCatalog,
  reelProductionControls,
  reelRetryQueue,
} from "../../drizzle/schema";
import { getDb } from "../db";

export const REEL_0001_SOURCE_RECORD = "reels/REEL_0001_RESEARCH.md";
export const REEL_0001_DRIVE_FOLDER_ID = "1585_x-GJem9bYkk31DkGGBwnAI_TXCep";
export const REEL_TARGET = 3000;
export const REELS_PER_BATCH = 30;

export function getBatchNumber(reelNumber: number) {
  if (!Number.isInteger(reelNumber) || reelNumber < 1)
    throw new Error("Reel number must be a positive integer");
  return Math.ceil(reelNumber / REELS_PER_BATCH);
}

export function getReelUniqueKey(title: string, topic: string) {
  return `${topic} ${title}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 255);
}

export function getNextEligibleReelNumber(
  reels: Array<{ reelNumber: number; status: string }>,
  targetReels = REEL_TARGET
) {
  const pending = [...reels]
    .filter(reel => reel.status !== "uploaded")
    .sort((left, right) => left.reelNumber - right.reelNumber)[0];
  if (pending) return pending.reelNumber;
  const highest = reels.reduce(
    (max, reel) => Math.max(max, reel.reelNumber),
    0
  );
  return Math.min(highest + 1, targetReels);
}

export function getQueuedRetryCountForOwner(
  retryRows: Array<{
    reel_retry_queue: { status: string };
    reel_catalog: { userId: number };
  }>,
  userId: number
) {
  return retryRows.filter(
    row =>
      row.reel_retry_queue.status === "queued" &&
      row.reel_catalog.userId === userId
  ).length;
}

export const REEL_0001 = {
  reelNumber: 1,
  title: "आदत 21 दिन में नहीं बनती: सही cue क्यों ज़रूरी है",
  topic: "Habit formation, context cues, and automaticity",
  status: "script_ready" as const,
  evidenceSummary:
    "Peer-reviewed and university sources support repeated behaviour in stable contexts as a route to automaticity, while the popular 21-day and fixed-66-day rules are oversimplifications. Timing varies substantially by person and behaviour.",
  scriptText:
    "क्या हर आदत सिर्फ 21 दिन में बन जाती है? नहीं। ‘66 दिन’ भी कोई universal deadline नहीं है। शोध में लोगों और आदतों के बीच बहुत फर्क मिला। असली संकेत यह है: छोटा काम चुनिए, और उसे एक stable cue से जोड़िए। जैसे—नाश्ते के बाद एक गिलास पानी। वही cue, वही छोटा action, बार-बार। लक्ष्य perfection नहीं; repetition है। एक दिन छूट जाए तो experiment खत्म नहीं होता—अगले cue पर फिर शुरू कीजिए। इसलिए calendar को नहीं, अपने environment को design कीजिए।",
  captionText:
    "21 दिन कोई rule नहीं। 66 दिन भी universal deadline नहीं। छोटा action + stable cue + repeat. एक दिन छूटे? अगले cue पर फिर शुरू करें.",
  visualPlan: JSON.stringify({
    format: "9:16",
    durationSeconds: 60,
    narrationLanguage: "hi-IN",
    captionLanguage: "Hindi",
    visualStyle:
      "Cinematic scientific motion graphics with warm human scenes, a realistic daily kitchen cue, abstract neural-association animation, and clean Hindi-caption safe zones. No text baked into AI imagery.",
    scenes: [
      {
        seconds: "00-07",
        purpose: "Hook",
        visual:
          "Calendar pages marked 21 and 66 dissolve into a question mark beside a thoughtful person.",
      },
      {
        seconds: "07-17",
        purpose: "Evidence correction",
        visual:
          "A flexible timeline expands and contracts; diverse everyday routines appear along it.",
      },
      {
        seconds: "17-32",
        purpose: "Mechanism",
        visual:
          "Breakfast table cue transforms into a water-glass action; subtle neural pathways brighten with repetition.",
      },
      {
        seconds: "32-48",
        purpose: "Practical example",
        visual:
          "Same breakfast cue, same glass of water, repeated across calm morning cuts.",
      },
      {
        seconds: "48-60",
        purpose: "Caveat and close",
        visual:
          "One missed day fades gently; the next morning resumes the action, ending on a cue-action loop.",
      },
    ],
  }),
  driveFolderId: REEL_0001_DRIVE_FOLDER_ID,
  sourceRecordPath: REEL_0001_SOURCE_RECORD,
  lastBlocker:
    "Media generation is pending available generation capacity; no video asset is represented as completed before visual, narration, caption, and Drive verification pass.",
};

export async function getUserReels(userId: number, limit: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(reelCatalog)
    .where(eq(reelCatalog.userId, userId))
    .orderBy(desc(reelCatalog.reelNumber))
    .limit(limit);
}

export async function getReelProductionStatus(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [control] = await db
    .select()
    .from(reelProductionControls)
    .where(eq(reelProductionControls.userId, userId))
    .limit(1);
  const reels = await db
    .select()
    .from(reelCatalog)
    .where(eq(reelCatalog.userId, userId))
    .orderBy(desc(reelCatalog.reelNumber));
  const retryItems = await db
    .select()
    .from(reelRetryQueue)
    .innerJoin(reelCatalog, eq(reelRetryQueue.reelId, reelCatalog.id))
    .where(
      and(eq(reelRetryQueue.status, "queued"), eq(reelCatalog.userId, userId))
    );
  const completedReels = reels.filter(
    reel => reel.status === "uploaded"
  ).length;
  const researchReadyReels = reels.filter(
    reel => reel.status === "research_ready" || reel.status === "script_ready"
  ).length;
  const mediaBlockedReels = reels.filter(
    reel => reel.status === "media_blocked"
  ).length;
  const nextReelNumber = getNextEligibleReelNumber(reels);

  return {
    targetReels: control?.targetReels ?? REEL_TARGET,
    batchSize: control?.batchSize ?? REELS_PER_BATCH,
    completedReels,
    researchReadyReels,
    mediaBlockedReels,
    retryQueuedReels: getQueuedRetryCountForOwner(retryItems, userId),
    currentBatchNumber: getBatchNumber(nextReelNumber),
    nextReelNumber,
    currentCapacityBoundary: control?.currentCapacityBoundary ?? null,
  };
}

export async function bootstrapReelProductionControl(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [existing] = await db
    .select()
    .from(reelProductionControls)
    .where(eq(reelProductionControls.userId, userId))
    .limit(1);
  if (existing) return getReelProductionStatus(userId);

  const reels = await db
    .select()
    .from(reelCatalog)
    .where(eq(reelCatalog.userId, userId));
  const nextReelNumber = getNextEligibleReelNumber(reels);
  await db.insert(reelProductionControls).values({
    userId,
    targetReels: REEL_TARGET,
    batchSize: REELS_PER_BATCH,
    currentBatchNumber: getBatchNumber(nextReelNumber),
    nextReelNumber,
    completedReels: reels.filter(reel => reel.status === "uploaded").length,
    researchReadyReels: reels.filter(
      reel => reel.status === "research_ready" || reel.status === "script_ready"
    ).length,
    mediaBlockedReels: reels.filter(reel => reel.status === "media_blocked")
      .length,
    currentCapacityBoundary:
      "Native video generation reached the free-plan daily limit after Reel 0001. Reel 0002 remains research-ready and must enter the retry queue before media work resumes.",
  });
  return getReelProductionStatus(userId);
}

export async function bootstrapReel0001(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [existing] = await db
    .select()
    .from(reelCatalog)
    .where(
      and(
        eq(reelCatalog.userId, userId),
        eq(reelCatalog.reelNumber, REEL_0001.reelNumber)
      )
    )
    .limit(1);
  if (existing) return existing;

  const [inserted] = await db.insert(reelCatalog).values({
    userId,
    ...REEL_0001,
  });
  const [created] = await db
    .select()
    .from(reelCatalog)
    .where(eq(reelCatalog.id, Number(inserted.insertId)))
    .limit(1);
  if (!created) throw new Error("Reel 0001 catalog record was not created");
  return created;
}
