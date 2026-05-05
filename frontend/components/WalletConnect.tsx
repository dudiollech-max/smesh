import { useState, useEffect } from "react";
import { connectWallet, isMetaMaskAvailable, type WalletState } from "@/lib/web3";

interface WalletConnectProps {
  onWalletChange?: (state: WalletState | null) => void;
  className?: string;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatBalance(balance: string): string {
  const num = parseFloat(balance);
  if (isNaN(num)) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(0);
}

export function WalletConnect({ onWalletChange, className = "" }: WalletConnectProps) {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Detect existing connection on mount
  useEffect(() => {
    const ethereum = (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<string[]>; on: (event: string, cb: () => void) => void } }).ethereum;
    if (!ethereum) return;

    ethereum
      .request({ method: "eth_accounts" })
      .then((accounts: string[]) => {
        if (accounts[0]) {
          handleConnect(true);
        }
      })
      .catch(() => {});

    // Listen for account changes
    ethereum.on("accountsChanged", () => {
      setWallet(null);
      onWalletChange?.(null);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleConnect(silent = false) {
    if (!isMetaMaskAvailable()) {
      if (!silent) {
        setError("MetaMask not found. Please install MetaMask.");
      }
      return;
    }

    setLoading(true);
    setError("");

    try {
      const state = await connectWallet();
      setWallet(state);
      onWalletChange?.(state);
    } catch (err: unknown) {
      if (!silent) {
        const message = err instanceof Error ? err.message : "Connection failed";
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  if (wallet) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* SMESH balance badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-agx-accent/10 border border-agx-accent/20 rounded-full">
          <span className="w-2 h-2 rounded-full bg-agx-accent animate-pulse" />
          <span className="text-agx-accent text-sm font-medium">
            {formatBalance(wallet.smeshBalance)} SMESH
          </span>
        </div>

        {/* Address */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-agx-surface border border-agx-border rounded-full">
          <span className="w-2 h-2 rounded-full bg-agx-green" />
          <span className="text-agx-text text-sm font-mono">
            {truncateAddress(wallet.address)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-end gap-1 ${className}`}>
      <button
        onClick={() => handleConnect()}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-agx-accent text-white rounded-lg text-sm font-medium hover:bg-agx-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Connecting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Connect Wallet
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-agx-muted max-w-[200px] text-right">{error}</p>
      )}
    </div>
  );
}
