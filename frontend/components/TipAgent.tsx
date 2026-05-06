import { useState } from "react";
import Link from "next/link";
import { tipAgent } from "@/lib/web3";
import { TxToast, type ToastState } from "@/components/TxToast";

interface TipAgentProps {
  agentId: number;          // on-chain uint256 agent ID
  agentName: string;
  onClose: () => void;
}

const PRESET_AMOUNTS = [100, 500, 1000];

export function TipAgent({ agentId, agentName, onClose }: TipAgentProps) {
  const [amount, setAmount] = useState<string>("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"input" | "approving" | "sending" | "success" | "error">("input");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);

  const amountNum = Number(amount);
  const isValid = amountNum >= 10 && amountNum <= 100_000;
  const agentReceives = isValid ? Math.floor(amountNum * 0.85) : 0;
  const platformFee   = isValid ? Math.floor(amountNum * 0.10) : 0;
  const burned        = isValid ? Math.floor(amountNum * 0.05) : 0;

  function showToast(t: ToastState) {
    setToast(t);
  }

  async function handleSend() {
    if (!isValid) {
      setError("Amount must be between 10 and 100,000 SMESH.");
      return;
    }
    if (message.length > 140) {
      setError("Message must be ≤140 characters.");
      return;
    }

    setError("");
    setStep("approving");
    showToast({ status: "pending", message: "Approving SMESH..." });

    try {
      setStep("sending");
      showToast({ status: "pending", message: `Sending ${amountNum} SMESH tip...` });

      const hash = await tipAgent(agentId, amountNum, message);
      setTxHash(hash);

      showToast({
        status: "success",
        message: `${amountNum} SMESH sent to ${agentName} 🎉`,
        txHash: hash,
      });
      setStep("success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Tip failed";
      setError(msg);
      showToast({ status: "error", message: msg });
      setStep("error");
    }
  }

  return (
    <>
      {toast && (
        <TxToast state={toast} onDismiss={() => setToast(null)} />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-agx-surface border border-agx-border rounded-xl p-6 w-full max-w-md mx-4">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-agx-text">Tip {agentName}</h3>
              <p className="text-xs text-agx-muted mt-0.5">Tips go directly to the agent's wallet</p>
            </div>
            <button
              onClick={onClose}
              className="text-agx-muted hover:text-agx-text transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Success state */}
          {step === "success" ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🎉</div>
              <h4 className="text-lg font-semibold text-agx-green mb-1">Tip Sent!</h4>
              <p className="text-agx-muted text-sm mb-4">
                {amountNum} SMESH sent to {agentName}
              </p>
              {txHash && (
                <Link
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-agx-accent hover:underline block mb-4"
                >
                  View on Basescan →
                </Link>
              )}
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-agx-accent text-black rounded-lg font-medium hover:bg-agx-accent/90 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Preset buttons */}
              <div>
                <label className="text-xs text-agx-muted block mb-2">Quick amounts (SMESH)</label>
                <div className="flex gap-2">
                  {PRESET_AMOUNTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setAmount(String(p))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                        amount === String(p)
                          ? "bg-agx-accent text-black border-agx-accent"
                          : "bg-agx-bg border-agx-border text-agx-muted hover:text-agx-text hover:border-agx-accent/50"
                      }`}
                    >
                      {p.toLocaleString()}
                    </button>
                  ))}
                  <button
                    onClick={() => setAmount("")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                      !PRESET_AMOUNTS.includes(amountNum) && amount !== ""
                        ? "bg-agx-accent text-black border-agx-accent"
                        : "bg-agx-bg border-agx-border text-agx-muted hover:text-agx-text"
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* Custom amount input */}
              {(!PRESET_AMOUNTS.includes(amountNum) || amount === "") && (
                <div>
                  <label className="text-xs text-agx-muted block mb-1">Amount (SMESH)</label>
                  <input
                    type="number"
                    min="10"
                    max="100000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="10 – 100,000"
                    className="w-full px-3 py-2 bg-agx-bg border border-agx-border rounded-lg text-agx-text placeholder:text-agx-muted/50 focus:outline-none focus:border-agx-accent"
                  />
                </div>
              )}

              {/* Message */}
              <div>
                <label className="text-xs text-agx-muted block mb-1">
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={140}
                  rows={2}
                  placeholder="Great work on that analysis!"
                  className="w-full px-3 py-2 bg-agx-bg border border-agx-border rounded-lg text-agx-text placeholder:text-agx-muted/50 focus:outline-none focus:border-agx-accent resize-none text-sm"
                />
                <p className="text-right text-xs text-agx-muted">{message.length}/140</p>
              </div>

              {/* Fee breakdown */}
              {isValid && (
                <div className="bg-agx-bg rounded-lg p-3 text-xs text-agx-muted space-y-1.5 border border-agx-border/50">
                  <div className="flex justify-between">
                    <span>Agent receives (85%)</span>
                    <span className="text-agx-text font-medium">{agentReceives.toLocaleString()} SMESH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform (10%)</span>
                    <span>{platformFee.toLocaleString()} SMESH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Burned 🔥 (5%)</span>
                    <span>{burned.toLocaleString()} SMESH</span>
                  </div>
                </div>
              )}

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                onClick={handleSend}
                disabled={!isValid || step === "approving" || step === "sending"}
                className="w-full px-4 py-3 bg-agx-accent text-black rounded-lg font-medium hover:bg-agx-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {step === "approving" ? (
                  <><Spinner /> Approving SMESH...</>
                ) : step === "sending" ? (
                  <><Spinner /> Sending tip...</>
                ) : (
                  `Send ${amountNum > 0 ? amountNum.toLocaleString() + " SMESH" : "Tip"} →`
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
