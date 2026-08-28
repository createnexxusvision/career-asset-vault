import type { WalletState } from "@/hooks/useMidnightWallet";
import { NETWORK_LABEL, NETWORK_ID } from "@/lib/midnight/config";

export function NetworkStatus({
  wallet,
  isLive,
}: {
  wallet: WalletState & { networkLabel: string };
  isLive: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 font-medium">
        <span
          className={`h-2 w-2 rounded-full ${isLive ? "bg-emerald" : "bg-slateblue"}`}
          aria-hidden
        />
        {NETWORK_LABEL[NETWORK_ID]}
      </span>

      {!isLive && (
        <span className="rounded-full border border-gold/50 bg-gold/10 px-3 py-1 font-semibold text-gold">
          Demo mode · not on-chain
        </span>
      )}

      {wallet.networkMismatch && (
        <span className="rounded-full border border-destructive/60 bg-destructive/15 px-3 py-1 font-semibold">
          Lace is on {wallet.walletNetwork} — switch it to {NETWORK_ID}
        </span>
      )}

      {wallet.proofServerUp === false && (
        <span className="rounded-full border border-border px-3 py-1 text-muted-foreground">
          Proof server offline
        </span>
      )}
    </div>
  );
}
