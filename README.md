> ⚠️ **Experimental / AI-assisted — not audited.**
> This DApp is an MVP and has not been reviewed by security professionals. Do not use it to hold
> valuable assets, execute binding commercial agreements or process funds. Validate the contract,
> privacy model, NIL requirements, intellectual-property rules and payment workflows before
> production use.

# NextPlay Rights Vault

**Own the moment. Prove the rights. Earn beyond the game.**

A single-page, privacy-preserving Midnight DApp for athletes and creators. One asset record powers
three product views:

- **Rights Vault** — register ownership, collaborators and licensing availability.
- **Proof Passport** — prove authenticity, ownership and licensing status without revealing legal
  identity, contract text or financial terms.
- **Royalty Routes** — build reusable licensing terms and royalty-split instructions while keeping
  ownership.

## Legal and safety notes

- This product is not legal advice.
- Registration is evidence of a submitted commitment, not automatic government copyright
  registration.
- An on-chain record does not resolve disputed ownership by itself.
- Minor athletes may require a parent, guardian or authorized representative.
- NIL rules vary by state, school, conference, league and governing body.
- Royalty Routes does not process payments in this MVP.
- The app never requests or logs a wallet seed or mnemonic.

## Version source of truth

The official Midnight Support Matrix is the source of truth for every version used here:
<https://docs.midnight.network/relnotes/support-matrix>

Re-check the matrix before installing any package or pulling the proof-server image. If the matrix
and this README disagree, the matrix wins. The app targets the **Preview** testnet
(`VITE_NETWORK_ID=preview`).

## Run the app

```bash
bun install
cp .env.example .env
bun run dev
```

With no contract address or indexer URLs configured, the app runs in **demo mode**: fully usable,
persistently labeled, and it never fabricates a transaction hash. Filling in the env vars below
switches it to live Midnight — no UI changes required.

## Go live on Preview

1. **Compact toolchain** (one time, in a terminal):

   ```bash
   curl --proto '=https' --tlsv1.2 -LsSf \
     https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
   source ~/.bashrc && compact update
   compact compile contracts/RightsVault.compact contracts/managed/rights-vault
   mkdir -p public/contract
   cp -r contracts/managed/rights-vault/keys \
         contracts/managed/rights-vault/zkir \
         contracts/managed/rights-vault/contract public/contract/
   ```

2. **Proof server** (Docker, pinned to the matrix tag):

   ```bash
   docker run -p 6300:6300 midnightntwrk/proof-server:<matrix-tag> midnight-proof-server -v
   ```

3. **Install the Midnight SDK packages** at the versions listed in the current matrix
   (`dapp-connector-api`, `midnight-js-contracts`, `midnight-js-types`,
   `midnight-js-indexer-public-data-provider`, `midnight-js-http-client-proof-provider`,
   `midnight-js-fetch-zk-config-provider`, `midnight-js-level-private-state-provider`,
   `compact-runtime`, `wallet-sdk`). They are loaded lazily by
   `src/lib/midnight/providers.ts` and `src/lib/midnight/contract.ts`.

4. **Deploy and configure** — see [`scripts/README.md`](scripts/README.md):

   ```bash
   node scripts/check-midnight-wallet.mjs
   MIDNIGHT_SEED=<64-hex-master-seed> node scripts/deploy-midnight.mjs preview
   ```

   The script writes `config/contract.preview.json`. Copy the address into
   `VITE_DEFAULT_CONTRACT`, set the indexer URLs, and restart the dev server.

5. **Lace** must be installed and set to the same network as `VITE_NETWORK_ID`. A mismatch is shown
   in the header.

## Environment variables

| Variable                | Required      | Notes                                               |
| ----------------------- | ------------- | --------------------------------------------------- |
| `VITE_NETWORK_ID`       | yes           | `preview` \| `preprod` \| `undeployed` \| `mainnet` |
| `VITE_INDEXER_URL`      | for live mode | GraphQL indexer endpoint                            |
| `VITE_INDEXER_WS_URL`   | for live mode | Indexer websocket endpoint                          |
| `VITE_PROOF_SERVER_URL` | yes           | Defaults to `http://localhost:6300`                 |
| `VITE_DEFAULT_CONTRACT` | for live mode | Deployed `RightsVault` address                      |
| `VITE_EXPLORER_URL`     | optional      | Enables explorer links                              |
| `VITE_PINATA_JWT`       | optional      | Not required for the demo                           |

Never put a wallet seed, mnemonic or private key in `.env`.

## Privacy model

- Uploaded files are hashed with SHA-256 **in the browser**. Raw files are never uploaded and never
  stored in public state.
- Full license terms and royalty splits are canonicalized and hashed locally; only the commitments
  reach the ledger.
- The private witness (`ownerSecret`) stays on the device — the contract publishes only a
  commitment derived from it.
- Public ledger state holds: existence, owner commitment, content hash, metadata commitment,
  status, registration sequence, license availability, license commitment, royalty-split
  commitment.

## Project structure

```
contracts/RightsVault.compact   one contract, one shared asset record
scripts/                        deploy, wallet check, address derivation
src/lib/midnight/               config, providers, contract service, commitments
src/lib/demoFallback.ts         labeled local fallback (no fake tx hashes)
src/hooks/                      useMidnightWallet, useRightsVault
src/components/                 banner, network status, proof state, forms, passport
src/features/                   vault, proof, royalties views
src/routes/index.tsx            the single page
```
