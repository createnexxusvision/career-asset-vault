# NextPlay Rights Vault — Midnight Preview DApp

Single-page, privacy-preserving rights registry for athletes and creators: one asset record powering three views (Rights Vault, Proof Passport, Royalty Routes), one Compact contract, Lace as the only wallet.

## Important adaptation

This project is a TanStack Start app, not plain Vite. Everything stays on the single index route (`src/routes/index.tsx`) and all Midnight SDK code is client-only (dynamic import inside `useEffect` / `<ClientOnly>`), so nothing Midnight-related runs during SSR. No router navigation is added; the three products are tabs.

Compact compilation and contract deployment need a local terminal (Compact toolchain + Docker proof server) and cannot run inside Lovable. So the app ships with a typed `RightsVaultService` interface with two implementations — `midnight` and `demo`. Demo is the default only when the required env vars/contract address are missing, is labeled persistently, and never fabricates a transaction hash.

## Contract

`contracts/RightsVault.compact` (~100 lines), one shared record per asset:

- Ledger: `assetCount`, `assetExists`, `assetOwnerCommitment`, `assetStatus`, `licenseAvailable`, `licenseTermsCommitment`, `royaltySplitCommitment`
- Circuits: `registerAsset`, `setLicenseAvailability`, `commitLicenseTerms`, `commitRoyaltySplit`, `revokeAsset`, `verifyAssetStatus`
- Private witness derives the owner commitment; never written raw to the ledger
- Duplicate registration rejected; revoke preserves the original record

## Shared model and services

- `src/types/asset.ts` — the single `AssetRecord` type from the spec
- `src/lib/midnight/config.ts` — network ids, indexer/proof/explorer URLs from `VITE_*`
- `src/lib/midnight/providers.ts` — one provider factory (wallet, midnight, public data, proof, ZK config, private state), created once
- `src/lib/midnight/contract.ts` — all contract calls, implements `RightsVaultService`
- `src/lib/midnight/commitments.ts` — SHA-256 content hashing, metadata/license/royalty commitments (local, browser crypto)
- `src/lib/demoFallback.ts` — demo `RightsVaultService` backed by session state
- `src/hooks/useMidnightWallet.ts` — sole Lace discovery/polling, connect on user action, network mismatch, shortened identity, disconnect
- `src/hooks/useRightsVault.ts` — product actions + shared asset list consumed by all three views

## UI

Design tokens added to `src/styles.css` (Midnight navy #080F1E, NextPlay blue #0B1D3A, gold #FDB927, emerald #1A7F5F, slate #506680, champagne #F7F5EE, graphite #3E3E3E) — premium, athlete-first, no crypto-dashboard tropes. Athlete language throughout ("Enter My Vault", "Protect Asset", "Create Proof Passport").

Components: `ExperimentalBanner`, `NetworkStatus`, `ProofState` (single state machine: idle → validating → proving → awaiting approval → submitting → confirming → success/error, reused everywhere), `AssetForm`, `AssetCard`, `ProofPassport`, `LicenseBuilder`, `RoyaltySplitBuilder`.

Page: banner → header with three product tabs + network indicator + Lace button → hero ("Your highlights fade. Your rights don't.") → active view.

- **Rights Vault**: stats (protected assets, pending proofs, active licenses, demo earnings clearly labeled), asset list, registration form. Uploaded files are hashed locally with SHA-256; the raw file never leaves the browser.
- **Proof Passport**: pick an asset, choose disclosure fields, render a verification card. "Verified on Midnight Preview" only after a real tx; otherwise "Demo proof preview · Not yet committed to Midnight".
- **Royalty Routes**: license builder with validation (splits total 100%, required terms, authorized + non-revoked asset), payout preview, license commitment preview, and the "does not process payments" notice.

## Scripts, env, docs

- `scripts/deploy-midnight.mjs` — managed artifact path, explicit witnesses + initial private state, TTL on balancing, wait for wallet sync, retry with a fresh private-state id, writes the address to a network-specific JSON config; never prints a seed
- `scripts/check-midnight-wallet.mjs`, `scripts/derive-unshielded-address.mjs`, `scripts/README.md`
- `.env.example` with exactly the listed variables (Pinata optional)
- `README.md` with the verbatim experimental warning block, version-source-of-truth pointer to the support matrix, NIL/legal disclaimers, and how to run compile/proof-server/deploy

Package versions will be checked against the current support matrix before installing, and only client-safe packages are added to the app bundle.

## Acceptance

Loads clean on mobile and desktop, Lace detection and network mismatch work, one asset registers and appears in all three views, passport and license/royalty flows work off that same record, demo mode unmistakably labeled, no private data in public state, production build succeeds.
