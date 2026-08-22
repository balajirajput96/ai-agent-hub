import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const chatSessions = mysqlTable("chat_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  role: varchar("role", { length: 50 }).notNull(), // 'user' | 'assistant' | 'system' | 'tool'
  content: text("content").notNull(),
  toolCalls: text("toolCalls"), // JSON string of tool calls made
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const agentToolLogs = mysqlTable("agent_tool_logs", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  toolName: varchar("toolName", { length: 100 }).notNull(),
  inputArgs: text("inputArgs").notNull(),
  outputResult: text("outputResult"),
  status: varchar("status", { length: 50 }).notNull(), // 'success' | 'error' | 'running'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export const chatAttachments = mysqlTable("chat_attachments", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  fileSize: int("fileSize").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentToolLog = typeof agentToolLogs.$inferSelect;
export type InsertAgentToolLog = typeof agentToolLogs.$inferInsert;
export type ChatAttachment = typeof chatAttachments.$inferSelect;
export type InsertChatAttachment = typeof chatAttachments.$inferInsert;

/**
 * Immutable delivery receipts for the owner’s read-only GitHub and Drive summary.
 * Entries are written only by an approved server-side reporting path; the dashboard
 * exposes a scoped list query and never a write control.
 */
export const dailyReportHistory = mysqlTable("daily_report_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  reportType: varchar("reportType", { length: 100 }).notNull(),
  sourceScope: varchar("sourceScope", { length: 255 }).notNull(),
  summary: text("summary").notNull(),
  status: varchar("status", { length: 32 }).default("delivered").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyReportHistory = typeof dailyReportHistory.$inferSelect;
export type InsertDailyReportHistory = typeof dailyReportHistory.$inferInsert;

/**
 * Owner-managed configuration for the bounded website continuation loop.
 * This table has no user-facing write path; the project owner creates and
 * maintains the associated Heartbeat job through approved project controls.
 */
export const continuationControls = mysqlTable("continuation_controls", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  maxCycles: int("maxCycles").default(2400).notNull(),
  completedCycles: int("completedCycles").default(0).notNull(),
  lastCycleAt: timestamp("lastCycleAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Immutable, non-secret records for each website-based continuation attempt.
 * The per-hour idempotency key prevents platform retries from consuming an
 * additional cycle.
 */
export const continuationCycles = mysqlTable("continuation_cycles", {
  id: int("id").autoincrement().primaryKey(),
  controlId: int("controlId").notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 64 }).notNull().unique(),
  executionNumber: int("executionNumber").notNull(),
  triggeredByTaskUid: varchar("triggeredByTaskUid", { length: 65 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  result: varchar("result", { length: 32 }).notNull(),
  failureCategory: varchar("failureCategory", { length: 100 }),
  recoveryAttempt: int("recoveryAttempt").default(0).notNull(),
  validationStatus: varchar("validationStatus", { length: 100 }).notNull(),
  remainingBlocker: text("remainingBlocker"),
  nextRecommendedAction: text("nextRecommendedAction"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContinuationControl = typeof continuationControls.$inferSelect;
export type ContinuationCycle = typeof continuationCycles.$inferSelect;

/**
 * Owner-scoped, non-secret production catalog for the Hindi research-reels
 * pipeline. It stores editorial evidence and progress, not media bytes or
 * provider credentials.
 */
export const reelCatalog = mysqlTable("reel_catalog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  reelNumber: int("reelNumber").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  topic: varchar("topic", { length: 255 }).notNull(),
  status: mysqlEnum("status", [
    "research_ready",
    "script_ready",
    "media_blocked",
    "qc_pending",
    "qc_passed",
    "uploaded",
    "failed",
  ])
    .default("research_ready")
    .notNull(),
  evidenceSummary: text("evidenceSummary").notNull(),
  scriptText: text("scriptText").notNull(),
  captionText: text("captionText").notNull(),
  visualPlan: text("visualPlan").notNull(),
  driveFolderId: varchar("driveFolderId", { length: 128 }),
  sourceRecordPath: varchar("sourceRecordPath", { length: 512 }).notNull(),
  lastBlocker: text("lastBlocker"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const reelAssets = mysqlTable("reel_assets", {
  id: int("id").autoincrement().primaryKey(),
  reelId: int("reelId").notNull(),
  assetType: mysqlEnum("assetType", [
    "research",
    "script",
    "captions",
    "voice",
    "music",
    "video",
    "thumbnail",
    "metadata",
  ]).notNull(),
  storageProvider: mysqlEnum("storageProvider", [
    "drive",
    "project_storage",
  ]).notNull(),
  storageReference: text("storageReference").notNull(),
  verificationStatus: mysqlEnum("verificationStatus", [
    "pending",
    "verified",
    "failed",
  ])
    .default("pending")
    .notNull(),
  verificationNote: text("verificationNote"),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReelCatalog = typeof reelCatalog.$inferSelect;
export type InsertReelCatalog = typeof reelCatalog.$inferInsert;
export type ReelAsset = typeof reelAssets.$inferSelect;

export const fbProfiles = mysqlTable("fb_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fullName: text("fullName"),
  profileUrl: text("profileUrl"),
  currentBio: text("currentBio"),
  proposedBio: text("proposedBio"),
  targetPositioning: text("targetPositioning"),
  avatarStatus: varchar("avatarStatus", { length: 64 }).default("needs_review"),
  coverStatus: varchar("coverStatus", { length: 64 }).default("needs_review"),
  privacyStatus: varchar("privacyStatus", { length: 64 }).default(
    "review_pending"
  ),
  overallStatus: varchar("overallStatus", { length: 64 }).default("auditing"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const fbCertificates = mysqlTable("fb_certificates", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  originalTitle: text("originalTitle").notNull(),
  translatedTitle: text("translatedTitle").notNull(),
  sourcePlatform: varchar("sourcePlatform", { length: 64 }).default("Coursera"),
  isRelevant: boolean("isRelevant").default(true).notNull(),
  isDisplayed: boolean("isDisplayed").default(true).notNull(),
  duplicateOf: text("duplicateOf"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const fbAuditSteps = mysqlTable("fb_audit_steps", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  stepNumber: int("stepNumber").notNull(),
  stepTitle: varchar("stepTitle", { length: 255 }).notNull(),
  status: varchar("status", { length: 64 }).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const fbActionApprovals = mysqlTable("fb_action_approvals", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  actionType: varchar("actionType", { length: 64 }).notNull(),
  description: text("description").notNull(),
  proposedContent: text("proposedContent").notNull(),
  status: varchar("status", { length: 64 })
    .default("pending_approval")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const fbVerifiedFacts = mysqlTable("fb_verified_facts", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  factCategory: varchar("factCategory", { length: 64 }).notNull(),
  factTitle: text("factTitle").notNull(),
  factDetails: text("factDetails").notNull(),
  sourceDocument: text("sourceDocument"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const fbSkills = mysqlTable("fb_skills", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  skillName: varchar("skillName", { length: 128 }).notNull(),
  category: varchar("category", { length: 64 }).default("Technical"),
  isHighlighted: boolean("isHighlighted").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const fbPrivacyChecklist = mysqlTable("fb_privacy_checklist", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  itemTitle: text("itemTitle").notNull(),
  description: text("description").notNull(),
  recommendedSetting: varchar("recommendedSetting", { length: 128 }).notNull(),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
