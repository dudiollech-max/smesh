import { useState } from "react";
import Link from "next/link";
import { approveEscrow } from "@/lib/web3";
import { TxToast, type ToastState } from "@/components/TxToast";
import { parseUnits } from "ethers";

interface CreateTaskProps {
  agentId: number;
  agentName: string;
  onClose: () => void;
}

const REWARD_PRESETS = [10, 50, 100, 500];

export function CreateTask({ agentId, agentName, onClose }: CreateTaskProps) {
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState<string>("10");
  const [approved, setApproved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");
  const [taskId] = useState<string | null>(null);
  const [approvalTxHash, setApprovalTxHash] = useState("");
  const [step, setStep] = useState<"input" | "success">("input");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);

  const rewardNum = Number(reward);
  const isValidReward = rewardNum > 0;
  const agentReceives = isValidReward ? Math.floor(rewardNum * 0.85) : 0;
  const platformFee   = isValidReward ? Math.floor(rewardNum * 0.10) : 0;
  const burned        = isValidReward ? Math.floor(rewardNum * 0.05) : 0;

  function showToast(t: ToastState) {
    setToast(t);
  }

  async function handleApprove() {
    if (!isValidReward) {
      setError("Enter a valid reward amount.");
      return;
    }
    setError("");
    setLoading(true);
    setLoadingLabel("Approving SMESH...");
    showToast({ status: "pending", message: `Approving ${rewardNum} SMESH...` });
    try {
      const amountWei = parseUnits(String(rewardNum), 18);
      const hash = await approveEscrow(amountWei);
      setApprovalTxHash(hash);
      setApproved(true);
      showToast({ status: "success", message: "SMESH approved ✅", txHash: hash });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Approval failed";
      setError(msg);
      showToast({ status: "error", message: msg });
    } finally {
      setLoading(false);
      setLoadingLabel("");
    }
  }

  async function handleCreate() {
    if (!approved) {
      setError("Please approve SMESH first.");
      return;
    }
    if (!description.trim()) {
      setError("Task description is required.");
      return;
    }

    setError("");
    setLoading(true);
    setLoadingLabel("Creating task...");
    showToast({ status: "pending", message: "Creating task..." });

    try {
      // The actual escrow.hold() is called by the backend after you've approved.
      // Post to backend to create the task record.
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          description,
          reward: rewardNum,
          onChainApprovalTxHash: approvalTxHash,
        }),
      });

      if (!res.ok) throw new Error("Failed to create task");

      showToast({
        status: "success",
        message: `Task created! ${agentName} will handle it.`,
        txHash: approvalTxHash,
      });
      setStep("success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Task creation failed";
      setError(msg);
      showToast({ status: "error", message: msg });
    } finally {
      setLoading(false);
      setLoadingLabel("");
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
              <h3 className="text-lg font-semibold text-agx-text">Create Task</h3>
              <p className="text-xs text-agx-muted mt-0.5">Hire {agentName} with SMESH</p>
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

          {/* Success */}
          {step === "success" ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">✅</div>
              <h4 className="text-lg font-semibold text-agx-green mb-1">Task Created!</h4>
              <p className="text-agx-muted text-sm mb-2">
                {agentName} will process your task.
              </p>
              {taskId && (
                <p className="text-xs text-agx-muted font-mono bg-agx-bg rounded px-2 py-1 inline-block mb-4">
                  Task ID: {taskId}
                </p>
              )}
              {approvalTxHash && approvalTxHash !== "0x_already_approved" && (
                <Link
                  href={`https://basescan.org/tx/${approvalTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-agx-accent hover:underline block mb-4"
                >
                  View approval on Basescan →
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

              {/* Reward */}
              <div>
                <label className="text-sm font-medium text-agx-text block mb-2">
                  Reward (SMESH)
                </label>
                <div className="flex gap-2 mb-2">
                  {REWARD_PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => { setReward(String(p)); setApproved(false); }}
                      className={`flex-1 py-1.5 rounded-lg text-sm border transition-all ${
                        reward === String(p)
                          ? "bg-agx-accent text-black border-agx-accent"
                          : "bg-agx-bg border-agx-border text-agx-muted hover:text-agx-text"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  value={reward}
                  onChange={(e) => { setReward(e.target.value); setApproved(false); }}
                  placeholder="Custom amount"
                  className="w-full px-3 py-2 bg-agx-bg border border-agx-border rounded-lg text-agx-text placeholder:text-agx-muted/50 focus:outline-none focus:border-agx-accent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-agx-text block mb-1.5">
                  Task Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe what you need the agent to do..."
                  className="w-full px-3 py-2.5 bg-agx-bg border border-agx-border rounded-lg text-agx-text placeholder:text-agx-muted/50 focus:outline-none focus:border-agx-accent resize-none text-sm"
                />
              </div>

              {/* Fee breakdown */}
              {isValidReward && (
                <div className="bg-agx-bg rounded-lg p-3 text-xs text-agx-muted space-y-1.5 border border-agx-border/50">
                  <p className="text-agx-text font-medium text-xs mb-2">Fee breakdown</p>
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

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleApprove}
                  disabled={loading || approved || !isValidReward}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    approved
                      ? "bg-agx-green/10 border-agx-green/40 text-agx-green cursor-default"
                      : "bg-agx-bg border-agx-border text-agx-text hover:border-agx-accent disabled:opacity-50"
                  }`}
                >
                  {loading && loadingLabel.includes("Approv") ? (
                    <span className="flex items-center justify-center gap-1"><Spinner /> Approving...</span>
                  ) : approved ? (
                    "✓ Approved"
                  ) : (
                    "Approve SMESH"
                  )}
                </button>

                <button
                  onClick={handleCreate}
                  disabled={loading || !approved || !description.trim()}
                  className="py-2.5 bg-agx-accent text-black rounded-lg text-sm font-medium hover:bg-agx-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {loading && loadingLabel.includes("Creating") ? (
                    <><Spinner /> Creating...</>
                  ) : (
                    "Create Task →"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin inline" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
