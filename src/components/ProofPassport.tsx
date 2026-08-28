import { useState } from "react";
import type { AssetRecord, DisclosureField } from "@/types/asset";
import { DISCLOSURE_FIELDS, DISCLOSURE_LABELS } from "@/types/asset";
import { NETWORK_LABEL, NETWORK_ID, shorten } from "@/lib/midnight/config";

export function ProofPassport({
  asset,
  isLive,
  txId,
}: {
  asset: AssetRecord;
  isLive: boolean;
  txId?: string | undefined;
}) {
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<DisclosureField[]>(
    DISCLOSURE_FIELDS.filter((f) => asset.publicProofFields.includes(f)),
  );

  const verified = Boolean(isLive && txId);
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/?verify=${asset.assetId}`
      : `/?verify=${asset.assetId}`;

  const rows: { field: DisclosureField; value: string }[] = [
    { field: "title", value: asset.title },
    { field: "assetType", value: asset.assetType },
    { field: "registrationDate", value: asset.createdAt },
    { field: "ownershipVerified", value: asset.ownershipStatus === "verified" ? "Yes" : "Pending" },
    {
      field: "licenseAvailable",
      value: asset.licensingStatus === "unavailable" ? "No" : "Yes",
    },
    { field: "licenseActive", value: asset.licensingStatus === "licensed" ? "Yes" : "No" },
    { field: "creatorRole", value: "Athlete / creator" },
    { field: "collaboratorCount", value: String(asset.collaboratorCount) },
  ];

  const toggle = (field: DisclosureField) =>
    setSelected((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <section className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Choose what the viewer can see
        </h3>
        <div className="mt-3 space-y-2">
          {DISCLOSURE_FIELDS.map((field) => (
            <label key={field} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(field)}
                onChange={() => toggle(field)}
                className="h-4 w-4 accent-[var(--gold)]"
              />
              {DISCLOSURE_LABELS[field]}
            </label>
          ))}
        </div>
        <p className="mt-4 rounded-xl border border-border bg-secondary/60 p-3 text-xs text-muted-foreground">
          Always private: legal identity, address, contact details, full contract, payment
          amounts, wallet seed, private witness and collaborator identities.
        </p>
      </section>

      <section className="rounded-2xl border border-gold/40 bg-gradient-to-b from-[color-mix(in_oklch,var(--nextplay),transparent_20%)] to-card p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
            NextPlay Rights
          </p>
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
              verified
                ? "border-emerald/60 bg-emerald/15 text-emerald"
                : "border-gold/60 bg-gold/10 text-gold"
            }`}
          >
            {verified
              ? `Verified on ${NETWORK_LABEL[NETWORK_ID]}`
              : "Demo proof preview · Not yet committed to Midnight"}
          </span>
        </div>

        <h3 className="mt-4 text-xl font-bold">Proof Passport</h3>

        <dl className="mt-4 space-y-2 text-sm">
          {rows
            .filter((r) => selected.includes(r.field))
            .map((r) => (
              <div key={r.field} className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">{DISCLOSURE_LABELS[r.field]}</dt>
                <dd className="text-right font-medium capitalize">{r.value}</dd>
              </div>
            ))}
          <div className="flex justify-between gap-4 border-b border-border pb-2">
            <dt className="text-muted-foreground">Record ID</dt>
            <dd className="font-mono text-xs">{asset.assetId}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-border pb-2">
            <dt className="text-muted-foreground">Public commitment</dt>
            <dd className="font-mono text-xs">{shorten(asset.metadataCommitment, 10, 6)}</dd>
          </div>
          {verified && (
            <div className="flex justify-between gap-4 border-b border-border pb-2">
              <dt className="text-muted-foreground">Transaction</dt>
              <dd className="font-mono text-xs">{shorten(txId!, 10, 6)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Generated</dt>
            <dd className="text-xs">{new Date().toISOString().replace("T", " ").slice(0, 19)} UTC</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
          className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {copied ? "Verification link copied" : "Copy verification link"}
        </button>
      </section>
    </div>
  );
}
