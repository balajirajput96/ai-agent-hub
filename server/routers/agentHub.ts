import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { storageGetSignedUrl, storagePut } from "../storage";
import { getDb } from "../db";
import { chatAttachments, chatSessions } from "../../drizzle/schema";
import * as chatDb from "../services/chatDb";
import * as agentTools from "../services/agentTools";

const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
]);

function isAllowedDocument(fileName: string, mimeType: string) {
  const extension = fileName.toLowerCase().split(".").pop();
  return ALLOWED_DOCUMENT_TYPES.has(mimeType) && ["pdf", "txt", "md", "csv", "json"].includes(extension || "");
}

async function requireOwnedSession(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [session] = await db
    .select()
    .from(chatSessions)
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
    .limit(1);

  if (!session) throw new Error("Session not found or unauthorized");
  return { db, session };
}

export const agentHubRouter = router({
  getSessions: protectedProcedure.query(async ({ ctx }) => chatDb.getUserSessions(ctx.user.id)),

  createSession: protectedProcedure
    .input(z.object({ title: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => chatDb.createSession(ctx.user.id, input.title)),

  getMessages: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      await requireOwnedSession(input.sessionId, ctx.user.id);
      return chatDb.getSessionMessages(input.sessionId);
    }),

  getToolLogs: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      await requireOwnedSession(input.sessionId, ctx.user.id);
      return chatDb.getSessionToolLogs(input.sessionId);
    }),

  getAttachments: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { db } = await requireOwnedSession(input.sessionId, ctx.user.id);
      return db
        .select()
        .from(chatAttachments)
        .where(and(eq(chatAttachments.sessionId, input.sessionId), eq(chatAttachments.userId, ctx.user.id)))
        .orderBy(desc(chatAttachments.createdAt));
    }),

  uploadAttachment: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      fileName: z.string().min(1).max(255),
      fileBase64: z.string().min(1),
      mimeType: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db } = await requireOwnedSession(input.sessionId, ctx.user.id);
      if (!isAllowedDocument(input.fileName, input.mimeType)) {
        throw new Error("Only PDF, TXT, MD, CSV, and JSON documents can be uploaded.");
      }

      const rawBase64 = input.fileBase64.replace(/^data:[^;]+;base64,/, "");
      const documentBytes = Buffer.from(rawBase64, "base64");
      if (documentBytes.length === 0) throw new Error("The selected document is empty.");
      if (documentBytes.length > MAX_DOCUMENT_BYTES) throw new Error("Documents must be 8 MB or smaller.");

      const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const upload = await storagePut(
        `chat-attachments/${ctx.user.id}/${input.sessionId}/${Date.now()}-${safeFileName}`,
        documentBytes,
        input.mimeType,
      );
      const [inserted] = await db.insert(chatAttachments).values({
        sessionId: input.sessionId,
        userId: ctx.user.id,
        fileName: safeFileName,
        fileUrl: upload.url,
        fileKey: upload.key,
        fileSize: documentBytes.length,
      });

      return {
        id: Number(inserted.insertId),
        fileName: safeFileName,
        fileUrl: upload.url,
        fileSize: documentBytes.length,
      };
    }),

  checkHealth: protectedProcedure.query(() => agentTools.checkIntegrationsHealth()),

  sendMessage: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      message: z.string().min(1),
      useAgent: z.boolean().default(true),
      attachmentId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { sessionId, message, useAgent, attachmentId } = input;
      const { db } = await requireOwnedSession(sessionId, ctx.user.id);

      let attachment: typeof chatAttachments.$inferSelect | undefined;
      let signedAttachmentUrl: string | undefined;
      if (attachmentId) {
        const [storedAttachment] = await db
          .select()
          .from(chatAttachments)
          .where(and(
            eq(chatAttachments.id, attachmentId),
            eq(chatAttachments.sessionId, sessionId),
            eq(chatAttachments.userId, ctx.user.id),
          ))
          .limit(1);
        if (!storedAttachment) throw new Error("Attachment not found or unauthorized");
        attachment = storedAttachment;
        signedAttachmentUrl = await storageGetSignedUrl(storedAttachment.fileKey);
      }

      const messageWithAttachment = attachment
        ? `${message}\n\n[Attached document: ${attachment.fileName}. Use this document when answering the user's request.]`
        : message;

      await chatDb.addMessage({ sessionId, role: "user", content: messageWithAttachment });

      let assistantResponse = "";
      const executedTools: Array<{ tool: string; result: unknown }> = [];
      const lowerMessage = messageWithAttachment.toLowerCase();

      if (useAgent && (lowerMessage.includes("github") || lowerMessage.includes("repo"))) {
        const query = message.replace(/github|repo|search/gi, "").trim() || "ai agent";
        await chatDb.addToolLog({
          sessionId,
          toolName: "searchGitHubRepos",
          inputArgs: JSON.stringify({ query }),
          status: "running",
        });
        const result = await agentTools.searchGitHubRepos(query);
        executedTools.push({ tool: "searchGitHubRepos", result });
        await chatDb.addToolLog({
          sessionId,
          toolName: "searchGitHubRepos",
          inputArgs: JSON.stringify({ query }),
          outputResult: JSON.stringify(result),
          status: result.success ? "success" : "error",
        });

        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          const repositories = result.data.slice(0, 3).map((repo: any) =>
            `- **[${repo.full_name}](${repo.html_url})**: ${repo.description || "No description"} (⭐ ${repo.stargazers_count})`,
          ).join("\n");
          assistantResponse = `I searched GitHub for "${query}" and found:\n\n${repositories}`;
        }
      }

      if (!assistantResponse) {
        const history = await chatDb.getSessionMessages(sessionId);
        const llmMessages: any[] = history.map((entry) => ({
          role: entry.role as "user" | "assistant" | "system",
          content: entry.content,
        }));

        if (attachment && signedAttachmentUrl) {
          llmMessages[llmMessages.length - 1] = {
            role: "user",
            content: [
              { type: "text", text: messageWithAttachment },
              {
                type: "file_url",
                file_url: {
                  url: signedAttachmentUrl,
                  ...(attachment.fileName.toLowerCase().endsWith(".pdf") ? { mime_type: "application/pdf" } : {}),
                },
              },
            ],
          };
        }

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an advanced AI agent. You can analyze user-provided documents, provide evidence-based answers, and use GitHub and Hugging Face when relevant. Never claim to have read an attachment unless its contents are available in the supplied file context.",
            },
            ...llmMessages,
          ],
        });
        const rawContent = response.choices[0]?.message?.content;
        assistantResponse = typeof rawContent === "string" ? rawContent : "I could not produce a text response for this request.";
      }

      await chatDb.addMessage({
        sessionId,
        role: "assistant",
        content: assistantResponse,
        toolCalls: executedTools.length ? JSON.stringify(executedTools) : null,
      });
      return { reply: assistantResponse, toolCalls: executedTools };
    }),
});
