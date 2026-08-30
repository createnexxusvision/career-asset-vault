import type { AssetRecord, LicenseTerms } from "@/types/asset";
import { LicenseBuilder } from "@/components/LicenseBuilder";

export function RoyaltiesView({
  assets,
  busy,
  onSubmit,
}: {
  assets: AssetRecord[];
  busy: boolean;
  onSubmit: (terms: LicenseTerms) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Royalty Routes</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Build reusable licensing terms and payout instructions. You keep ownership — a brand only
          gets the rights you grant, for the time you grant them.
        </p>
      </div>
      <LicenseBuilder assets={assets} busy={busy} onSubmit={onSubmit} />
    </div>
  );
}
