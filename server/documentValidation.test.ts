import { describe, expect, it } from "vitest";
import { decodeDocumentPayload, isAllowedDocument } from "./services/documentValidation";

describe("document validation", () => {
  it("accepts matching allow-listed document metadata and canonical FileReader payloads", () => {
    expect(isAllowedDocument("notes.md", "text/markdown")).toBe(true);
    expect(decodeDocumentPayload("data:text/plain;base64,SGVsbG8=", "text/plain").toString()).toBe("Hello");
  });

  it("rejects mismatched, malformed, and empty document payloads", () => {
    expect(isAllowedDocument("notes.exe", "text/plain")).toBe(false);
    expect(() => decodeDocumentPayload("data:text/plain;base64,not valid!", "text/plain")).toThrow("document payload is invalid");
    expect(() => decodeDocumentPayload("data:text/plain;base64,", "text/plain")).toThrow("selected document is empty");
  });
});
