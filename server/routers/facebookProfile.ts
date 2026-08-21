import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  fbActionApprovals,
  fbAuditSteps,
  fbCertificates,
  fbPrivacyChecklist,
  fbProfiles,
  fbSkills,
  fbVerifiedFacts,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import {
  canResolveApproval,
  getApprovalRequestBlocker,
} from "../services/facebookProfilePolicy";

async function ownProfile(userId: number, fullName?: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select()
    .from(fbProfiles)
    .where(eq(fbProfiles.userId, userId))
    .limit(1);
  if (existing[0]) return { db, profile: existing[0] };
  await db.insert(fbProfiles).values({
    userId,
    fullName: fullName ?? null,
    overallStatus: "evidence_needed",
    targetPositioning: "Professional review pending verified facts.",
  });
  const created = await db
    .select()
    .from(fbProfiles)
    .where(eq(fbProfiles.userId, userId))
    .limit(1);
  if (!created[0]) throw new Error("Profile could not be created");
  return { db, profile: created[0] };
}

export const facebookProfileRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const { db, profile } = await ownProfile(ctx.user.id, ctx.user.name);
    const [facts, skills, actions, certificates, privacy, steps] =
      await Promise.all([
        db
          .select()
          .from(fbVerifiedFacts)
          .where(eq(fbVerifiedFacts.profileId, profile.id)),
        db.select().from(fbSkills).where(eq(fbSkills.profileId, profile.id)),
        db
          .select()
          .from(fbActionApprovals)
          .where(eq(fbActionApprovals.profileId, profile.id)),
        db
          .select()
          .from(fbCertificates)
          .where(eq(fbCertificates.profileId, profile.id)),
        db
          .select()
          .from(fbPrivacyChecklist)
          .where(eq(fbPrivacyChecklist.profileId, profile.id)),
        db
          .select()
          .from(fbAuditSteps)
          .where(eq(fbAuditSteps.profileId, profile.id)),
      ]);
    return { profile, facts, skills, actions, certificates, privacy, steps };
  }),
  updateBio: protectedProcedure
    .input(z.object({ proposedBio: z.string().trim().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const { db, profile } = await ownProfile(ctx.user.id, ctx.user.name);
      await db
        .update(fbProfiles)
        .set({ proposedBio: input.proposedBio })
        .where(eq(fbProfiles.id, profile.id));
      return { success: true };
    }),
  requestBioApproval: protectedProcedure.mutation(async ({ ctx }) => {
    const { db, profile } = await ownProfile(ctx.user.id, ctx.user.name);
    const facts = await db
      .select()
      .from(fbVerifiedFacts)
      .where(eq(fbVerifiedFacts.profileId, profile.id))
      .limit(1);
    const pendingActions = await db
      .select()
      .from(fbActionApprovals)
      .where(
        and(
          eq(fbActionApprovals.profileId, profile.id),
          eq(fbActionApprovals.actionType, "bio_update"),
          eq(fbActionApprovals.status, "pending_approval")
        )
      )
      .limit(1);
    const proposedBio = profile.proposedBio?.trim() || null;
    const blocker = getApprovalRequestBlocker({
      hasEvidence: Boolean(facts[0]),
      proposedBio,
      hasPendingBioApproval: Boolean(pendingActions[0]),
    });
    if (blocker) throw new Error(blocker);
    await db.insert(fbActionApprovals).values({
      profileId: profile.id,
      actionType: "bio_update",
      description: "Apply proposed professional bio manually in Facebook",
      proposedContent: proposedBio!,
      status: "pending_approval",
    });
    return { success: true };
  }),
  approveAction: protectedProcedure
    .input(
      z.object({
        actionId: z.number().int().positive(),
        status: z.enum(["approved", "rejected"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, profile } = await ownProfile(ctx.user.id, ctx.user.name);
      const [action] = await db
        .select()
        .from(fbActionApprovals)
        .where(
          and(
            eq(fbActionApprovals.id, input.actionId),
            eq(fbActionApprovals.profileId, profile.id)
          )
        )
        .limit(1);
      if (!action) throw new Error("Manual review request not found");
      if (!canResolveApproval(action.status)) {
        throw new Error("Only pending manual review requests can be resolved");
      }
      await db
        .update(fbActionApprovals)
        .set({ status: input.status })
        .where(
          and(
            eq(fbActionApprovals.id, input.actionId),
            eq(fbActionApprovals.profileId, profile.id)
          )
        );
      return { success: true };
    }),
  addVerifiedFact: protectedProcedure
    .input(
      z.object({
        factCategory: z.string().trim().min(1).max(64),
        factTitle: z.string().trim().min(1).max(500),
        factDetails: z.string().trim().min(1).max(3000),
        sourceDocument: z.string().trim().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, profile } = await ownProfile(ctx.user.id, ctx.user.name);
      await db.insert(fbVerifiedFacts).values({
        profileId: profile.id,
        factCategory: input.factCategory,
        factTitle: input.factTitle,
        factDetails: input.factDetails,
        sourceDocument: input.sourceDocument || null,
      });
      return { success: true };
    }),
  addSkill: protectedProcedure
    .input(
      z.object({
        skillName: z.string().trim().min(1).max(128),
        category: z.string().trim().min(1).max(64),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, profile } = await ownProfile(ctx.user.id, ctx.user.name);
      const duplicate = await db
        .select()
        .from(fbSkills)
        .where(
          and(
            eq(fbSkills.profileId, profile.id),
            eq(fbSkills.skillName, input.skillName)
          )
        )
        .limit(1);
      if (!duplicate[0])
        await db.insert(fbSkills).values({
          profileId: profile.id,
          skillName: input.skillName,
          category: input.category,
          isHighlighted: true,
        });
      return { success: true, duplicate: Boolean(duplicate[0]) };
    }),
});
