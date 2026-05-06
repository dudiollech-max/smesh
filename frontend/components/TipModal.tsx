import { useState } from "react";

interface TipModalProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
}

export function TipModal({ agentId, agentName, onClose }: TipModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Mock balance — in production from wallet
  const mockBalance = 12500;

  const handleSubmit = async () => {
    const tipAmount = parseInt(amount, 10);

    if (!tipAmount || tipAmount < 10) {
      setError("Minimum tip is 10 SMESH");
      return;
    }
    if (tipAmount > 100000) {
      setError("Maximum tip is 100,000 SMESH");
      return;
    }
    if (message.length > 140) {
      setError("Message must be 140 characters or less");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${API_URL}/api/tips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: "current-user", // In production from auth
          agentId,
          amount: tipAmount,
          message,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send tip");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send tip");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-agx-surface border border-agx-border rounded-xl p-6 w-full max-w-md mx-4 animate-fade-in">
        {success ? (
          <div className="text-center py-4">
            <div className="text-agx-green text-4xl mb-3">&#10003;</div>
            <h3 className="text-lg font-semibold text-agx-text">Tip Sent!</h3>
            <p className="text-agx-muted text-sm mt-1">
              You tipped {amount} SMESH to {agentName}
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-agx-accent text-black rounded-lg text-sm font-medium"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-agx-text">
                Tip {agentName}
              </h3>
              <button
                onClick={onClose}
                className="text-agx-muted hover:text-agx-text transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Amount input */}
              <div>
                <label className="text-sm text-agx-muted block mb-1">Amount (SMESH)</label>
                <input
                  type="number"
                  min="10"
                  max="100000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10 - 100,000"
                  className="w-full px-3 py-2 bg-agx-bg border border-agx-border rounded-lg text-agx-text placeholder:text-agx-muted/50 focus:outline-none focus:border-agx-accent"
                />
                <p className="text-xs text-agx-muted mt-1">
                  Balance: {mockBalance.toLocaleString()} SMESH
                </p>
              </div>

              {/* Message input */}
              <div>
                <label className="text-sm text-agx-muted block mb-1">
                  Message (optional, max 140 chars)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={140}
                  rows={2}
                  placeholder="Great work on the analysis!"
                  className="w-full px-3 py-2 bg-agx-bg border border-agx-border rounded-lg text-agx-text placeholder:text-agx-muted/50 focus:outline-none focus:border-agx-accent resize-none"
                />
                <p className="text-xs text-agx-muted mt-0.5 text-right">
                  {message.length}/140
                </p>
              </div>

              {/* Fee breakdown */}
              {amount && parseInt(amount) >= 10 && (
                <div className="bg-agx-bg rounded-lg p-3 text-xs text-agx-muted space-y-1">
                  <div className="flex justify-between">
                    <span>Agent receives (85%)</span>
                    <span className="text-agx-text">{Math.floor(parseInt(amount) * 0.85)} SMESH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform (10%)</span>
                    <span>{Math.floor(parseInt(amount) * 0.10)} SMESH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Burned (5%)</span>
                    <span>{Math.floor(parseInt(amount) * 0.05)} SMESH</span>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !amount}
                className="w-full px-4 py-2.5 bg-agx-accent text-black rounded-lg font-medium hover:bg-agx-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Sending..." : "Send Tip"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
