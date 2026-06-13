import React from "react";
import { ShieldCheck } from "lucide-react";

const DIMENSIONS = [
  { key: "buzzword_density", label: "Buzzword Density", invert: true, desc: "Lower is better" },
  { key: "specificity", label: "Specificity", invert: false, desc: "Higher is better" },
  { key: "seniority_realism", label: "Seniority Realism", invert: false, desc: "Higher is better" },
  { key: "technical_depth", label: "Technical Depth", invert: false, desc: "Higher is better" },
  { key: "semantic_redundancy", label: "Semantic Redundancy", invert: true, desc: "Lower is better" },
  { key: "style_entropy", label: "Style Entropy", invert: false, desc: "Higher is better" },
  { key: "verifiability", label: "Verifiability", invert: false, desc: "Higher is better" },
  { key: "ats_manipulation", label: "ATS Manipulation", invert: true, desc: "Lower is better" },
];

function getBarColor(value, invert) {
  const effective = invert ? 100 - value : value;
  if (effective >= 70) return "bg-emerald-500";
  if (effective >= 40) return "bg-amber-500";
  return "bg-red-500";
}

export default function AuthenticityPanel({ authenticityScore, dimensionScores }) {
  if (!dimensionScores) return null;

  return (
    <div className="card-surface p-5 animate-fade-up" data-testid="authenticity-panel" style={{animationDelay:"0.3s"}}>
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-amber-500" />
        <h3 className="mono-label">Authenticity Analysis</h3>
        <span className="ml-auto text-xl font-display font-bold text-[var(--foreground)]">{authenticityScore}<span className="text-sm text-[var(--muted)]">/100</span></span>
      </div>
      <div className="space-y-3">
        {DIMENSIONS.map((dim) => {
          const value = dimensionScores[dim.key] ?? 0;
          return (
            <div key={dim.key} data-testid={`dim-${dim.key}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--foreground)]">{dim.label}</span>
                <span className="text-xs text-[var(--muted-foreground)]">{value} · {dim.desc}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--surface)] overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${getBarColor(value, dim.invert)}`}
                  style={{ width: `${value}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
