import Link from "next/link";
import { useState } from "react";
import type { Agent } from "@/lib/api";
import { TipModal } from "./TipModal";

interface AgentCardProps {
  agent: Agent;
  spotlightTier?: "bronze" | "silver" | "gold";
  totalTips?: number;
}

const spotlightColors = {
  bronze: "text-orange-400",
  silver: "text-gray-300",
  gold: "text-agx-gold",
};

const spotlightLabels = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
};

export function AgentCard({ agent, spotlightTier, totalTips }: AgentCardProps) {
  const stars = Math.round(agent.reputationScore);
  const [showTipModal, setShowTipModal] = useState(false);

  return (
    <>
      <div
        className={`bg-agx-surface border rounded-xl p-5 transition-colors ${
          agent.isCore
            ? "border-white/30 hover:border-white/60 ring-1 ring-white/10"
            : agent.promoted
            ? "border-agx-gold/40 hover:border-agx-gold/60"
            : "border-agx-border hover:border-agx-accent/30"
        }`}
      >
        {/* Spotlight badge */}
        {spotlightTier && (
          <div className="flex items-center gap-1 mb-1">
            <svg
              className={`w-4 h-4 ${spotlightColors[spotlightTier]}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className={`text-[10px] font-medium uppercase tracking-wider ${spotlightColors[spotlightTier]}`}>
              {spotlightLabels[spotlightTier]} Spotlight
            </span>
          </div>
        )}

        {/* Demo badge */}
        {agent.isDemo && !agent.isCore && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="px-2 py-0.5 bg-agx-border text-agx-muted text-[10px] font-semibold uppercase tracking-wider rounded">
              Demo
            </span>
            <span className="text-[10px] text-agx-muted">Simulated agent</span>
          </div>
        )}
        {agent.isDemo && agent.isCore && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="px-2 py-0.5 bg-agx-border text-agx-muted text-[10px] font-semibold uppercase tracking-wider rounded">
              Demo
            </span>
          </div>
        )}

        {/* SMESH Core badge */}
        {agent.isCore && (
          <div className="flex items-center gap-1.5 mb-1">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white">
              SMESH Core
            </span>
          </div>
        )}

        {agent.promoted && !spotlightTier && !agent.isCore && (
          <span className="text-[10px] text-agx-gold font-medium uppercase tracking-wider">
            Sponsored
          </span>
        )}

        <div className="flex items-center gap-3 mt-2">
          <div className="w-12 h-12 rounded-full bg-agx-accent/20 flex items-center justify-center text-agx-accent font-bold">
            {agent.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-agx-text">{agent.name}</h3>
              {agent.isVerified && (
                <svg className="w-4 h-4 text-agx-green" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  className={`w-3.5 h-3.5 ${s <= stars ? "text-agx-gold" : "text-agx-border"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-xs text-agx-muted ml-1">{agent.completionCount} done</span>
            </div>
          </div>
        </div>

        {/* Total tips received */}
        {totalTips !== undefined && totalTips > 0 && (
          <div className="mt-2 text-xs text-agx-muted">
            {totalTips.toLocaleString()} SMESH tipped
          </div>
        )}

        {/* Core moat description */}
        {agent.isCore && agent.moatDescription && (
          <p className="mt-3 text-[11px] text-white/50 leading-relaxed border-l-2 border-white/20 pl-2">
            {agent.moatDescription}
          </p>
        )}

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {agent.capabilities.slice(0, 4).map((cap) => (
            <span
              key={cap}
              className="px-2 py-0.5 bg-agx-accent/10 text-agx-accent text-xs rounded"
            >
              {cap}
            </span>
          ))}
          {agent.capabilities.length > 4 && (
            <span className="px-2 py-0.5 text-agx-muted text-xs">
              +{agent.capabilities.length - 4}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-agx-border">
          <Link
            href={`/agents/${agent.id}`}
            className="flex-1 text-center px-3 py-2 bg-agx-bg border border-agx-border text-agx-text text-sm rounded-lg hover:bg-agx-border/50 transition-colors"
          >
            View Profile
          </Link>
          <button
            onClick={() => setShowTipModal(true)}
            className="px-3 py-2 bg-agx-gold/10 border border-agx-gold/30 text-agx-gold text-sm rounded-lg font-medium hover:bg-agx-gold/20 transition-colors"
          >
            Tip
          </button>
          <Link
            href={`/agents/${agent.id}`}
            className="flex-1 text-center px-3 py-2 bg-agx-accent text-black text-sm rounded-lg font-medium hover:bg-agx-accent/90 transition-colors"
          >
            Hire
          </Link>
        </div>
      </div>

      {showTipModal && (
        <TipModal
          agentId={agent.id}
          agentName={agent.name}
          onClose={() => setShowTipModal(false)}
        />
      )}
    </>
  );
}
