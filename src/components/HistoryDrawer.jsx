import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { getAllAnalyses, deleteAnalysis } from "@/lib/history";
import { Clock, FileText, Trash2, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function HistoryDrawer({ open, onOpenChange, onRestore }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (open) {
      getAllAnalyses().then(setEntries).catch(console.error);
    }
  }, [open]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteAnalysis(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Analysis History</SheetTitle>
          <SheetDescription>Your past analyses stored locally in IndexedDB.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-3" data-testid="history-list">
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-10 h-10 text-[var(--muted)] mx-auto mb-3" />
              <p className="text-sm text-[var(--muted-foreground)]">No analyses yet.</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} data-testid={`history-entry-${entry.id}`}
                onClick={() => { onRestore(entry); onOpenChange(false); }}
                className="card-surface p-3 cursor-pointer hover:border-amber-500/30 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{entry.fileName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[var(--muted-foreground)]">{timeAgo(entry.createdAt)}</span>
                      <span className="text-xs text-[var(--muted)]">·</span>
                      <span className="text-xs font-mono">
                        {entry.result?.ats_score_before}
                        <ArrowRight className="w-3 h-3 inline mx-1" />
                        {entry.result?.ats_score_after}
                      </span>
                    </div>
                  </div>
                  <button onClick={(e) => handleDelete(e, entry.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/10 text-[var(--muted)] hover:text-red-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
