import type { ProofProgress } from "@/hooks/useRightsVault";
import { explorerTxUrl, shorten } from "@/lib/midnight/config";

const COPY: Record<ProofProgress["phase"], string> = {
  idle: "",
  validating: "Checking your details…",
  proving: "Creating private proof… This may take 30–120 seconds.",
  "awaiting-wallet": "Waiting for you to approve in Lace…",
  submitting: "Submitting to Midnight…",
  confirming: "Confirming on the network…",
  success: "Done.",
  error: "Something went wrong.",
};

const BUSY: ProofProgress["phase"][] = [
  "validating",
  "proving",
  "awaiting-wallet",
  "submitting",
  "confirming",
];

/** The single transaction-state surface reused by all three products. */
export function ProofState({
  progress,
  onDismiss,
}: {
  progress: ProofProgress;
  onDismiss?: () => void;
}) {
  if (progress.phase === "idle") return null;

  const busy = BUSY.includes(progress.phase);
  const result = progress.result;
  const txUrl = result?.txId ? explorerTxUrl(result.txId) : null;

  const tone =
    progress.phase === "error"
      ? "border-destructive/60 bg-destructive/10"
      : progress.phase === "success"
        ? "border-emerald/60 bg-emerald/10"
        : "border-gold/50 bg-gold/10";

  return (
    <div className={`rounded-xl border ${tone} p-4 text-sm`} aria-live="polite">
      <div className="flex items-start gap-3">
        {busy && (
          <span className="mt-1 h-3 w-3 shrink-0 animate-ping rounded-full bg-gold" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{progress.message ?? COPY[progress.phase]}</p>

          {busy && (
            <p className="mt-1 text-muted-foreground">
              You can keep using the app while this finishes.
            </p>
          )}

          {progress.phase === "success" && result && (
            <div className="mt-2 space-y-1 text-muted-foreground">
              <p>
                Record ID: <span className="font-mono text-foreground">{result.recordId}</span>
              </p>
              {result.txId ? (
                <p>
                  Transaction:{" "}
                  <span className="font-mono text-foreground">{shorten(result.txId, 10, 8)}</span>
                  {txUrl && (
                    <>
                      {" · "}
                      <a className="underline" href={txUrl} target="_blank" rel="noreferrer">
                        View on explorer
                      </a>
                    </>
                  )}
                </p>
              ) : (
                <p>Demo record · Not committed to Midnight.</p>
              )}
            </div>
          )}
        </div>

        {!busy && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            dismiss
          </button>
        )}
      </div>
    </div>
  );
}
