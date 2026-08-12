/**
 * Prevent transport, ORM, and process details from being shown directly in the
 * Chinese product interface. The server intentionally provides Chinese safe
 * messages; network-level failures need the same presentation boundary.
 */
export function toSafeChineseActionError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return /[\u4e00-\u9fff]/.test(message) ? message : fallback;
}
