#!/usr/bin/env node
/**
 * Deploy contracts/RightsVault.compact to a Midnight network.
 *
 * Run this locally (never inside Lovable): it needs the Compact toolchain
 * output in contracts/managed/rights-vault and a proof server on :6300.
 *
 *   MIDNIGHT_SEED=<64-hex-master-seed> node scripts/deploy-midnight.mjs preview
 *
 * The seed is read from the environment and is never printed or written to disk.
 */
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const NETWORK = process.argv[2] ?? process.env.VITE_NETWORK_ID ?? "preview";
const MANAGED = resolve("contracts/managed/rights-vault");
const OUT_DIR = resolve("config");
const OUT_FILE = resolve(OUT_DIR, `contract.${NETWORK}.json`);
const PROOF_SERVER = process.env.VITE_PROOF_SERVER_URL ?? "http://localhost:6300";
const INDEXER = process.env.VITE_INDEXER_URL;
const INDEXER_WS = process.env.VITE_INDEXER_WS_URL;
const SEED = process.env.MIDNIGHT_SEED;
const SYNC_RETRIES = 3;
const TTL_MINUTES = 20;

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (!SEED) fail("Set MIDNIGHT_SEED (64-char hex master seed) in your shell, not in .env");
if (!INDEXER || !INDEXER_WS) fail("Set VITE_INDEXER_URL and VITE_INDEXER_WS_URL");
if (!existsSync(MANAGED)) {
  fail(
    `Missing ${MANAGED}. Run:\n  compact compile contracts/RightsVault.compact contracts/managed/rights-vault`,
  );
}

// Packages are imported lazily so this script gives a readable error when the
// Midnight SDK (versions from the current Support Matrix) is not installed yet.
async function load(specifier) {
  try {
    return await import(specifier);
  } catch {
    fail(`Missing package ${specifier}. Install the Support Matrix versions first.`);
  }
}

async function waitForSync(wallet, rxjs) {
  const { firstValueFrom, filter } = rxjs;
  const state = await firstValueFrom(
    wallet.state().pipe(
      filter((s) => {
        const gap = s.syncProgress?.lag?.applyGap ?? 0n;
        return s.syncProgress?.synced === true || gap === 0n;
      }),
    ),
  );
  return state;
}

async function main() {
  const rxjs = await load("rxjs");
  const walletSdk = await load("@midnight-ntwrk/wallet-sdk");
  const contracts = await load("@midnight-ntwrk/midnight-js-contracts");
  const indexerProvider = await load(
    "@midnight-ntwrk/midnight-js-indexer-public-data-provider",
  );
  const proofProvider = await load("@midnight-ntwrk/midnight-js-http-client-proof-provider");
  const zkConfigProvider = await load("@midnight-ntwrk/midnight-js-node-zk-config-provider");
  const privateStateProvider = await load(
    "@midnight-ntwrk/midnight-js-level-private-state-provider",
  );
  const artefact = await import(resolve(MANAGED, "contract/index.cjs"));

  const wallet = await walletSdk.WalletBuilder.buildFromSeed(
    INDEXER,
    INDEXER_WS,
    PROOF_SERVER,
    process.env.VITE_NODE_URL ?? "https://rpc.preview.midnight.network",
    SEED,
    NETWORK,
  );
  wallet.start();

  let lastError;
  for (let attempt = 1; attempt <= SYNC_RETRIES; attempt++) {
    // A fresh private-state id per attempt avoids reusing a half-written store.
    const privateStateId = `rights-vault-${randomBytes(4).toString("hex")}`;
    try {
      console.log(`· attempt ${attempt}: waiting for wallet sync…`);
      const state = await waitForSync(wallet, rxjs);

      const ownerSecret = new Uint8Array(randomBytes(32));
      const providers = {
        privateStateProvider: privateStateProvider.levelPrivateStateProvider({
          privateStateStoreName: privateStateId,
        }),
        publicDataProvider: indexerProvider.indexerPublicDataProvider(INDEXER, INDEXER_WS),
        zkConfigProvider: new zkConfigProvider.NodeZkConfigProvider(MANAGED),
        proofProvider: proofProvider.httpClientProofProvider(PROOF_SERVER),
        walletProvider: {
          coinPublicKey: state.coinPublicKey,
          balanceTx: (tx, newCoins) =>
            wallet.balanceAndProveTransaction(tx, newCoins, {
              // Explicit TTL keeps balancing from being rejected as expired.
              ttl: new Date(Date.now() + TTL_MINUTES * 60_000),
            }),
        },
        midnightProvider: { submitTx: (tx) => wallet.submitTransaction(tx) },
      };

      const deployed = await contracts.deployContract(providers, {
        contract: new artefact.Contract({ ownerSecret: () => [{}, ownerSecret] }),
        privateStateId,
        initialPrivateState: { ownerSecret },
      });

      const address = deployed.deployTxData.public.contractAddress;
      mkdirSync(OUT_DIR, { recursive: true });
      writeFileSync(
        OUT_FILE,
        `${JSON.stringify({ network: NETWORK, contractAddress: address, deployedAt: new Date().toISOString() }, null, 2)}\n`,
      );
      console.log(`✓ deployed to ${NETWORK}: ${address}`);
      console.log(`✓ wrote ${OUT_FILE}`);
      console.log(`→ set VITE_DEFAULT_CONTRACT=${address} in .env`);
      await wallet.close();
      return;
    } catch (error) {
      lastError = error;
      console.warn(`· attempt ${attempt} failed: ${error.message}`);
    }
  }

  await wallet.close();
  fail(`Deployment failed after ${SYNC_RETRIES} attempts: ${lastError?.message}`);
}

main().catch((error) => fail(error.message));
