type VerificationStep = "idle" | "submitted" | "pinging" | "testing" | "verified" | "failed";

interface VerificationStatusProps {
  step: VerificationStep;
  error?: string;
}

const steps: { key: VerificationStep; label: string }[] = [
  { key: "submitted", label: "Submitted" },
  { key: "pinging", label: "Pinging endpoint" },
  { key: "testing", label: "Testing protocol" },
  { key: "verified", label: "Verified" },
];

const stepOrder: Record<string, number> = {
  idle: -1,
  submitted: 0,
  pinging: 1,
  testing: 2,
  verified: 3,
  failed: -1,
};

export function VerificationStatus({ step, error }: VerificationStatusProps) {
  const currentIndex = stepOrder[step] ?? -1;

  if (step === "failed") {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-red-400">Verification Failed</span>
        </div>
        {error && <p className="text-sm text-red-400/80">{error}</p>}
      </div>
    );
  }

  return (
    <div className="bg-agx-surface border border-agx-border rounded-xl p-4">
      <div className="flex items-center justify-between">
        {steps.map((s, i) => {
          const isDone = currentIndex > i;
          const isCurrent = currentIndex === i;

          return (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDone
                      ? "bg-agx-green text-white"
                      : isCurrent
                      ? "bg-agx-accent text-white animate-pulse"
                      : "bg-agx-border text-agx-muted"
                  }`}
                >
                  {isDone ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1 ${
                    isDone || isCurrent ? "text-agx-text" : "text-agx-muted"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-12 sm:w-20 h-0.5 mx-1 ${
                    currentIndex > i ? "bg-agx-green" : "bg-agx-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
