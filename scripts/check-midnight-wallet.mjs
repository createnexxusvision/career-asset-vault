#!/usr/bin/env node
/**
 * Pre-flight check before deploying or demoing.
 *   node scripts/check-midnight-wallet.mjs
 *
 * Verifies the proof server, indexer endpoints and required env vars.
 * Never reads or prints a seed or mnemonic.
 */
const NETWORK = process.env.VITE_NETWORK_ID ?? "preview";
const PROOF_SERVER = process.env.VITE_PROOF_SERVER_URL ?? "http://localhost:6300";
const INDEXER = process.env.VITE_INDEXER_URL;
const CONTRACT = process.env.VITE_DEFAULT_CONTRACT;

const ok = (m) => console.log(`✓ ${m}`);
const warn = (m) => console.warn(`! ${m}`);

console.log(`Network: ${NETWORK}\n`);

try {
  const res = await fetch(`${PROOF_SERVER.replace(/\/$/, "")}/health`);
  res.ok ? ok(`proof server reachable at ${PROOF_SERVER}`) : warn(`proof server responded ${res.status}`);
} catch {
  warn(
    `proof server unreachable at ${PROOF_SERVER}\n  docker run -p 6300:6300 midnightntwrk/proof-server:<matrix-tag> midnight-proof-server -v`,
  );
}

if (!INDEXER) {
  warn("VITE_INDEXER_URL is not set — the app will run in demo mode");
} else {
  try {
    const res = await fetch(INDEXER, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "{ __typename }" }),
    });
    res.ok ? ok(`indexer reachable at ${INDEXER}`) : warn(`indexer responded ${res.status}`);
  } catch {
    warn(`indexer unreachable at ${INDEXER}`);
  }
}

CONTRACT
  ? ok(`contract address configured: ${CONTRACT}`)
  : warn("VITE_DEFAULT_CONTRACT is not set — the app will run in demo mode");

console.log("\nLace: open the extension and confirm it is set to the same network.");
