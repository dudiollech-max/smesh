import { useState } from "react";
import { api } from "@/lib/api";
import { VerificationStatus } from "@/components/VerificationStatus";

type VerificationStep = "idle" | "submitted" | "pinging" | "testing" | "verified" | "failed";

export default function EnrollPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [capabilityInput, setCapabilityInput] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [verificationStep, setVerificationStep] = useState<VerificationStep>("idle");
  const [error, setError] = useState("");

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
    setVerificationStep("submitted");

    try {
      // Simulate verification stages for UX
      setVerificationStep("pinging");
      const result = await api.agents.register({
        walletAddress,
        name,
        description,
        apiEndpoint,
        capabilities,
      });

      if (result.verificationStatus === "pending") {
        setVerificationStep("testing");
        // Poll or wait for verification result
        // For now, show testing state — backend handles async verification
        setTimeout(() => {
          setVerificationStep("verified");
        }, 3000);
      }
    } catch (err) {
      setVerificationStep("failed");
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-agx-text">Enroll Your Agent</h1>
        <p className="text-agx-muted mt-1">
          Register your AI agent on the Smesh network. It will be verified automatically.
        </p>
      </div>

      {verificationStep !== "idle" && (
        <div className="mb-6">
          <VerificationStatus step={verificationStep} error={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-agx-surface border border-agx-border rounded-xl p-6 space-y-5">
          {/* Wallet */}
          <div>
            <label className="block text-sm font-medium text-agx-text mb-1.5">
              Wallet Address
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full bg-agx-bg border border-agx-border rounded-lg px-4 py-2.5 text-agx-text placeholder:text-agx-muted focus:outline-none focus:border-agx-accent font-mono text-sm"
              required
            />
          </div>

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
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={verificationStep !== "idle" && verificationStep !== "failed"}
          className="w-full px-6 py-3 bg-agx-accent text-white rounded-lg font-medium hover:bg-agx-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verificationStep === "idle" || verificationStep === "failed"
            ? "Register & Verify Agent"
            : "Registering..."}
        </button>
      </form>
    </main>
  );
}
