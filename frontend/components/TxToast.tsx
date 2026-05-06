import { useEffect } from "react";
import Link from "next/link";

export interface ToastState {
  status: "pending" | "success" | "error";
  message: string;
  txHash?: string;
}

interface TxToastProps {
  state: ToastState;
  onDismiss: () => void;
  durationMs?: number;
}

export function TxToast({ state, onDismiss, durationMs = 8000 }: TxToastProps) {
  useEffect(() => {
    if (state.status !== "pending") {
      const timer = setTimeout(onDismiss, durationMs);
      return () => clearTimeout(timer);
    }
  }, [state.status, durationMs, onDismiss]);

  const borderColor =
    state.status === "success"
      ? "border-agx-green/40"
      : state.status === "error"
      ? "border-red-500/40"
      : "border-agx-accent/40";

  const icon =
    state.status === "success" ? (
      <span className="text-agx-green text-lg">✅</span>
    ) : state.status === "error" ? (
      <span className="text-red-400 text-lg">❌</span>
    ) : (
      <svg
        className="w-5 h-5 text-agx-accent animate-spin flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    );

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-start gap-3 bg-agx-surface border ${borderColor} rounded-xl shadow-xl p-4 max-w-sm animate-fade-in`}
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-agx-text font-medium leading-snug">{state.message}</p>
        {state.txHash && state.txHash !== "0x_already_approved" && (
          <Link
            href={`https://basescan.org/tx/${state.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-agx-accent hover:underline mt-1 block truncate"
          >
            View on Basescan →
          </Link>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-agx-muted hover:text-agx-text transition-colors ml-1"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
