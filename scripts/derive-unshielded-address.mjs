#!/usr/bin/env node
/**
 * Offline fallback for printing the UNSHIELDED bech32 address a faucet needs.
 *
 * Preferred path (recommended by Midnight dev-rel):
 *   npm i -g midnight-wallet-cli
 *   mn address --seed <64-hex-master-seed> --network preview
 *
 * This fallback reads the seed from the environment only — never from argv,
 * so it cannot end up in your shell history — and prints only the address.
 *
 *   MIDNIGHT_SEED=<64-hex> node scripts/derive-unshielded-address.mjs preview
 */
const NETWORK = process.argv[2] ?? process.env.VITE_NETWORK_ID ?? "preview";
const SEED = process.env.MIDNIGHT_SEED;

if (!SEED || !/^[0-9a-fA-F]{64}$/.test(SEED)) {
  console.error("✗ Set MIDNIGHT_SEED to a 64-char hex master seed (not a BIP-39 mnemonic).");
  process.exit(1);
}

async function load(specifier) {
  try {
    return await import(specifier);
  } catch {
    console.error(
      `✗ Missing ${specifier}. Install the wallet SDK versions from the current Support Matrix,\n  or use: npm i -g midnight-wallet-cli && mn address --seed <seed> --network ${NETWORK}`,
    );
    process.exit(1);
  }
}

const hd = await load("@midnight-ntwrk/wallet-sdk-hd");
const addressFormat = await load("@midnight-ntwrk/wallet-sdk-address-format");

const seedBytes = Uint8Array.from(SEED.match(/.{2}/g).map((b) => parseInt(b, 16)));
const keys = hd.HDWallet.fromSeed(seedBytes);
const unshielded = keys.selectAccount(0).selectKey(hd.Roles.NightExternal, 0);

console.log(addressFormat.encodeUnshieldedAddress(unshielded.publicKey, NETWORK));
// Never log the seed, the private key or the mnemonic.
