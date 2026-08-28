/**
 * All hashing happens locally in the browser. Raw files, private terms and
 * collaborator identities never leave the device — only commitments do.
 */

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256Hex(data: ArrayBuffer | string): Promise<string> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `0x${toHex(digest)}`;
}

export async function hashFile(file: File): Promise<string> {
  return sha256Hex(await file.arrayBuffer());
}

/** Stable stringify so the same object always yields the same commitment. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`).join(",")}}`;
}

export async function commit(value: unknown): Promise<string> {
  return sha256Hex(canonicalize(value));
}

export function newAssetId(): string {
  return `asset_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}
