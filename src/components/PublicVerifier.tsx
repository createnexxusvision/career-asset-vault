import { useEffect, useState } from "react";
import { isMidnightConfigured, NETWORK_LABEL, NETWORK_ID } from "@/lib/midnight/config";
import { verifyAssetOnChain, type OnChainAssetStatus } from "@/lib/midnight/contract";

type CheckState =
  | { phase: "checking" }
  | { phase: "not-configured" }
  | { phase: "error"; message: string }
  | { phase: "done"; result: OnChainAssetStatus };

const STATUS_COPY: Record<OnChainAssetStatus["status"], { label: string; tone: string }> = {
  none: { label: "No matching asset on-chain", tone: "border-border text-muted-foreground" },
  active: { label: "Ownership proof active", tone: "border-emerald/60 bg-emerald/15 text-emerald" },
  revoked: {
    label: "Revoked by owner",
    tone: "border-destructive/60 bg-destructive/15 text-destructive",
  },
};

/**
 * What a stranger sees when they open a shared verification link. This reads
 * only the public ledger — no local mirror, no owner-side data, no wallet.
 * If this asset were not on Midnight, there would be nothing here to check.
 */
export function PublicVerifier({ assetId }: { assetId: string }) {
  const [state, setState] = useState<CheckState>({ phase: "checking" });

  useEffect(() => {
    let cancelled = false;
    if (!isMidnightConfigured()) {
      setState({ phase: "not-configured" });
      return;
    }
    setState({ phase: "checking" });
    void verifyAssetOnChain(assetId)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setState({ phase: "error", message: "Could not reach the Midnight indexer" });
          return;
        }
        setState({ phase: "done", result });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          phase: "error",
          message: error instanceof Error ? error.message : "Verification failed",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  return (
    <section className="rounded-2xl border border-gold/40 bg-card p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Public verification</p>
      <h3 className="mt-2 text-xl font-bold">Checking the public ledger</h3>
      <p className="mt-2 font-mono text-xs text-muted-foreground">{assetId}</p>

      <div className="mt-5">
        {state.phase === "checking" && (
          <p className="text-sm text-muted-foreground">Reading {NETWORK_LABEL[NETWORK_ID]}…</p>
        )}

        {state.phase === "not-configured" && (
          <p className="rounded-xl border border-gold/50 bg-gold/10 p-3 text-sm text-gold">
            This deployment is running in demo mode — nothing has actually been written to Midnight,
            so there is nothing on-chain to verify. Configure the indexer and contract address to
            check a real asset.
          </p>
        )}

        {state.phase === "error" && (
          <p className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {state.message}
          </p>
        )}

        {state.phase === "done" && (
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_COPY[state.result.status].tone}`}
                >
                  {STATUS_COPY[state.result.status].label}
                </span>
              </dd>
            </div>
            {state.result.exists && (
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">License available</dt>
                <dd className="font-medium">{state.result.licenseAvailable ? "Yes" : "No"}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </section>
  );
}
