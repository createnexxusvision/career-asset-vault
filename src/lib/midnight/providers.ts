import { CONTRACT_ADDRESS, INDEXER_URL, INDEXER_WS_URL, PROOF_SERVER_URL } from "./config";

/**
 * Single provider factory for the whole app. Nothing here runs during SSR:
 * every caller is inside a browser event handler or effect.
 *
 * Midnight SDK packages are loaded through a variable specifier so the Vite
 * build never tries to resolve them at build time. Install the versions listed
 * in the current Support Matrix (see README) and set the env vars to switch the
 * app from demo mode to live Midnight mode.
 */
export type MidnightProviders = {
  privateStateProvider: unknown;
  publicDataProvider: unknown;
  zkConfigProvider: unknown;
  proofProvider: unknown;
  walletProvider: unknown;
  midnightProvider: unknown;
};

let cached: Promise<MidnightProviders> | null = null;

async function loadModule<T = Record<string, unknown>>(specifier: string): Promise<T> {
  return (await import(/* @vite-ignore */ specifier)) as T;
}

export async function getProviders(wallet: unknown): Promise<MidnightProviders> {
  if (cached) return cached;

  cached = (async () => {
    if (!INDEXER_URL || !INDEXER_WS_URL || !CONTRACT_ADDRESS) {
      throw new Error("Midnight endpoints are not configured");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- module shape is unknown until the Midnight SDK packages are installed
    const [levelPrivateState, indexer, proof, zkConfig] = await Promise.all<any>([
      loadModule("@midnight-ntwrk/midnight-js-level-private-state-provider"),
      loadModule("@midnight-ntwrk/midnight-js-indexer-public-data-provider"),
      loadModule("@midnight-ntwrk/midnight-js-http-client-proof-provider"),
      loadModule("@midnight-ntwrk/midnight-js-fetch-zk-config-provider"),
    ]);

    const connected = wallet as {
      state: () => Promise<{ address: string; coinPublicKey: string }>;
      balanceAndProveTransaction: (tx: unknown, coins: unknown) => Promise<unknown>;
      submitTransaction: (tx: unknown) => Promise<string>;
    };

    return {
      privateStateProvider: levelPrivateState.levelPrivateStateProvider({
        privateStateStoreName: "nextplay-rights-vault",
      }),
      publicDataProvider: indexer.indexerPublicDataProvider(INDEXER_URL, INDEXER_WS_URL),
      zkConfigProvider: new zkConfig.FetchZkConfigProvider(
        `${window.location.origin}/contract`,
        fetch.bind(window),
      ),
      proofProvider: proof.httpClientProofProvider(PROOF_SERVER_URL),
      walletProvider: {
        coinPublicKey: (await connected.state()).coinPublicKey,
        balanceTx: (tx: unknown, newCoins: unknown) =>
          connected.balanceAndProveTransaction(tx, newCoins),
      },
      midnightProvider: {
        submitTx: (tx: unknown) => connected.submitTransaction(tx),
      },
    };
  })();

  return cached;
}

export function resetProviders() {
  cached = null;
}

export type PublicDataProvider = {
  queryContractState: (contractAddress: string) => Promise<{ data: unknown } | null>;
};

let cachedPublicDataProvider: Promise<PublicDataProvider> | null = null;

/**
 * Read-only, wallet-free access to the public ledger. Used to verify an asset
 * from a shared link without connecting Lace — the whole point of a proof
 * you can check without exposing anything.
 */
export function getPublicDataProvider(): Promise<PublicDataProvider> {
  if (cachedPublicDataProvider) return cachedPublicDataProvider;

  cachedPublicDataProvider = (async () => {
    if (!INDEXER_URL || !INDEXER_WS_URL) {
      throw new Error("Indexer endpoints are not configured");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- module shape is unknown until the Midnight SDK package is installed
    const indexer = await loadModule<any>(
      "@midnight-ntwrk/midnight-js-indexer-public-data-provider",
    );
    return indexer.indexerPublicDataProvider(INDEXER_URL, INDEXER_WS_URL) as PublicDataProvider;
  })();

  return cachedPublicDataProvider;
}

export async function isProofServerUp(): Promise<boolean> {
  try {
    const res = await fetch(`${PROOF_SERVER_URL.replace(/\/$/, "")}/health`, {
      method: "GET",
    });
    return res.ok;
  } catch {
    return false;
  }
}
