import React from "react";
import { UserCheck, ThumbsUp, ThumbsDown, AlertTriangle, CheckCircle } from "lucide-react";

const VERDICT_CONFIG = {
  strong_yes: { label: "STRONG YES", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle },
  yes: { label: "YES", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: ThumbsUp },
  maybe: { label: "MAYBE", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: AlertTriangle },
  no: { label: "NO", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: ThumbsDown },
};

export default function HrPerspective({ data }) {
  if (!data) return null;
  const config = VERDICT_CONFIG[data.verdict] || VERDICT_CONFIG.maybe;
  const Icon = config.icon;

  return (
    <div className="card-surface p-5 animate-fade-up" data-testid="hr-perspective" style={{animationDelay:"0.2s"}}>
      <div className="flex items-center gap-2 mb-4">
        <UserCheck className="w-4 h-4 text-amber-500" />
        <h3 className="mono-label">HR Perspective</h3>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>
          <Icon className="w-3.5 h-3.5" />
          {config.label}
        </span>
      </div>
      {data.first_impression && (
        <p className="text-sm text-[var(--foreground)] mb-3 italic leading-relaxed">"{data.first_impression}"</p>
      )}
      {data.reasoning && (
        <p className="text-sm text-[var(--muted-foreground)] mb-4 leading-relaxed">{data.reasoning}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.strengths?.length > 0 && (
          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3">
            <span className="mono-label text-emerald-400 block mb-2">Strengths</span>
            <ul className="space-y-1">{data.strengths.map((s, i) => (
              <li key={i} className="text-xs text-[var(--foreground)] flex items-start gap-1.5">
                <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />{s}
              </li>
            ))}</ul>
          </div>
        )}
        {data.red_flags?.length > 0 && (
          <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-3">
            <span className="mono-label text-red-400 block mb-2">Red Flags</span>
            <ul className="space-y-1">{data.red_flags.map((f, i) => (
              <li key={i} className="text-xs text-[var(--foreground)] flex items-start gap-1.5">
                <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />{f}
              </li>
            ))}</ul>
          </div>
        )}
      </div>
    </div>
  );
}
