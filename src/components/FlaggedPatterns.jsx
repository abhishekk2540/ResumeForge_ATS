import React from "react";
import { AlertOctagon } from "lucide-react";

const SEV_COLORS = {
  high: "border-red-500/20 bg-red-500/5",
  medium: "border-amber-500/20 bg-amber-500/5",
  low: "border-yellow-400/20 bg-yellow-400/5",
};

const SEV_BADGE = {
  high: "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-yellow-400/10 text-yellow-500 border-yellow-400/20",
};

export default function FlaggedPatterns({ patterns, onScrollTo }) {
  if (!patterns?.length) return null;

  return (
    <div className="card-surface p-5 animate-fade-up" data-testid="flagged-patterns" style={{animationDelay:"0.5s"}}>
      <div className="flex items-center gap-2 mb-4">
        <AlertOctagon className="w-4 h-4 text-amber-500" />
        <h3 className="mono-label">Flagged Patterns</h3>
        <span className="ml-auto text-xs text-[var(--muted-foreground)]">{patterns.length} detected</span>
      </div>
      <div className="space-y-3">
        {patterns.map((p, i) => (
          <div key={i} className={`rounded-lg border p-3 cursor-pointer hover:scale-[1.01] transition-all ${SEV_COLORS[p.severity] || SEV_COLORS.low}`}
            data-testid={`flagged-pattern-${i}`}
            onClick={() => onScrollTo?.(p)}>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-sm font-medium text-[var(--foreground)]">{p.name}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${SEV_BADGE[p.severity] || SEV_BADGE.low}`}>{p.severity}</span>
              {p.category && <span className="text-[10px] text-[var(--muted-foreground)] font-mono">{p.category}</span>}
            </div>
            {p.examples?.length > 0 && (
              <div className="mb-2 space-y-1">
                {p.examples.map((ex, j) => (
                  <p key={j} className="text-xs text-[var(--muted-foreground)] italic pl-2 border-l-2 border-[var(--border)]">"{ex}"</p>
                ))}
              </div>
            )}
            {p.why_it_matters && <p className="text-xs text-[var(--muted-foreground)]">{p.why_it_matters}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
