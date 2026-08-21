import { describe, expect, it } from "vitest";
import { CLIPBOARD_FALLBACK_MESSAGE } from "../client/src/lib/facebookProfileFeedback";

describe("Facebook profile clipboard feedback", () => {
  it("instructs the user how to recover when clipboard access is blocked", () => {
    expect(CLIPBOARD_FALLBACK_MESSAGE).toMatch(/copy it manually/i);
  });
});
