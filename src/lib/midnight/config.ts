export type NetworkId = "preview" | "preprod" | "undeployed" | "mainnet";

const env = import.meta.env;

export const NETWORK_ID = ((env["VITE_NETWORK_ID"] as string) ?? "preview") as NetworkId;
export const INDEXER_URL = (env["VITE_INDEXER_URL"] as string) ?? "";
export const INDEXER_WS_URL = (env["VITE_INDEXER_WS_URL"] as string) ?? "";
export const PROOF_SERVER_URL = (env["VITE_PROOF_SERVER_URL"] as string) ?? "http://localhost:6300";
export const CONTRACT_ADDRESS = (env["VITE_DEFAULT_CONTRACT"] as string) ?? "";
export const EXPLORER_URL = (env["VITE_EXPLORER_URL"] as string) ?? "";

export const NETWORK_LABEL: Record<NetworkId, string> = {
  preview: "Midnight Preview",
  preprod: "Midnight Preprod",
  undeployed: "Local dev chain",
  mainnet: "Midnight Mainnet",
};

/**
 * Midnight mode requires a deployed contract plus indexer endpoints.
 * Anything less falls back to clearly-labeled demo mode.
 */
export function isMidnightConfigured(): boolean {
  return Boolean(CONTRACT_ADDRESS && INDEXER_URL && INDEXER_WS_URL && PROOF_SERVER_URL);
}

export function explorerTxUrl(txId: string): string | null {
  if (!EXPLORER_URL) return null;
  return `${EXPLORER_URL.replace(/\/$/, "")}/tx/${txId}`;
}

export function shorten(value: string, lead = 6, tail = 4): string {
  if (!value) return "";
  if (value.length <= lead + tail + 3) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}
