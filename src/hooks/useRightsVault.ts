import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AssetRecord,
  LicenseTerms,
  RegisterAssetInput,
  RightsVaultService,
  TransactionResult,
} from "@/types/asset";
import { isMidnightConfigured } from "@/lib/midnight/config";
import { createDemoService } from "@/lib/demoFallback";
import { createMidnightService } from "@/lib/midnight/contract";
import { commit } from "@/lib/midnight/commitments";

export type ProofPhase =
  | "idle"
  | "validating"
  | "proving"
  | "awaiting-wallet"
  | "submitting"
  | "confirming"
  | "success"
  | "error";

export type ProofProgress = {
  phase: ProofPhase;
  message?: string;
  result?: TransactionResult;
};

export function useRightsVault(wallet: unknown, walletConnected: boolean) {
  const live = isMidnightConfigured() && walletConnected;
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [progress, setProgress] = useState<ProofProgress>({ phase: "idle" });
  const serviceRef = useRef<RightsVaultService | null>(null);

  const service = useMemo<RightsVaultService>(() => {
    const next = live ? createMidnightService(wallet) : createDemoService();
    serviceRef.current = next;
    return next;
  }, [live, wallet]);

  const refresh = useCallback(async () => {
    setAssets(await service.listAssets());
  }, [service]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = useCallback(
    async (
      action: () => Promise<TransactionResult>,
      opts: { validate?: () => string | null } = {},
    ): Promise<TransactionResult> => {
      setProgress({ phase: "validating" });
      const invalid = opts.validate?.();
      if (invalid) {
        const result: TransactionResult = {
          ok: false,
          source: service.source,
          recordId: "",
          error: invalid,
        };
        setProgress({ phase: "error", message: invalid, result });
        return result;
      }

      setProgress({
        phase: "proving",
        message: "Creating private proof… This may take 30–120 seconds.",
      });
      if (service.source === "midnight") {
        setTimeout(
          () =>
            setProgress((p) =>
              p.phase === "proving" ? { ...p, phase: "awaiting-wallet" } : p,
            ),
          2500,
        );
      }

      const result = await action();
      if (!result.ok) {
        setProgress({ phase: "error", message: result.error, result });
        return result;
      }

      setProgress({ phase: "confirming", result });
      await refresh();
      setProgress({ phase: "success", result });
      return result;
    },
    [refresh, service.source],
  );

  const resetProgress = useCallback(() => setProgress({ phase: "idle" }), []);

  const registerAsset = useCallback(
    (input: RegisterAssetInput) =>
      run(() => service.registerAsset(input), {
        validate: () => (input.title.trim() ? null : "Asset title is required"),
      }),
    [run, service],
  );

  const setLicenseAvailability = useCallback(
    (assetId: string, available: boolean) =>
      run(() => service.setLicenseAvailability(assetId, available)),
    [run, service],
  );

  const revokeAsset = useCallback(
    (assetId: string) => run(() => service.revokeAsset(assetId)),
    [run, service],
  );

  /** Hash the full terms locally, publish only the commitments. */
  const submitLicense = useCallback(
    async (terms: LicenseTerms) => {
      const asset = assets.find((a) => a.assetId === terms.assetId);
      const validate = () => {
        if (!asset) return "Select an asset first";
        if (asset.ownershipStatus === "revoked") return "This asset has been revoked";
        if (!terms.usageType || !terms.territory || !terms.duration)
          return "Usage type, territory and duration are required";
        const total = terms.athletePercent + terms.collaboratorPercent + terms.advisorPercent;
        if (total !== 100) return `Royalty split must total 100% (currently ${total}%)`;
        return null;
      };

      return run(
        async () => {
          const termsCommitment = await commit(terms);
          const splitCommitment = await commit({
            assetId: terms.assetId,
            athlete: terms.athletePercent,
            collaborators: terms.collaboratorPercent,
            advisor: terms.advisorPercent,
          });
          const first = await service.commitLicenseTerms(terms.assetId, termsCommitment);
          if (!first.ok) return first;
          return service.commitRoyaltySplit(terms.assetId, splitCommitment);
        },
        { validate },
      );
    },
    [assets, run, service],
  );

  const stats = useMemo(() => {
    const protectedCount = assets.filter((a) => a.ownershipStatus !== "revoked").length;
    return {
      protectedCount,
      pendingProofs: assets.filter((a) => a.ownershipStatus === "pending").length,
      activeLicenses: assets.filter((a) => a.licensingStatus === "licensed").length,
      demoEarnings: assets.filter((a) => a.licensingStatus === "licensed").length * 1250,
    };
  }, [assets]);

  return {
    assets,
    stats,
    source: service.source,
    isLive: service.source === "midnight",
    progress,
    resetProgress,
    refresh,
    registerAsset,
    setLicenseAvailability,
    revokeAsset,
    submitLicense,
  };
}
