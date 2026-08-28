import { useState } from "react";
import type { AssetRecord, RegisterAssetInput } from "@/types/asset";
import { AssetCard } from "@/components/AssetCard";
import { AssetForm } from "@/components/AssetForm";

export function VaultView({
  assets,
  stats,
  busy,
  onRegister,
  onToggleLicense,
  onRevoke,
}: {
  assets: AssetRecord[];
  stats: {
    protectedCount: number;
    pendingProofs: number;
    activeLicenses: number;
    demoEarnings: number;
  };
  busy: boolean;
  onRegister: (input: RegisterAssetInput) => void;
  onToggleLicense: (asset: AssetRecord) => void;
  onRevoke: (asset: AssetRecord) => void;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Protected assets" value={String(stats.protectedCount)} />
        <Stat label="Pending proofs" value={String(stats.pendingProofs)} />
        <Stat label="Active licenses" value={String(stats.activeLicenses)} />
        <Stat
          label="Estimated earnings"
          value={`$${stats.demoEarnings.toLocaleString()}`}
          note="Demo data"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">My vault</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {showForm ? "Close" : "Register New Asset"}
        </button>
      </div>

      {showForm && (
        <AssetForm
          busy={busy}
          onSubmit={(input) => {
            onRegister(input);
            setShowForm(false);
          }}
        />
      )}

      {assets.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          Nothing protected yet. Register your first career asset — a highlight, a phrase, a
          design — and it becomes provable everywhere in NextPlay.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {assets.map((asset) => (
            <AssetCard
              key={asset.assetId}
              asset={asset}
              busy={busy}
              onToggleLicense={onToggleLicense}
              onRevoke={onRevoke}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {note && <p className="mt-1 text-[11px] font-semibold text-gold">{note}</p>}
    </div>
  );
}
