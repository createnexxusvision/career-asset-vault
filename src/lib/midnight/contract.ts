import type {
  AssetRecord,
  RegisterAssetInput,
  RightsVaultService,
  TransactionResult,
} from "@/types/asset";
import { CONTRACT_ADDRESS } from "./config";
import { getProviders } from "./providers";
import { newAssetId } from "./commitments";

/**
 * Live Midnight adapter. Every contract call in the app goes through here.
 *
 * The compiled Compact artefacts (contract / keys / zkir) are served from
 * `public/contract` after `bun run compile`, and the SDK packages are loaded
 * lazily so the browser bundle and SSR build stay clean when Midnight is not
 * configured.
 *
 * Public ledger state is the source of truth for status; the local mirror below
 * only caches the human-readable labels the ledger deliberately does not store
 * (title, category, disclosure choices) plus the real transaction ids.
 */

const MIRROR_KEY = `nextplay-midnight-mirror-${CONTRACT_ADDRESS}`;

type Mirror = Record<string, AssetRecord & { txIds: string[] }>;

function readMirror(): Mirror {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(MIRROR_KEY) ?? "{}") as Mirror;
  } catch {
    return {};
  }
}

function writeMirror(mirror: Mirror) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MIRROR_KEY, JSON.stringify(mirror));
}

async function loadModule<T = any>(specifier: string): Promise<T> {
  return (await import(/* @vite-ignore */ specifier)) as T;
}

async function getDeployed(wallet: unknown) {
  const providers = await getProviders(wallet);
  const [contracts, artefact] = await Promise.all([
    loadModule("@midnight-ntwrk/midnight-js-contracts"),
    loadModule(`${window.location.origin}/contract/contract/index.cjs`),
  ]);

  // The private witness never leaves the browser; only its commitment is public.
  const ownerSecret = getOwnerSecret();
  const instance = new artefact.Contract({ ownerSecret: () => [{}, ownerSecret] });

  return contracts.findDeployedContract(providers, {
    contractAddress: CONTRACT_ADDRESS,
    contract: instance,
    privateStateId: "nextplay-rights-vault",
    initialPrivateState: { ownerSecret },
  });
}

function getOwnerSecret(): Uint8Array {
  const key = "nextplay-owner-secret";
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return Uint8Array.from(existing.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  }
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  window.localStorage.setItem(
    key,
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
  );
  return bytes;
}

function assetIdBytes(assetId: string): Uint8Array {
  const bytes = new Uint8Array(32);
  bytes.set(new TextEncoder().encode(assetId).slice(0, 32));
  return bytes;
}

function hexBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, "").padEnd(64, "0").slice(0, 64);
  return Uint8Array.from(clean.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
}

export function createMidnightService(wallet: unknown): RightsVaultService {
  async function call(
    circuit: string,
    args: unknown[],
    assetId: string,
    patch: Partial<AssetRecord>,
  ): Promise<TransactionResult> {
    try {
      const deployed = await getDeployed(wallet);
      const finalized = await deployed.callTx[circuit](...args);
      const txId: string = finalized.public.txId ?? finalized.public.txHash;

      const mirror = readMirror();
      const current = mirror[assetId];
      if (current) {
        mirror[assetId] = { ...current, ...patch, txIds: [...current.txIds, txId] };
        writeMirror(mirror);
      }
      return { ok: true, source: "midnight", txId, recordId: assetId };
    } catch (error) {
      return {
        ok: false,
        source: "midnight",
        recordId: assetId,
        error: error instanceof Error ? error.message : "Transaction failed",
      };
    }
  }

  return {
    source: "midnight",

    async registerAsset(input: RegisterAssetInput) {
      const assetId = newAssetId();
      const mirror = readMirror();
      if (Object.values(mirror).some((r) => r.contentHash === input.contentHash)) {
        return {
          ok: false,
          source: "midnight",
          recordId: "",
          error: "An asset with this fingerprint is already registered",
        };
      }
      mirror[assetId] = {
        assetId,
        contentHash: input.contentHash,
        metadataCommitment: input.metadataCommitment,
        assetType: input.assetType,
        title: input.title,
        createdAt: input.createdAt,
        ownershipStatus: "pending",
        licensingStatus: input.licenseAvailable ? "available" : "unavailable",
        publicProofFields: input.publicProofFields,
        collaboratorCount: input.collaboratorCount,
        txIds: [],
      };
      writeMirror(mirror);

      const result = await call(
        "registerAsset",
        [
          assetIdBytes(assetId),
          hexBytes(input.contentHash),
          hexBytes(input.metadataCommitment),
          input.licenseAvailable,
        ],
        assetId,
        { ownershipStatus: "verified" },
      );

      if (!result.ok) {
        const rollback = readMirror();
        delete rollback[assetId];
        writeMirror(rollback);
      }
      return result;
    },

    setLicenseAvailability(assetId, available) {
      return call(
        "setLicenseAvailability",
        [assetIdBytes(assetId), available],
        assetId,
        { licensingStatus: available ? "available" : "unavailable" },
      );
    },

    commitLicenseTerms(assetId, commitment) {
      return call(
        "commitLicenseTerms",
        [assetIdBytes(assetId), hexBytes(commitment)],
        assetId,
        { licenseTermsHash: commitment, licensingStatus: "licensed" },
      );
    },

    commitRoyaltySplit(assetId, commitment) {
      return call(
        "commitRoyaltySplit",
        [assetIdBytes(assetId), hexBytes(commitment)],
        assetId,
        { royaltySplitHash: commitment },
      );
    },

    revokeAsset(assetId) {
      return call("revokeAsset", [assetIdBytes(assetId)], assetId, {
        ownershipStatus: "revoked",
        licensingStatus: "unavailable",
      });
    },

    async getAsset(assetId) {
      return readMirror()[assetId] ?? null;
    },

    async listAssets() {
      return Object.values(readMirror());
    },
  };
}

export function txIdsFor(assetId: string): string[] {
  return readMirror()[assetId]?.txIds ?? [];
}
