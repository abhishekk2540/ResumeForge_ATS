import React, { useRef, useEffect, useMemo } from "react";

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenOverlap(a, b) {
  const tokensA = normalizeText(a).split(" ").filter(Boolean);
  const tokensB = normalizeText(b).split(" ").filter(Boolean);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setB = new Set(tokensB);
  let overlap = 0;
  for (const t of tokensA) {
    if (setB.has(t)) overlap++;
  }
  return overlap / Math.max(tokensA.length, tokensB.length);
}

export default function PdfHighlightViewer({
  pages,
  aiDetectedLines = [],
  highlightId,
  onHighlightClick,
}) {
  const containerRef = useRef(null);
  const highlightRefs = useRef({});

  // Match AI detected lines to line boxes — produce stable matchIds
  const matchedHighlights = useMemo(() => {
    if (!pages || !aiDetectedLines.length) return [];

    const matches = [];
    for (let detIdx = 0; detIdx < aiDetectedLines.length; detIdx++) {
      const detected = aiDetectedLines[detIdx];
      let bestMatch = null;
      let bestScore = 0;

      for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
        const page = pages[pageIdx];
        for (const lineBox of page.lineBoxes) {
          const score = tokenOverlap(detected.text, lineBox.text);
          if (score > bestScore && score >= 0.35) {
            bestScore = score;
            bestMatch = {
              pageIdx,
              lineBox,
              detected,
              detIdx,
              matchId: `hl-${detIdx}`,
            };
          }
        }
      }

      if (bestMatch) matches.push(bestMatch);
    }

    return matches;
  }, [pages, aiDetectedLines]);

  // Scroll to highlight
  useEffect(() => {
    if (!highlightId) return;
    const el = highlightRefs.current[highlightId];
    if (!el) return;

    const scrollContainer = containerRef.current?.closest('[data-testid="pdf-scroll-container"]');
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const scrollTop = scrollContainer.scrollTop;
      const targetTop = elRect.top - containerRect.top + scrollTop - containerRect.height / 2 + elRect.height / 2;
      scrollContainer.scrollTo({ top: targetTop, behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId]);

  const severityClass = (severity) => {
    switch (severity) {
      case "high": return "highlight-high";
      case "medium": return "highlight-medium";
      case "low": return "highlight-low";
      default: return "highlight-low";
    }
  };

  if (!pages || pages.length === 0) return null;

  return (
    <div ref={containerRef} data-testid="pdf-highlight-viewer">
      {/* Severity Legend */}
      <div className="flex items-center gap-3 mb-3 flex-wrap" data-testid="severity-legend">
        <span className="mono-label">Severity:</span>
        <span className="inline-flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-sm bg-red-500/30 border border-red-500/40" />
          High
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-sm bg-amber-500/30 border border-amber-500/40" />
          Medium
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-sm bg-yellow-400/30 border border-yellow-400/40" />
          Low
        </span>
      </div>

      {/* PDF Pages */}
      {pages.map((page, pageIdx) => (
        <div
          key={pageIdx}
          className="pdf-page-wrapper relative mb-4 rounded-lg overflow-hidden border border-[var(--border)] shadow-lg"
          style={{ width: "100%" }}
        >
          <img
            src={page.dataUrl}
            alt={`Resume page ${pageIdx + 1}`}
            className="w-full h-auto block"
            data-testid={`pdf-page-${pageIdx}`}
          />

          {/* Highlight overlays */}
          {matchedHighlights
            .filter((m) => m.pageIdx === pageIdx)
            .map((match) => {
              const { lineBox, detected, matchId } = match;

              const leftPct = (lineBox.x / page.width) * 100;
              const topPct = (lineBox.y / page.height) * 100;
              const widthPct = (lineBox.width / page.width) * 100;
              const heightPct = (lineBox.height / page.height) * 100;

              const isActive = highlightId === matchId;

              return (
                <div
                  key={matchId}
                  ref={(el) => (highlightRefs.current[matchId] = el)}
                  data-testid={`highlight-${matchId}`}
                  data-match-id={matchId}
                  className={`absolute cursor-pointer transition-all duration-300 ${severityClass(
                    detected.severity
                  )} ${isActive ? "animate-pulse-ring ring-2 ring-amber-500 z-10" : ""}`}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${Math.max(widthPct, 5)}%`,
                    height: `${Math.max(heightPct, 1.5)}%`,
                  }}
                  title={`${detected.pattern} (${detected.severity}): ${detected.text}`}
                  onClick={() => onHighlightClick?.(matchId, detected)}
                />
              );
            })}
        </div>
      ))}
    </div>
  );
}
