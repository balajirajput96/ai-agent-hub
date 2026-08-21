export type ApprovalRequestInput = {
  hasEvidence: boolean;
  proposedBio: string | null | undefined;
  hasPendingBioApproval: boolean;
};

export function getApprovalRequestBlocker({
  hasEvidence,
  proposedBio,
  hasPendingBioApproval,
}: ApprovalRequestInput) {
  if (!hasEvidence) {
    return "Add evidence you provided before requesting a manual review.";
  }
  if (!proposedBio?.trim()) {
    return "Save a proposed bio before requesting a manual review.";
  }
  if (hasPendingBioApproval) {
    return "A manual review request for this bio is already pending.";
  }
  return null;
}

export function canResolveApproval(status: string) {
  return status === "pending_approval";
}
