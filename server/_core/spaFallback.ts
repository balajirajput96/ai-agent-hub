/**
 * Restrict the HTML fallback to browser navigation paths. API requests must
 * remain observable as API failures rather than receiving the client shell.
 */
export function isSpaFallbackPath(requestPath: string): boolean {
  return requestPath !== "/api" && !requestPath.startsWith("/api/");
}
