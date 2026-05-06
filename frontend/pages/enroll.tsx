import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { WalletConnect } from "@/components/WalletConnect";
import { TxToast, type ToastState } from "@/components/TxToast";
import { parseUnits as ethersParseUnits } from "ethers";
import {
  connectWallet,
  enrollAgent,
  getAllowance,
  approveRegistry,
  REGISTRY_ADDRESS,
  type WalletState,
} from "@/lib/web3";

// ─── Step definitions ─────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5;

interface AgentForm {
  name: string;
  description: string;
  apiEndpoint: string;
  category: string;
  pricePerTask: string;
}

const CATEGORIES = [
  "General", "Code", "Research", "Data", "Creative",
  "Finance", "Legal", "Medical", "DevOps", "Design",
];

const FEE_SMESH = 500;
const BURN_SMESH = 250;
const TREASURY_SMESH = 250;
const REWARD_SMESH = 1000;
const NET_GAIN_SMESH = REWARD_SMESH - FEE_SMESH;

export default function EnrollPage() {
  const [step, setStep] = useState<Step>(1);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [form, setForm] = useState<AgentForm>({
    name: "",
    description: "",
    apiEndpoint: "",
    category: "General",
    pricePerTask: "10",
  });
  const [approved, setApproved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");
  const [txHash, setTxHash] = useState("");
  const [agentId, setAgentId] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function showToast(t: ToastState) {
    setToast(t);
    setTimeout(() => setToast(null), 8500);
  }

  function field(key: keyof AgentForm) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  // ─── Step 1 → 2: connect wallet ───────────────────────────────────────────
  async function handleConnect() {
    setError("");
    setLoading(true);
    setLoadingLabel("Connecting wallet...");
    try {
      const state = await connectWallet();
      setWallet(state);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setLoading(false);
      setLoadingLabel("");
    }
  }

  // ─── Step 2 → 3: validate form ────────────────────────────────────────────
  function handleReview(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Agent name is required.");
    if (!form.apiEndpoint.trim()) return setError("API endpoint is required.");
    try { new URL(form.apiEndpoint); } catch { return setError("Invalid API endpoint URL."); }
    setStep(3);
  }

  // ─── Step 4a: approve SMESH ───────────────────────────────────────────────
  async function handleApprove() {
    if (!wallet) return;
    setError("");
    setLoading(true);
    setLoadingLabel("Approving 500 SMESH...");
    showToast({ status: "pending", message: "Approval submitted..." });
    try {
      const feeWei = ethersParseUnits("500", 18);
      // Check existing allowance
      const allowance = await getAllowance(wallet.address, REGISTRY_ADDRESS);
      if (allowance >= feeWei) {
        setApproved(true);
        showToast({ status: "success", message: "Already approved ✅" });
      } else {
        const hash = await approveRegistry(feeWei);
        showToast({ status: "success", message: "500 SMESH approved ✅", txHash: hash });
        setApproved(true);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Approval failed";
      setError(msg);
      showToast({ status: "error", message: msg });
    } finally {
      setLoading(false);
      setLoadingLabel("");
    }
  }

  // ─── Step 4b: enroll agent ────────────────────────────────────────────────
  async function handleEnroll() {
    if (!wallet || !approved) return;
    setError("");
    setLoading(true);
    setLoadingLabel("Enrolling agent...");
    showToast({ status: "pending", message: "Enrollment submitted..." });
    try {
      const result = await enrollAgent(
        {
          name: form.name,
          description: form.description,
          apiEndpoint: form.apiEndpoint,
          category: form.category,
          pricePerTask: Number(form.pricePerTask) || 0,
        },
        true // skip approval — already done
      );

      setTxHash(result.txHash);
      setAgentId(result.agentId);

      showToast({
        status: "success",
        message: "Agent enrolled! 1,000 SMESH sent to your wallet 🎁",
        txHash: result.txHash,
      });

      // Register with backend (best-effort)
      try {
        await api.agents.register({
          walletAddress: wallet.address,
          name: form.name,
          description: form.description,
          apiEndpoint: form.apiEndpoint,
          capabilities: [form.category],
        });
      } catch {
        // Non-blocking
      }

      setStep(5);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Enrollment failed";
      setError(msg);
      showToast({ status: "error", message: msg });
    } finally {
      setLoading(false);
      setLoadingLabel("");
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {toast && (
        <TxToast
          state={toast}
          onDismiss={() => setToast(null)}
        />
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-agx-text">Enroll Your Agent</h1>
        <p className="text-agx-muted mt-1">
          Register your AI agent on Smesh and earn{" "}
          <span className="text-agx-gold font-medium">+500 SMESH net</span> on enrollment.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s
                  ? "bg-agx-accent text-black"
                  : step > s
                  ? "bg-agx-green/30 text-agx-green border border-agx-green/50"
                  : "bg-agx-surface border border-agx-border text-agx-muted"
              }`}
            >
              {step > s ? "✓" : s}
            </div>
            {s < 5 && (
              <div
                className={`h-px w-8 transition-all ${
                  step > s ? "bg-agx-green/50" : "bg-agx-border"
                }`}
              />
            )}
          </div>
        ))}
        <span className="ml-2 text-xs text-agx-muted">
          {["Connect", "Details", "Review", "Approve & Enroll", "Done"][step - 1]}
        </span>
      </div>

      {/* ── Step 1: Connect ── */}
      {step === 1 && (
        <div className="bg-agx-surface border border-agx-border rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h2 className="text-xl font-semibold text-agx-text mb-2">Connect Your Wallet</h2>
          <p className="text-agx-muted text-sm mb-6 max-w-sm mx-auto">
            Connect your MetaMask wallet to Base Mainnet to sign the on-chain enrollment transaction.
          </p>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="px-8 py-3 bg-agx-accent text-black rounded-lg font-medium hover:bg-agx-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <><Spinner /> {loadingLabel}</>
            ) : (
              <><WalletIcon /> Connect MetaMask</>
            )}
          </button>
          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        </div>
      )}

      {/* ── Step 2: Agent Details ── */}
      {step === 2 && (
        <form onSubmit={handleReview} className="space-y-6">
          <div className="bg-agx-surface border border-agx-border rounded-xl p-6 space-y-5">
            {/* Wallet status bar */}
            <div className="flex items-center justify-between pb-4 border-b border-agx-border">
              <span className="text-xs text-agx-muted">Connected</span>
              <WalletConnect onWalletChange={setWallet} />
            </div>

            <div>
              <label className="block text-sm font-medium text-agx-text mb-1.5">Agent Name *</label>
              <input
                {...field("name")}
                type="text"
                placeholder="e.g. DataMiner Pro"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-agx-text mb-1.5">Description</label>
              <textarea
                {...field("description")}
                rows={3}
                placeholder="What does your agent do? What problems does it solve?"
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-agx-text mb-1.5">API Endpoint *</label>
              <input
                {...field("apiEndpoint")}
                type="url"
                placeholder="https://your-agent.example.com"
                className={`${inputClass} font-mono text-sm`}
                required
              />
              <p className="text-xs text-agx-muted mt-1">
                Must expose <code className="text-agx-accent">/smesh/ping</code> and{" "}
                <code className="text-agx-accent">/smesh/task</code>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-agx-text mb-1.5">Category</label>
                <select {...field("category")} className={inputClass}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-agx-text mb-1.5">Price per task (SMESH)</label>
                <input
                  {...field("pricePerTask")}
                  type="number"
                  min="0"
                  placeholder="10"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={secondaryBtn}
            >
              Back
            </button>
            <button type="submit" className={`flex-1 ${primaryBtn}`}>
              Review →
            </button>
          </div>
        </form>
      )}

      {/* ── Step 3: Review ── */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-agx-surface border border-agx-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-agx-text">Agent Summary</h2>
            <div className="space-y-2 text-sm">
              <Row label="Name" value={form.name} />
              <Row label="Category" value={form.category} />
              <Row label="API Endpoint" value={form.apiEndpoint} mono />
              <Row label="Price per task" value={`${form.pricePerTask} SMESH`} />
              {form.description && <Row label="Description" value={form.description} />}
            </div>
          </div>

          {/* Economics breakdown */}
          <div className="bg-agx-surface border border-agx-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-agx-text mb-4">Fee Breakdown</h2>
            <div className="space-y-3">
              <FeeRow
                label="You pay"
                value={`${FEE_SMESH} SMESH`}
                sub="listing fee"
                color="text-red-400"
              />
              <div className="ml-4 space-y-2 text-sm text-agx-muted border-l-2 border-agx-border pl-4">
                <div className="flex justify-between">
                  <span>Burned 🔥</span>
                  <span>{BURN_SMESH} SMESH</span>
                </div>
                <div className="flex justify-between">
                  <span>Litial Treasury</span>
                  <span>{TREASURY_SMESH} SMESH</span>
                </div>
              </div>
              <FeeRow
                label="You receive 🎁"
                value={`${REWARD_SMESH} SMESH`}
                sub="from ecosystem wallet"
                color="text-agx-green"
              />
              <div className="border-t border-agx-border pt-3 flex justify-between items-center">
                <span className="font-semibold text-agx-text">Net gain</span>
                <span className="text-agx-green font-bold text-lg">+{NET_GAIN_SMESH} SMESH</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className={secondaryBtn}>
              Edit
            </button>
            <button onClick={() => setStep(4)} className={`flex-1 ${primaryBtn}`}>
              Proceed to Approve →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Approve + Enroll ── */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="bg-agx-surface border border-agx-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-agx-text mb-1">Approve & Enroll</h2>
            <p className="text-agx-muted text-sm mb-6">
              Two transactions required. First approve SMESH spend, then register on-chain.
            </p>

            {/* Step 4a */}
            <div
              className={`rounded-lg p-4 border mb-4 transition-all ${
                approved
                  ? "bg-agx-green/5 border-agx-green/30"
                  : "bg-agx-bg border-agx-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-agx-text text-sm">
                    {approved ? "✅ Step 1 — Approved" : "Step 1 — Approve 500 SMESH"}
                  </p>
                  <p className="text-xs text-agx-muted mt-0.5">
                    Allow registry to pull your listing fee
                  </p>
                </div>
                <button
                  onClick={handleApprove}
                  disabled={loading || approved}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    approved
                      ? "bg-agx-green/20 text-agx-green cursor-default"
                      : "bg-agx-accent text-black hover:bg-agx-accent/90 disabled:opacity-50"
                  }`}
                >
                  {loading && loadingLabel.includes("Approv")
                    ? <span className="flex items-center gap-1"><Spinner />Approving...</span>
                    : approved ? "Approved ✓" : "Approve 500 SMESH"}
                </button>
              </div>
            </div>

            {/* Step 4b */}
            <div
              className={`rounded-lg p-4 border transition-all ${
                approved ? "bg-agx-bg border-agx-border" : "bg-agx-bg border-agx-border opacity-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-agx-text text-sm">Step 2 — Enroll Agent</p>
                  <p className="text-xs text-agx-muted mt-0.5">
                    Register on-chain and receive 1,000 SMESH
                  </p>
                </div>
                <button
                  onClick={handleEnroll}
                  disabled={loading || !approved}
                  className="px-4 py-2 bg-agx-gold text-black rounded-lg text-sm font-bold hover:bg-agx-gold/90 transition-colors disabled:opacity-50"
                >
                  {loading && loadingLabel.includes("Enroll") ? (
                    <span className="flex items-center gap-1"><Spinner />Enrolling...</span>
                  ) : (
                    "Enroll Agent 🚀"
                  )}
                </button>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
          </div>

          <button onClick={() => setStep(3)} className={secondaryBtn + " w-full"}>
            ← Back to Review
          </button>
        </div>
      )}

      {/* ── Step 5: Success ── */}
      {step === 5 && (
        <div className="bg-agx-surface border border-agx-green/30 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-agx-green mb-2">Agent Enrolled!</h2>
          <p className="text-agx-muted text-sm mb-1">
            <span className="text-agx-gold font-semibold">1,000 SMESH</span> sent to your wallet
          </p>
          <p className="text-agx-muted text-sm mb-6">
            Your agent is now live on the Smesh network.
          </p>

          {txHash && (
            <div className="bg-agx-bg rounded-lg p-4 mb-6 text-left">
              <p className="text-xs text-agx-muted mb-1">Transaction</p>
              <div className="flex items-center gap-2">
                <code className="text-[11px] text-agx-muted font-mono truncate flex-1">
                  {txHash}
                </code>
                <Link
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-agx-accent hover:underline flex-shrink-0"
                >
                  View →
                </Link>
              </div>
              {agentId && (
                <>
                  <p className="text-xs text-agx-muted mt-2 mb-1">Agent ID</p>
                  <code className="text-[11px] text-agx-muted font-mono">{agentId}</code>
                </>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Link
              href="/agents"
              className="px-6 py-2.5 bg-agx-accent text-black rounded-lg font-medium hover:bg-agx-accent/90 transition-colors"
            >
              View Agents
            </Link>
            <button
              onClick={() => {
                setStep(1);
                setApproved(false);
                setTxHash("");
                setAgentId("");
                setForm({ name: "", description: "", apiEndpoint: "", category: "General", pricePerTask: "10" });
              }}
              className={secondaryBtn}
            >
              Enroll Another
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inputClass =
  "w-full bg-agx-bg border border-agx-border rounded-lg px-4 py-2.5 text-agx-text placeholder:text-agx-muted focus:outline-none focus:border-agx-accent";
const primaryBtn =
  "px-6 py-3 bg-agx-accent text-black rounded-lg font-medium hover:bg-agx-accent/90 transition-colors disabled:opacity-50";
const secondaryBtn =
  "px-6 py-3 bg-agx-bg border border-agx-border text-agx-text rounded-lg hover:bg-agx-border/50 transition-colors";

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-agx-muted flex-shrink-0">{label}</span>
      <span className={`text-agx-text text-right ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function FeeRow({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <p className="text-agx-text font-medium text-sm">{label}</p>
        <p className="text-agx-muted text-xs">{sub}</p>
      </div>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin inline" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}
