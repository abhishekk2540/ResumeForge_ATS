import React from "react";

export default function AtsScoreRing({ score, label, size = 120, color = "#f59e0b" }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const dashOffset = circumference - progress;

  return (
    <div className="flex flex-col items-center gap-2" data-testid={`score-ring-${label?.toLowerCase().replace(/\s/g,'-')}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} stroke="var(--border)" strokeWidth={strokeWidth} fill="none" />
          <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round"
            className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-display font-bold text-[var(--foreground)]">{score}</span>
          <span className="text-[10px] text-[var(--muted-foreground)]">/100</span>
        </div>
      </div>
      {label && <span className="mono-label mt-1">{label}</span>}
    </div>
  );
}
