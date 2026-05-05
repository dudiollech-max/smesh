import { useState } from "react";
import { api } from "@/lib/api";
import { VerificationStatus } from "@/components/VerificationStatus";
import { WalletConnect } from "@/components/WalletConnect";
import { enrollAgent, type WalletState } from "@/lib/web3";
import Link from "next/link";

type VerificationStep = "idle" | "submitted" | "pinging" | "testing" | "verified" | "failed";

export default function EnrollPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [capabilityInput, setCapabilityInput] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [walletState, setWalletState] = useState<WalletState | null>(null);
  const [verificationStep, setVerificationStep] = useState<VerificationStep>("idle");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState<string>("");
  const [txLoading, setTxLoading] = useState(false);

  function addCapability() {
    const trimmed = capabilityInput.trim().toLowerCase();
    if (trimmed && !capabilities.includes(trimmed)) {
      setCapabilities([...capabilities, trimmed]);
      setCapabilityInput("");
    }
  }

  function removeCapability(cap: string) {
    setCapabilities(capabilities.filter((c) => c !== cap));
  }

  function handleCapabilityKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCapability();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setTxHash("");

    if (!walletState) {
      setError("Please connect your wallet first.");
      return;
    }

    setTxLoading(true);
    setVerificationStep("submitted");

    try {
      // Step 1: Send on-chain registration
      setVerificationStep("pinging");
      const hash = await enrollAgent({
        name,
        apiEndpoint,
        capabilities,
        description,
        metadataURI: "",
      });

      setTxHash(hash);

      // Step 2: Register with backend (non-blocking)
      setVerificationStep("testing");
      try {
        await api.agents.register({
          walletAddress: walletState.address,
          name,
          description,
          apiEndpoint,
          capabilities,
        });
      } catch {
        // Backend failure doesn't block the on-chain success
      }

      setTimeout(() => {
        setVerificationStep("verified");
        setTxLoading(false);
      }, 1500);
    } catch (err) {
      setVerificationStep("failed");
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
      setTxLoading(false);
    }
  }

  const isSubmitting =
    verificationStep !== "idle" && verificationStep !== "failed" && verificationStep !== "verified";

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-agx-text">Enroll Your Agent</h1>
        <p className="text-agx-muted mt-1">
          Register your AI agent on the Smesh network and earn{" "}
          <span className="text-agx-gold font-medium">1,000 SMESH</span> instantly.
        </p>
      </div>

      {/* Wallet section */}
      <div className="bg-agx-surface border border-agx-border rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-medium text-agx-text">Wallet</h2>
            <p className="text-xs text-agx-muted mt-0.5">
              {walletState
                ? `Connected — ${walletState.smeshBalance ? parseFloat(walletState.smeshBalance).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"} SMESH`
                : "Connect to sign the on-chain registration transaction"}
            </p>
          </div>
          <WalletConnect onWalletChange={setWalletState} />
        </div>

        {/* Reward callout */}
        {walletState && (
          <div className="mt-4 p-3 bg-agx-gold/5 border border-agx-gold/20 rounded-lg flex items-center gap-3">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-sm text-agx-gold font-medium">You'll receive 1,000 SMESH on enrollment</p>
              <p className="text-xs text-agx-muted">Sent automatically from the Ecosystem wallet after registration</p>
            </div>
          </div>
        )}
      </div>

      {/* Verification status */}
      {verificationStep !== "idle" && (
        <div className="mb-6">
          <VerificationStatus step={verificationStep} error={error} />
        </div>
      )}

      {/* Success: tx hash */}
      {txHash && (
        <div className="mb-6 p-4 bg-agx-green/10 border border-agx-green/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-agx-green" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-agx-green font-medium text-sm">Transaction submitted!</span>
          </div>
          <p className="text-xs text-agx-muted mb-2">Your agent registration is being processed on Base.</p>
          <div className="flex items-center gap-2">
            <code className="text-[11px] text-agx-muted font-mono bg-agx-bg px-2 py-1 rounded truncate max-w-[280px]">
              {txHash}
            </code>
            <Link
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-agx-accent hover:underline flex-shrink-0"
            >
              View on Basescan →
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-agx-surface border border-agx-border rounded-xl p-6 space-y-5">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-agx-text mb-1.5">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CodeAnalyzer Pro"
              className="w-full bg-agx-bg border border-agx-border rounded-lg px-4 py-2.5 text-agx-text placeholder:text-agx-muted focus:outline-none focus:border-agx-accent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-agx-text mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your agent do?"
              rows={3}
              className="w-full bg-agx-bg border border-agx-border rounded-lg px-4 py-3 text-agx-text placeholder:text-agx-muted focus:outline-none focus:border-agx-accent resize-none"
            />
          </div>

          {/* API Endpoint */}
          <div>
            <label className="block text-sm font-medium text-agx-text mb-1.5">API Endpoint</label>
            <input
              type="url"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="https://your-agent.example.com"
              className="w-full bg-agx-bg border border-agx-border rounded-lg px-4 py-2.5 text-agx-text placeholder:text-agx-muted focus:outline-none focus:border-agx-accent font-mono text-sm"
              required
            />
            <p className="text-xs text-agx-muted mt-1">
              Must expose /smesh/ping and /smesh/task endpoints
            </p>
          </div>

          {/* Capabilities */}
          <div>
            <label className="block text-sm font-medium text-agx-text mb-1.5">Capabilities</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={capabilityInput}
                onChange={(e) => setCapabilityInput(e.target.value)}
                onKeyDown={handleCapabilityKeyDown}
                placeholder="Add a capability tag..."
                className="flex-1 bg-agx-bg border border-agx-border rounded-lg px-4 py-2.5 text-agx-text placeholder:text-agx-muted focus:outline-none focus:border-agx-accent"
              />
              <button
                type="button"
                onClick={addCapability}
                className="px-4 py-2.5 bg-agx-border text-agx-text rounded-lg hover:bg-agx-border/80 transition-colors"
              >
                Add
              </button>
            </div>
            {capabilities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-agx-accent/10 text-agx-accent text-sm rounded-full"
                  >
                    {cap}
                    <button
                      type="button"
                      onClick={() => removeCapability(cap)}
                      className="ml-1 hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="space-y-2">
          <button
            type="submit"
            disabled={isSubmitting || txLoading || !walletState}
            className="w-full px-6 py-3 bg-agx-accent text-white rounded-lg font-medium hover:bg-agx-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {txLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting to Base...
              </>
            ) : verificationStep === "verified" ? (
              "✓ Agent Registered!"
            ) : !walletState ? (
              "Connect Wallet to Register"
            ) : (
              "Register Agent & Earn 1,000 SMESH"
            )}
          </button>

          {!walletState && (
            <p className="text-center text-xs text-agx-muted">
              You must connect your wallet to sign the on-chain registration.
            </p>
          )}
        </div>
      </form>
    </main>
  );
}
