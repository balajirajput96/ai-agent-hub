const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
]);
const ALLOWED_DOCUMENT_EXTENSIONS = new Set(["pdf", "txt", "md", "csv", "json"]);

export function isAllowedDocument(fileName: string, mimeType: string) {
  const extension = fileName.toLowerCase().split(".").pop();
  return ALLOWED_DOCUMENT_TYPES.has(mimeType) && ALLOWED_DOCUMENT_EXTENSIONS.has(extension || "");
}

/** Validates FileReader data URLs before their bytes are accepted for private storage. */
export function decodeDocumentPayload(fileBase64: string, mimeType: string) {
  const prefix = `data:${mimeType};base64,`;
  if (!fileBase64.startsWith(prefix)) {
    throw new Error("The document payload is invalid. Please select the file again.");
  }

  const encoded = fileBase64.slice(prefix.length);
  const isCanonicalBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded);
  if (!isCanonicalBase64) {
    throw new Error("The document payload is invalid. Please select the file again.");
  }

  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length) {
    throw new Error("The selected document is empty.");
  }
  return bytes;
}
