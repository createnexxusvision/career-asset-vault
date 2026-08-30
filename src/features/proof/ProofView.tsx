import { useEffect, useState } from "react";
import type { AssetRecord } from "@/types/asset";
import { ProofPassport } from "@/components/ProofPassport";
import { txIdsFor, verifyAssetOnChain, type OnChainAssetStatus } from "@/lib/midnight/contract";

export function ProofView({ assets, isLive }: { assets: AssetRecord[]; isLive: boolean }) {
  const [assetId, setAssetId] = useState(assets[0]?.assetId ?? "");
  const [onChainStatus, setOnChainStatus] = useState<OnChainAssetStatus | null>(null);

  useEffect(() => {
    if (!assets.some((a) => a.assetId === assetId) && assets[0]) setAssetId(assets[0].assetId);
  }, [assets, assetId]);

  useEffect(() => {
    if (!isLive || !assetId) {
      setOnChainStatus(null);
      return;
    }
    let cancelled = false;
    void verifyAssetOnChain(assetId).then((result) => {
      if (!cancelled) setOnChainStatus(result);
    });
    return () => {
      cancelled = true;
    };
  }, [isLive, assetId]);

  const asset = assets.find((a) => a.assetId === assetId);

  if (!asset) {
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Register an asset in your vault to generate a Proof Passport.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">Proof Passport</h2>
        <select
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          className="rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-gold"
        >
          {assets.map((a) => (
            <option key={a.assetId} value={a.assetId}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      <p className="max-w-2xl text-sm text-muted-foreground">
        Share proof of ownership and licensing status with a brand or buyer without revealing who
        you are, what you signed, or what you were paid.
      </p>

      <ProofPassport
        asset={asset}
        isLive={isLive}
        txId={txIdsFor(asset.assetId).at(-1)}
        onChainStatus={onChainStatus}
      />
    </div>
  );
}
