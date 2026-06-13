import React, { useState } from "react";
import { Briefcase, ChevronDown, HelpCircle } from "lucide-react";

const MISMATCH_COLORS = {
  none: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  mild: "bg-yellow-400/10 text-yellow-500 border-yellow-400/20",
  moderate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  severe: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function ExperienceRealism({ experienceRealism, unverifiableClaims }) {
  const [claimsOpen, setClaimsOpen] = useState(false);

  if (!experienceRealism) return null;

  const er = experienceRealism;
  const mismatchColor = MISMATCH_COLORS[er.mismatch_severity] || MISMATCH_COLORS.none;

  return (
    <div className="card-surface p-5 animate-fade-up" data-testid="experience-realism" style={{animationDelay:"0.4s"}}>
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-4 h-4 text-amber-500" />
        <h3 className="mono-label">Experience Realism</h3>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-[var(--surface)] p-3 text-center">
          <p className="text-lg font-display font-bold text-[var(--foreground)]">{er.stated_yoe ?? "N/A"}</p>
          <span className="mono-label">Stated YOE</span>
        </div>
        <div className="rounded-lg bg-[var(--surface)] p-3 text-center">
          <p className="text-lg font-display font-bold text-[var(--foreground)] capitalize">{er.implied_seniority}</p>
          <span className="mono-label">Implied Level</span>
        </div>
        <div className="rounded-lg bg-[var(--surface)] p-3 text-center">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${mismatchColor}`}>
            {er.mismatch_severity?.toUpperCase()}
          </span>
          <span className="mono-label block mt-1">Mismatch</span>
        </div>
      </div>
      {er.evidence?.length > 0 && (
        <div className="mb-4">
          <span className="mono-label block mb-2">Evidence</span>
          <ul className="space-y-1">{er.evidence.map((e, i) => (
            <li key={i} className="text-xs text-[var(--muted-foreground)] pl-2 border-l-2 border-amber-500/30">{e}</li>
          ))}</ul>
        </div>
      )}
      {unverifiableClaims?.length > 0 && (
        <div>
          <button onClick={() => setClaimsOpen(!claimsOpen)} data-testid="toggle-unverifiable-claims"
            className="flex items-center gap-2 w-full text-left py-2 px-3 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-raised)] transition-colors">
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-[var(--foreground)]">Unverifiable Claims ({unverifiableClaims.length})</span>
            <ChevronDown className={`w-4 h-4 text-[var(--muted)] ml-auto transition-transform ${claimsOpen ? "rotate-180" : ""}`} />
          </button>
          {claimsOpen && (
            <div className="mt-2 space-y-2">
              {unverifiableClaims.map((c, i) => (
                <div key={i} className="rounded-lg border border-[var(--border)] p-3">
                  <p className="text-xs font-medium text-[var(--foreground)] mb-1.5">"{c.claim}"</p>
                  {c.probing_questions?.map((q, j) => (
                    <p key={j} className="text-[11px] text-amber-400 pl-2">→ {q}</p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
