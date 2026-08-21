import { describe, expect, it } from "vitest";
import {
  canResolveApproval,
  getApprovalRequestBlocker,
} from "./facebookProfilePolicy";

describe("Facebook profile self-review policy", () => {
  it("requires user-provided evidence and a saved draft before a review request", () => {
    expect(
      getApprovalRequestBlocker({
        hasEvidence: false,
        proposedBio: "Accurate professional bio",
        hasPendingBioApproval: false,
      })
    ).toMatch(/evidence/i);
    expect(
      getApprovalRequestBlocker({
        hasEvidence: true,
        proposedBio: " ",
        hasPendingBioApproval: false,
      })
    ).toMatch(/Save a proposed bio/i);
  });

  it("allows one pending manual review request and only resolves pending actions", () => {
    expect(
      getApprovalRequestBlocker({
        hasEvidence: true,
        proposedBio: "Accurate professional bio",
        hasPendingBioApproval: true,
      })
    ).toMatch(/already pending/i);
    expect(
      getApprovalRequestBlocker({
        hasEvidence: true,
        proposedBio: "Accurate professional bio",
        hasPendingBioApproval: false,
      })
    ).toBeNull();
    expect(canResolveApproval("pending_approval")).toBe(true);
    expect(canResolveApproval("approved")).toBe(false);
    expect(canResolveApproval("rejected")).toBe(false);
  });
});
