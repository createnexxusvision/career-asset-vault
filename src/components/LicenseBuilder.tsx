import { useEffect, useMemo, useState } from "react";
import type { AssetRecord, LicenseTerms } from "@/types/asset";
import { RoyaltySplitBuilder, type Split } from "@/components/RoyaltySplitBuilder";
import { canonicalize, sha256Hex } from "@/lib/midnight/commitments";

export function LicenseBuilder({
  assets,
  busy,
  onSubmit,
}: {
  assets: AssetRecord[];
  busy: boolean;
  onSubmit: (terms: LicenseTerms) => void;
}) {
  const eligible = assets.filter((a) => a.ownershipStatus !== "revoked");
  const [assetId, setAssetId] = useState(eligible[0]?.assetId ?? "");
  const [usageType, setUsageType] = useState("Social media campaign");
  const [territory, setTerritory] = useState("United States");
  const [duration, setDuration] = useState("12 months");
  const [exclusivity, setExclusivity] = useState<LicenseTerms["exclusivity"]>("non-exclusive");
  const [permittedUses, setPermittedUses] = useState(3);
  const [licenseFee, setLicenseFee] = useState(2500);
  const [renewalOption, setRenewalOption] = useState(true);
  const [split, setSplit] = useState<Split>({
    athletePercent: 80,
    collaboratorPercent: 15,
    advisorPercent: 5,
  });
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!assetId && eligible[0]) setAssetId(eligible[0].assetId);
  }, [assetId, eligible]);

  const terms = useMemo<LicenseTerms>(
    () => ({
      assetId,
      usageType,
      territory,
      duration,
      exclusivity,
      permittedUses,
      licenseFee,
      renewalOption,
      ...split,
    }),
    [assetId, usageType, territory, duration, exclusivity, permittedUses, licenseFee, renewalOption, split],
  );

  useEffect(() => {
    let active = true;
    void sha256Hex(canonicalize(terms)).then((hash) => {
      if (active) setPreview(hash);
    });
    return () => {
      active = false;
    };
  }, [terms]);

  const total = split.athletePercent + split.collaboratorPercent + split.advisorPercent;
  const athleteReceives = Math.round((licenseFee * split.athletePercent) / 100);
  const collaboratorsReceive = Math.round((licenseFee * split.collaboratorPercent) / 100);
  const renewal = new Date();
  renewal.setMonth(renewal.getMonth() + (parseInt(duration, 10) || 12));

  if (eligible.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Register an asset in your vault first — licensing terms attach to an existing asset.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <form
        className="space-y-4 rounded-2xl border border-border bg-card p-6"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(terms);
        }}
      >
        <Field label="Asset">
          <select
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            className={inputClass}
          >
            {eligible.map((a) => (
              <option key={a.assetId} value={a.assetId}>
                {a.title}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Usage type">
            <input value={usageType} onChange={(e) => setUsageType(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Territory">
            <input value={territory} onChange={(e) => setTerritory(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Duration">
            <input value={duration} onChange={(e) => setDuration(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Exclusivity">
            <select
              value={exclusivity}
              onChange={(e) => setExclusivity(e.target.value as LicenseTerms["exclusivity"])}
              className={inputClass}
            >
              <option value="non-exclusive">Non-exclusive</option>
              <option value="exclusive">Exclusive</option>
            </select>
          </Field>
          <Field label="Permitted uses">
            <input
              type="number"
              min={1}
              value={permittedUses}
              onChange={(e) => setPermittedUses(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="License fee (USD)">
            <input
              type="number"
              min={0}
              value={licenseFee}
              onChange={(e) => setLicenseFee(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={renewalOption}
            onChange={(e) => setRenewalOption(e.target.checked)}
            className="h-4 w-4 accent-[var(--gold)]"
          />
          Include a renewal option
        </label>

        <RoyaltySplitBuilder split={split} onChange={setSplit} />

        <button
          type="submit"
          disabled={busy || total !== 100}
          className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Set License Terms
        </button>
      </form>

      <aside className="space-y-4 rounded-2xl border border-border bg-card p-6 text-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Deal summary
        </h3>
        <Row label="Buyer pays" value={`$${licenseFee.toLocaleString()}`} />
        <Row label="Athlete receives" value={`$${athleteReceives.toLocaleString()}`} />
        <Row label="Collaborators receive" value={`$${collaboratorsReceive.toLocaleString()}`} />
        <Row label="Ownership" value="Retained by the athlete" />
        <Row label="License duration" value={duration} />
        <Row label="Renewal date" value={renewalOption ? renewal.toISOString().slice(0, 10) : "—"} />
        <div>
          <p className="text-muted-foreground">License commitment preview</p>
          <p className="mt-1 break-all font-mono text-xs">{preview}</p>
        </div>
        <p className="rounded-xl border border-border bg-secondary/60 p-3 text-xs text-muted-foreground">
          The full terms are hashed on your device — only the commitment is submitted. Royalty
          instructions are recorded for future settlement integration. This MVP does not process
          payments.
        </p>
      </aside>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm text-foreground outline-none focus:border-gold";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
