import { useEffect, useState } from "react";
import { NETWORK_ID } from "@/lib/midnight/config";

const VARIANTS = {
  mainnet: {
    className: "bg-destructive text-white",
    msg: "MAINNET · This application has not been audited. Experimental build — do not use it to hold valuable assets or execute binding agreements.",
    dismissible: false,
  },
  preview: {
    className: "bg-gold text-navy",
    msg: "Testnet Preview · Experimental build. Blockchain actions may reset and are not production-ready.",
    dismissible: true,
  },
  preprod: {
    className: "bg-gold text-navy",
    msg: "Testnet Preprod · Experimental build. Blockchain actions may reset and are not production-ready.",
    dismissible: true,
  },
  undeployed: {
    className: "bg-slateblue text-champagne",
    msg: "Local dev chain (Undeployed) · Not real value. Experimental build.",
    dismissible: true,
  },
} as const;

export function ExperimentalBanner() {
  const variant = VARIANTS[NETWORK_ID] ?? VARIANTS.preview;
  const key = `experimental-banner-dismissed-${NETWORK_ID}`;
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (variant.dismissible && sessionStorage.getItem(key) === "1") setHidden(true);
  }, [key, variant.dismissible]);

  if (hidden) return null;

  return (
    <div
      role="alert"
      className={`${variant.className} sticky top-0 z-50 flex items-center justify-center gap-3 px-4 py-2 text-center text-xs font-semibold sm:text-sm`}
    >
      <span>⚠️ {variant.msg}</span>
      {variant.dismissible && (
        <button
          type="button"
          className="underline opacity-80 transition-opacity hover:opacity-100"
          onClick={() => {
            sessionStorage.setItem(key, "1");
            setHidden(true);
          }}
        >
          dismiss
        </button>
      )}
    </div>
  );
}
