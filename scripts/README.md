# Scripts

Run these locally in a terminal. None of them run inside Lovable, and none of
them ever print a seed, mnemonic or private key.

| Script                          | Command                                                                     | What it does                                                                       |
| ------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `check-midnight-wallet.mjs`     | `node scripts/check-midnight-wallet.mjs`                                    | Pre-flight: proof server, indexer, contract address, network.                      |
| `deploy-midnight.mjs`           | `MIDNIGHT_SEED=<64-hex> node scripts/deploy-midnight.mjs preview`           | Deploys `contracts/RightsVault.compact` and writes `config/contract.preview.json`. |
| `derive-unshielded-address.mjs` | `MIDNIGHT_SEED=<64-hex> node scripts/derive-unshielded-address.mjs preview` | Offline fallback that prints the `mn_addr_…` address the faucet needs.             |

Preferred address path is the community CLI:

```bash
npm i -g midnight-wallet-cli
mn address --seed <64-hex-master-seed> --network preview
```

Before deploying:

```bash
compact compile contracts/RightsVault.compact contracts/managed/rights-vault
mkdir -p public/contract
cp -r contracts/managed/rights-vault/keys \
      contracts/managed/rights-vault/zkir \
      contracts/managed/rights-vault/contract public/contract/
docker run -p 6300:6300 midnightntwrk/proof-server:<matrix-tag> midnight-proof-server -v
```

`MIDNIGHT_SEED` belongs in your shell for a single command — never in `.env`,
never in the repo.
