import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { storageGetSignedUrl, storagePut } from "../storage";
import { getDb } from "../db";
import { chatAttachments, chatSessions } from "../../drizzle/schema";
import * as chatDb from "../services/chatDb";
import * as agentTools from "../services/agentTools";
import * as continuationDb from "../services/continuationDb";
import * as reelCatalogDb from "../services/reelCatalog";
import {
  decodeDocumentPayload,
  isAllowedDocument,
} from "../services/documentValidation";

const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;

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
  getSessions: protectedProcedure.query(({ ctx }) =>
    chatDb.getUserSessions(ctx.user.id)
  ),
  createSession: protectedProcedure
    .input(z.object({ title: z.string().min(1).max(255) }))
    .mutation(({ ctx, input }) =>
      chatDb.createSession(ctx.user.id, input.title)
    ),

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
        .where(
          and(
            eq(chatAttachments.sessionId, input.sessionId),
            eq(chatAttachments.userId, ctx.user.id)
          )
        )
        .orderBy(desc(chatAttachments.createdAt));
    }),
  getDailyReportHistory: protectedProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(25).default(12) })
        .optional()
    )
    .query(({ ctx, input }) => {
      return chatDb.getUserDailyReports(ctx.user.id, input?.limit ?? 12);
    }),
  getContinuationStatus: protectedProcedure.query(() =>
    continuationDb.getContinuationStatus()
  ),
  bootstrapContinuationControl: adminProcedure
    .input(
      z.object({
        taskUid: z.string().regex(/^[A-Za-z0-9_-]{8,65}$/),
      })
    )
    .mutation(({ input }) =>
      continuationDb.bootstrapContinuationControl(input.taskUid)
    ),
  getReelCatalog: protectedProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(50).default(12) })
        .optional()
    )
    .query(({ ctx, input }) =>
      reelCatalogDb.getUserReels(ctx.user.id, input?.limit ?? 12)
    ),
  bootstrapReel0001: adminProcedure.mutation(({ ctx }) =>
    reelCatalogDb.bootstrapReel0001(ctx.user.id)
  ),

  uploadAttachment: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        fileName: z.string().min(1).max(255),
        fileBase64: z.string().min(1),
        mimeType: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = await requireOwnedSession(input.sessionId, ctx.user.id);
      if (!isAllowedDocument(input.fileName, input.mimeType))
        throw new Error(
          "Only PDF, TXT, MD, CSV, and JSON documents can be uploaded."
        );
      const bytes = decodeDocumentPayload(input.fileBase64, input.mimeType);
      if (bytes.length > MAX_DOCUMENT_BYTES)
        throw new Error("Documents must be 8 MB or smaller.");
      const fileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const upload = await storagePut(
        `chat-attachments/${ctx.user.id}/${input.sessionId}/${Date.now()}-${fileName}`,
        bytes,
        input.mimeType
      );
      const [inserted] = await db.insert(chatAttachments).values({
        sessionId: input.sessionId,
        userId: ctx.user.id,
        fileName,
        fileUrl: upload.url,
        fileKey: upload.key,
        fileSize: bytes.length,
      });
      return {
        id: Number(inserted.insertId),
        fileName,
        fileUrl: upload.url,
        fileSize: bytes.length,
      };
    }),

  checkHealth: protectedProcedure.query(() =>
    agentTools.checkIntegrationsHealth()
  ),

  sendMessage: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        message: z.string().min(1),
        useAgent: z.boolean().default(true),
        attachmentId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = await requireOwnedSession(input.sessionId, ctx.user.id);
      let attachment: typeof chatAttachments.$inferSelect | undefined;
      let attachmentUrl: string | undefined;
      if (input.attachmentId) {
        const [stored] = await db
          .select()
          .from(chatAttachments)
          .where(
            and(
              eq(chatAttachments.id, input.attachmentId),
              eq(chatAttachments.sessionId, input.sessionId),
              eq(chatAttachments.userId, ctx.user.id)
            )
          )
          .limit(1);
        if (!stored) throw new Error("Attachment not found or unauthorized");
        attachment = stored;
        attachmentUrl = await storageGetSignedUrl(stored.fileKey);
      }

      const userContent = attachment
        ? `${input.message}\n\n[Attached document: ${attachment.fileName}. Use it when answering the user's request.]`
        : input.message;
      await chatDb.addMessage({
        sessionId: input.sessionId,
        role: "user",
        content: userContent,
      });
      const tools: Array<{ tool: string; result: unknown }> = [];
      let reply = "";
      const lower = userContent.toLowerCase();

      if (
        input.useAgent &&
        (lower.includes("github") || lower.includes("repo"))
      ) {
        const query =
          input.message.replace(/github|repo|search/gi, "").trim() ||
          "ai agent";
        await chatDb.addToolLog({
          sessionId: input.sessionId,
          toolName: "searchGitHubRepos",
          inputArgs: JSON.stringify({ query }),
          status: "running",
        });
        const result = await agentTools.searchGitHubRepos(query);
        tools.push({ tool: "searchGitHubRepos", result });
        await chatDb.addToolLog({
          sessionId: input.sessionId,
          toolName: "searchGitHubRepos",
          inputArgs: JSON.stringify({ query }),
          outputResult: JSON.stringify(result),
          status: result.success ? "success" : "error",
        });
        if (
          result.success &&
          Array.isArray(result.data) &&
          result.data.length
        ) {
          reply = `I searched GitHub for "${query}" and found:\n\n${result.data
            .slice(0, 3)
            .map(
              (repo: any) =>
                `- **[${repo.full_name}](${repo.html_url})**: ${repo.description || "No description"} (⭐ ${repo.stargazers_count})`
            )
            .join("\n")}`;
        }
      }

      if (!reply) {
        const history = await chatDb.getSessionMessages(input.sessionId);
        const messages: any[] = history.map(entry => ({
          role: entry.role as "user" | "assistant" | "system",
          content: entry.content,
        }));
        if (attachment && attachmentUrl) {
          messages[messages.length - 1] = {
            role: "user",
            content: [
              { type: "text", text: userContent },
              {
                type: "file_url",
                file_url: {
                  url: attachmentUrl,
                  ...(attachment.fileName.endsWith(".pdf")
                    ? { mime_type: "application/pdf" }
                    : {}),
                },
              },
            ],
          };
        }
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are an advanced private AI agent. Use GitHub when relevant. Never claim to read an attachment unless its file context is supplied.",
            },
            ...messages,
          ],
        });
        const content = response.choices[0]?.message?.content;
        reply =
          typeof content === "string"
            ? content
            : "I could not produce a text response for this request.";
      }

      await chatDb.addMessage({
        sessionId: input.sessionId,
        role: "assistant",
        content: reply,
        toolCalls: tools.length ? JSON.stringify(tools) : null,
      });
      return { reply, toolCalls: tools };
    }),
});
