export type Split = {
  athletePercent: number;
  collaboratorPercent: number;
  advisorPercent: number;
};

export function RoyaltySplitBuilder({
  split,
  onChange,
}: {
  split: Split;
  onChange: (next: Split) => void;
}) {
  const total = split.athletePercent + split.collaboratorPercent + split.advisorPercent;
  const rows: { key: keyof Split; label: string }[] = [
    { key: "athletePercent", label: "Athlete" },
    { key: "collaboratorPercent", label: "Collaborators" },
    { key: "advisorPercent", label: "Advisor / organization" },
  ];

  return (
    <div className="rounded-xl border border-border bg-secondary/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Royalty split
      </p>
      <div className="mt-3 space-y-3">
        {rows.map((row) => (
          <label key={row.key} className="flex items-center gap-3 text-sm">
            <span className="w-44 shrink-0">{row.label}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={split[row.key]}
              onChange={(e) => onChange({ ...split, [row.key]: Number(e.target.value) })}
              className="flex-1 accent-[var(--gold)]"
            />
            <span className="w-12 text-right font-mono">{split[row.key]}%</span>
          </label>
        ))}
      </div>
      <p
        className={`mt-3 text-xs font-semibold ${total === 100 ? "text-emerald" : "text-destructive"}`}
      >
        Total {total}% {total === 100 ? "· ready" : "· must equal 100%"}
      </p>
    </div>
  );
}
