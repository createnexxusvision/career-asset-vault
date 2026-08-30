import { useState } from "react";
import type { AssetType, RegisterAssetInput } from "@/types/asset";
import { DISCLOSURE_FIELDS, DISCLOSURE_LABELS } from "@/types/asset";
import { commit, hashFile, sha256Hex } from "@/lib/midnight/commitments";

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: "photo", label: "Photo" },
  { value: "video", label: "Video / highlight" },
  { value: "audio", label: "Audio" },
  { value: "performance", label: "Performance" },
  { value: "phrase", label: "Brand phrase" },
  { value: "design", label: "Logo / design" },
  { value: "other", label: "Other" },
];

export function AssetForm({
  onSubmit,
  busy,
}: {
  onSubmit: (input: RegisterAssetInput) => void;
  busy: boolean;
}) {
  const [title, setTitle] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("photo");
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().slice(0, 10));
  const [creatorRole, setCreatorRole] = useState("Athlete / subject");
  const [collaboratorCount, setCollaboratorCount] = useState(0);
  const [licenseAvailable, setLicenseAvailable] = useState(true);
  const [fields, setFields] = useState<string[]>([
    "title",
    "assetType",
    "registrationDate",
    "ownershipVerified",
  ]);
  const [fileName, setFileName] = useState("");
  const [contentHash, setContentHash] = useState("");
  const [hashing, setHashing] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setHashing(true);
    setFileName(file.name);
    setContentHash(await hashFile(file));
    setHashing(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const hash =
      contentHash || (await sha256Hex(`${title}|${assetType}|${createdAt}|${creatorRole}`));
    const metadataCommitment = await commit({
      title,
      assetType,
      createdAt,
      creatorRole,
      collaboratorCount,
    });
    onSubmit({
      title: title.trim(),
      assetType,
      createdAt,
      contentHash: hash,
      metadataCommitment,
      creatorRole,
      collaboratorCount,
      publicProofFields: fields,
      licenseAvailable,
    });
  }

  const toggle = (field: string) =>
    setFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-border bg-card p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Asset title">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="State final — game-winning shot"
            className={inputClass}
          />
        </Field>

        <Field label="Asset type">
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value as AssetType)}
            className={inputClass}
          >
            {ASSET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Creation date">
          <input
            type="date"
            value={createdAt}
            onChange={(e) => setCreatedAt(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Your role">
          <input
            value={creatorRole}
            onChange={(e) => setCreatorRole(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Number of collaborators">
          <input
            type="number"
            min={0}
            value={collaboratorCount}
            onChange={(e) => setCollaboratorCount(Number(e.target.value))}
            className={inputClass}
          />
        </Field>

        <Field label="Original file (optional)">
          <input
            type="file"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-foreground"
          />
        </Field>
      </div>

      <p className="rounded-xl border border-border bg-secondary/60 p-3 text-xs text-muted-foreground">
        Your file never leaves this device. We create a SHA-256 fingerprint in your browser and only
        that fingerprint is used for proof.
        {hashing && " Fingerprinting…"}
        {contentHash && (
          <>
            {" "}
            <span className="block pt-1 font-mono text-foreground">
              {fileName}: {contentHash.slice(0, 26)}…
            </span>
          </>
        )}
      </p>

      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Fields you consent to disclose publicly
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {DISCLOSURE_FIELDS.map((field) => (
            <button
              type="button"
              key={field}
              onClick={() => toggle(field)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                fields.includes(field)
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {DISCLOSURE_LABELS[field]}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={licenseAvailable}
          onChange={(e) => setLicenseAvailable(e.target.checked)}
          className="h-4 w-4 accent-[var(--gold)]"
        />
        Make this asset available to license
      </label>

      <button
        type="submit"
        disabled={busy || hashing}
        className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
      >
        Protect Asset
      </button>
    </form>
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
