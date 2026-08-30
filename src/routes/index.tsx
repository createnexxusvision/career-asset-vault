import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { useState } from "react";
import { ExperimentalBanner } from "@/components/ExperimentalBanner";
import { NetworkStatus } from "@/components/NetworkStatus";
import { ProofState } from "@/components/ProofState";
import { PublicVerifier } from "@/components/PublicVerifier";
import { VaultView } from "@/features/vault/VaultView";
import { ProofView } from "@/features/proof/ProofView";
import { RoyaltiesView } from "@/features/royalties/RoyaltiesView";
import logoMark from "@/assets/nextplay-mark-transparent.png";
import { useMidnightWallet } from "@/hooks/useMidnightWallet";
import { useRightsVault } from "@/hooks/useRightsVault";

const TITLE = "NextPlay Rights Vault — Own the moment. Prove the rights.";
const DESCRIPTION =
  "Turn photos, videos, phrases, designs and performances into private, provable career assets you can license now and carry long after the final whistle.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Index,
});

type Tab = "vault" | "proof" | "royalties";

const TABS: { id: Tab; label: string }[] = [
  { id: "vault", label: "Rights Vault" },
  { id: "proof", label: "Proof Passport" },
  { id: "royalties", label: "Royalty Routes" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ExperimentalBanner />
      <ClientOnly fallback={<Skeleton />}>
        <App />
      </ClientOnly>
      <Footer />
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-20">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="mt-6 h-40 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

function App() {
  const wallet = useMidnightWallet();
  const connected = wallet.status === "connected";
  const vault = useRightsVault(wallet.api, connected);
  const [tab, setTab] = useState<Tab>("vault");
  const busy = !["idle", "success", "error"].includes(vault.progress.phase);
  const [verifyAssetId] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("verify"),
  );

  return (
    <>
      <header className="border-b border-border bg-[color-mix(in_oklch,var(--nextplay),transparent_35%)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-5 py-4">
          <a href="/" className="flex items-center gap-2.5">
            <img src={logoMark} alt="NextPlay Nexus logo" className="h-10 w-10 object-contain" />
            <span className="font-display text-lg font-bold tracking-tight">NextPlay Rights</span>
          </a>

          <nav className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  tab === t.id
                    ? "bg-gold/15 text-gold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <NetworkStatus wallet={wallet} isLive={vault.isLive} />
            {wallet.status === "unavailable" ? (
              <a
                href="https://www.lace.io/"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-gold hover:text-gold"
              >
                Install or enable Lace
              </a>
            ) : connected ? (
              <button
                type="button"
                onClick={wallet.disconnect}
                className="rounded-xl border border-emerald/60 bg-emerald/15 px-4 py-2 text-sm font-semibold text-emerald"
                title={wallet.shortAddress}
              >
                Lace Connected · disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void wallet.connect()}
                disabled={wallet.status === "connecting"}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {wallet.status === "connecting" ? "Connecting…" : "Connect Lace"}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <section className="mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold">
            For the 98% who go pro in something else
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            Your highlights fade. Your rights don't.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">
            Turn every photo, video, phrase, design and performance into a private, provable career
            asset you can license now—and carry long after the final whistle.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setTab("vault")}
              className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Enter My Vault
            </button>
            <button
              type="button"
              onClick={() => setTab("proof")}
              className="rounded-xl border border-border px-5 py-3 text-sm font-semibold transition-colors hover:border-gold hover:text-gold"
            >
              Verify an Asset
            </button>
          </div>
          {wallet.error && <p className="mt-4 text-sm text-destructive">{wallet.error}</p>}
        </section>

        {verifyAssetId && (
          <div className="mb-8">
            <PublicVerifier assetId={verifyAssetId} />
          </div>
        )}

        {vault.progress.phase !== "idle" && (
          <div className="mb-8">
            <ProofState progress={vault.progress} onDismiss={vault.resetProgress} />
          </div>
        )}

        {tab === "vault" && (
          <VaultView
            assets={vault.assets}
            stats={vault.stats}
            busy={busy}
            onRegister={(input) => void vault.registerAsset(input)}
            onToggleLicense={(asset) =>
              void vault.setLicenseAvailability(
                asset.assetId,
                asset.licensingStatus === "unavailable",
              )
            }
            onRevoke={(asset) => void vault.revokeAsset(asset.assetId)}
          />
        )}

        {tab === "proof" && <ProofView assets={vault.assets} isLive={vault.isLive} />}

        {tab === "royalties" && (
          <RoyaltiesView
            assets={vault.assets}
            busy={busy}
            onSubmit={(terms) => void vault.submitLicense(terms)}
          />
        )}
      </main>
    </>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-[color-mix(in_oklch,var(--nextplay),transparent_45%)]">
      <div className="mx-auto max-w-6xl space-y-2 px-5 py-8 text-xs leading-relaxed text-muted-foreground">
        <p className="font-semibold text-foreground">
          Experimental, AI-assisted build — not audited. This is not legal advice.
        </p>
        <p>
          Registration is evidence of a submitted commitment, not automatic government copyright
          registration. An on-chain record does not resolve disputed ownership by itself.
        </p>
        <p>
          Minor athletes may require a parent, guardian or authorized representative. NIL rules vary
          by state, school, conference, league and governing body.
        </p>
        <p>Royalty Routes does not process payments in this MVP.</p>
      </div>
    </footer>
  );
}
