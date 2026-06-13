import React, { useState } from "react";
import { Copy, Check, ChevronRight, Sparkles, ExternalLink } from "lucide-react";
import { convertSuggestionToLatex, openInOverleaf } from "@/lib/latex";

export default function SuggestionCard({ index, suggestion, onLocate, isOptional }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(suggestion.improved);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInOverleaf = (e) => {
    e.stopPropagation();
    const latex = convertSuggestionToLatex(suggestion);
    openInOverleaf(latex);
  };

  return (
    <div data-testid={`suggestion-card-${index}`} onClick={onLocate}
      className="card-surface p-4 cursor-pointer hover:border-amber-500/30 transition-all duration-200 group">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="mono-label">Rewrite #{index + 1}</span>
          <ChevronRight className="w-3 h-3 text-[var(--muted)] group-hover:text-amber-500 transition-colors" />
          <span className="text-xs text-[var(--muted-foreground)] group-hover:text-amber-500 transition-colors">Click to locate</span>
        </div>
        <div className="flex items-center gap-2">
          {isOptional && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-widest bg-[var(--surface)] text-[var(--muted-foreground)] border border-[var(--border)]">Optional</span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3 h-3" />+{suggestion.impact_points} pts
          </span>

          {/* Open in Overleaf Button */}
          <button
            data-testid={`overleaf-suggestion-${index}`}
            onClick={handleOpenInOverleaf}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 bg-[#47A141]/10 text-[#47A141] border border-[#47A141]/20 hover:bg-[#47A141]/20 hover:scale-105"
            title="Convert to LaTeX & open in Overleaf"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Overleaf</span>
          </button>

          <button data-testid={`copy-suggestion-${index}`} onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-[var(--surface)] transition-colors" title="Copy improved version">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg p-3 bg-red-500/5 border border-red-500/10">
          <span className="mono-label text-red-400 block mb-1.5">Before</span>
          <p className="text-sm text-[var(--foreground)] leading-relaxed line-through opacity-70">{suggestion.original}</p>
        </div>
        <div className="rounded-lg p-3 bg-amber-500/5 border border-amber-500/10">
          <span className="mono-label block mb-1.5 text-amber-400">After</span>
          <p className="text-sm text-[var(--foreground)] leading-relaxed">{suggestion.improved}</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-[var(--border)]">
        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
          <span className="font-semibold text-[var(--foreground)]">Why: </span>{suggestion.reason}
        </p>
      </div>
    </div>
  );
}
