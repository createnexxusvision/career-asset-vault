import type {
  AssetRecord,
  RegisterAssetInput,
  RightsVaultService,
  TransactionResult,
} from "@/types/asset";
import { newAssetId } from "@/lib/midnight/commitments";

const STORAGE_KEY = "nextplay-demo-assets";

function read(): AssetRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "[]") as AssetRecord[];
  } catch {
    return [];
  }
}

function write(records: AssetRecord[]) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function update(assetId: string, patch: Partial<AssetRecord>): TransactionResult {
  const records = read();
  const index = records.findIndex((r) => r.assetId === assetId);
  if (index === -1) {
    return { ok: false, source: "demo", recordId: assetId, error: "Asset not found" };
  }
  if (records[index].ownershipStatus === "revoked") {
    return { ok: false, source: "demo", recordId: assetId, error: "Asset is revoked" };
  }
  records[index] = { ...records[index], ...patch };
  write(records);
  // No txId is ever produced in demo mode — nothing was committed to Midnight.
  return { ok: true, source: "demo", recordId: assetId };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Clearly-labeled local fallback used only when Midnight is not configured.
 * It never fabricates a transaction hash.
 */
export function createDemoService(): RightsVaultService {
  return {
    source: "demo",

    async registerAsset(input: RegisterAssetInput) {
      await delay(900);
      const records = read();
      if (records.some((r) => r.contentHash === input.contentHash)) {
        return {
          ok: false,
          source: "demo",
          recordId: "",
          error: "An asset with this fingerprint is already registered",
        };
      }
      const record: AssetRecord = {
        assetId: newAssetId(),
        contentHash: input.contentHash,
        metadataCommitment: input.metadataCommitment,
        assetType: input.assetType,
        title: input.title,
        createdAt: input.createdAt,
        ownershipStatus: "pending",
        licensingStatus: input.licenseAvailable ? "available" : "unavailable",
        publicProofFields: input.publicProofFields,
        collaboratorCount: input.collaboratorCount,
      };
      write([record, ...records]);
      return { ok: true, source: "demo", recordId: record.assetId };
    },

    async setLicenseAvailability(assetId, available) {
      await delay(600);
      return update(assetId, { licensingStatus: available ? "available" : "unavailable" });
    },

    async commitLicenseTerms(assetId, commitment) {
      await delay(1200);
      return update(assetId, { licenseTermsHash: commitment, licensingStatus: "licensed" });
    },

    async commitRoyaltySplit(assetId, commitment) {
      await delay(900);
      return update(assetId, { royaltySplitHash: commitment });
    },

    async revokeAsset(assetId) {
      await delay(600);
      return update(assetId, {
        ownershipStatus: "revoked",
        licensingStatus: "unavailable",
      });
    },

    async getAsset(assetId) {
      return read().find((r) => r.assetId === assetId) ?? null;
    },

    async listAssets() {
      return read();
    },
  };
}
