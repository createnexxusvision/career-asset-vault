import type { AssetRecord } from "@/types/asset";
import { shorten } from "@/lib/midnight/config";

const TYPE_LABEL: Record<AssetRecord["assetType"], string> = {
  photo: "Photo",
  video: "Video / highlight",
  audio: "Audio",
  performance: "Performance",
  phrase: "Brand phrase",
  design: "Logo / design",
  other: "Other",
};

export function AssetCard({
  asset,
  onToggleLicense,
  onRevoke,
  busy,
}: {
  asset: AssetRecord;
  onToggleLicense?: (asset: AssetRecord) => void;
  onRevoke?: (asset: AssetRecord) => void;
  busy?: boolean;
}) {
  const revoked = asset.ownershipStatus === "revoked";

  return (
    <article className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-gold/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{asset.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {TYPE_LABEL[asset.assetType]} · created {asset.createdAt}
          </p>
        </div>
        <StatusPill status={asset.ownershipStatus} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Licensing</dt>
          <dd className="mt-0.5 font-medium capitalize">{asset.licensingStatus}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Collaborators</dt>
          <dd className="mt-0.5 font-medium">{asset.collaboratorCount}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground">Content fingerprint</dt>
          <dd className="mt-0.5 font-mono">{shorten(asset.contentHash, 12, 8)}</dd>
        </div>
      </dl>

      {(onToggleLicense || onRevoke) && !revoked && (
        <div className="mt-4 flex flex-wrap gap-2">
          {onToggleLicense && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onToggleLicense(asset)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
            >
              {asset.licensingStatus === "unavailable"
                ? "Make available to license"
                : "Pause licensing"}
            </button>
          )}
          {onRevoke && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onRevoke(asset)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
            >
              Revoke future licensing
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function StatusPill({ status }: { status: AssetRecord["ownershipStatus"] }) {
  const map = {
    verified: "border-emerald/60 bg-emerald/15 text-emerald",
    pending: "border-gold/60 bg-gold/15 text-gold",
    revoked: "border-border bg-muted text-muted-foreground",
  } as const;
  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${map[status]}`}
    >
      {status}
    </span>
  );
}
