import { eq, desc } from "drizzle-orm";
import { getDb } from "../db";
import {
  chatSessions,
  chatMessages,
  agentToolLogs,
  InsertChatSession,
  InsertChatMessage,
  InsertAgentToolLog,
} from "../../drizzle/schema";

export async function getUserSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.updatedAt));
}

export async function createSession(userId: number, title: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(chatSessions).values({ userId, title });
  const insertedId = (result as any).insertId;
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, insertedId));
  return session;
}

export async function getSessionMessages(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt);
}

export async function addMessage(data: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(chatMessages).values(data);
}

export async function getSessionToolLogs(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(agentToolLogs)
    .where(eq(agentToolLogs.sessionId, sessionId))
    .orderBy(desc(agentToolLogs.createdAt));
}

export async function addToolLog(data: InsertAgentToolLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(agentToolLogs).values(data);
}
