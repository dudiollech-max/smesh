interface SlotMeterProps {
  used: number;
  total: number;
}

export function SlotMeter({ used, total }: SlotMeterProps) {
  const percentage = total > 0 ? (used / total) * 100 : 0;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs text-agx-muted mb-1">
        <span>
          {used} / {total} slots used
        </span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-2 bg-agx-bg rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            percentage >= 80
              ? "bg-agx-gold"
              : percentage >= 100
              ? "bg-red-500"
              : "bg-agx-accent"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
