import { useCallback, useEffect, useRef, useState } from "react";
import { NETWORK_ID, NETWORK_LABEL, shorten } from "@/lib/midnight/config";
import { isProofServerUp } from "@/lib/midnight/providers";

type LaceApi = {
  isEnabled: () => Promise<boolean>;
  enable: () => Promise<unknown>;
  serviceUriConfig: () => Promise<Record<string, string>>;
  apiVersion?: string;
};

declare global {
  interface Window {
    midnight?: Record<string, LaceApi>;
  }
}

export type WalletStatus =
  | "detecting"
  | "unavailable"
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type WalletState = {
  status: WalletStatus;
  address: string;
  shortAddress: string;
  networkMismatch: boolean;
  walletNetwork: string | null;
  proofServerUp: boolean | null;
  error: string | null;
  api: unknown;
};

/**
 * The single place Lace is discovered, connected and observed.
 * No other module polls `window.midnight`, and no seed or mnemonic is ever read.
 */
export function useMidnightWallet() {
  const [state, setState] = useState<WalletState>({
    status: "detecting",
    address: "",
    shortAddress: "",
    networkMismatch: false,
    walletNetwork: null,
    proofServerUp: null,
    error: null,
    api: null,
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const check = () => {
      attempts += 1;
      const lace = window.midnight?.mnLace;
      if (lace) {
        if (pollRef.current) clearInterval(pollRef.current);
        if (!cancelled) {
          setState((s) => (s.status === "connected" ? s : { ...s, status: "disconnected" }));
        }
      } else if (attempts > 10 && !cancelled) {
        if (pollRef.current) clearInterval(pollRef.current);
        setState((s) => ({ ...s, status: "unavailable" }));
      }
    };

    check();
    pollRef.current = setInterval(check, 700);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    isProofServerUp().then((up) => {
      if (!cancelled) setState((s) => ({ ...s, proofServerUp: up }));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    const lace = window.midnight?.mnLace;
    if (!lace) {
      setState((s) => ({ ...s, status: "unavailable" }));
      return;
    }
    setState((s) => ({ ...s, status: "connecting", error: null }));
    try {
      const api = (await lace.enable()) as {
        state: () => Promise<{ address: string }>;
      };
      const walletState = await api.state();
      const uris = await lace.serviceUriConfig().catch(() => ({}) as Record<string, string>);
      const walletNetwork = detectNetwork(walletState.address, uris);

      setState({
        status: "connected",
        address: walletState.address,
        shortAddress: shorten(walletState.address, 10, 6),
        walletNetwork,
        networkMismatch: Boolean(walletNetwork && walletNetwork !== NETWORK_ID),
        proofServerUp: null,
        error: null,
        api,
      });
      isProofServerUp().then((up) => setState((s) => ({ ...s, proofServerUp: up })));
    } catch (error) {
      setState((s) => ({
        ...s,
        status: "error",
        error: error instanceof Error ? error.message : "Lace connection was declined",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState((s) => ({
      ...s,
      status: "disconnected",
      address: "",
      shortAddress: "",
      api: null,
      error: null,
    }));
  }, []);

  return {
    ...state,
    networkId: NETWORK_ID,
    networkLabel: NETWORK_LABEL[NETWORK_ID],
    connect,
    disconnect,
  };
}

function detectNetwork(address: string, uris: Record<string, string>): string | null {
  const haystack = `${address} ${Object.values(uris).join(" ")}`.toLowerCase();
  for (const net of ["preview", "preprod", "undeployed", "mainnet"]) {
    if (haystack.includes(net)) return net;
  }
  return null;
}
