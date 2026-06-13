import React, { useState, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  Zap, Trash2, FileDown, Loader2, CheckCircle2,
  ArrowRight, Tag, ChevronDown, Sparkles, ExternalLink, FileCode2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import PdfUploader from "./PdfUploader";
import PdfHighlightViewer from "./PdfHighlightViewer";
import AtsScoreRing from "./AtsScoreRing";
import HrPerspective from "./HrPerspective";
import AuthenticityPanel from "./AuthenticityPanel";
import FlaggedPatterns from "./FlaggedPatterns";
import ExperienceRealism from "./ExperienceRealism";
import SuggestionCard from "./SuggestionCard";
import { analyzeResume } from "@/lib/llm";
import { saveAnalysis } from "@/lib/history";
import { exportAnalysisPdf } from "@/lib/pdf";
import { convertResumeToLatex, convertResumeWithImprovementsToLatex, openInOverleaf } from "@/lib/latex";

const SAMPLE_JD = `Senior Frontend Engineer — React/TypeScript

We're looking for a Senior Frontend Engineer to join our platform team. You'll lead the development of our customer-facing dashboard, optimize performance, and mentor junior developers.

Requirements:
• 5+ years of experience with React, TypeScript, and modern frontend tooling
• Deep understanding of state management (Redux, Zustand, or React Query)
• Experience with CI/CD pipelines, testing (Jest, Playwright), and monitoring
• Strong knowledge of web performance optimization, accessibility (WCAG 2.1)
• Experience with design systems and component libraries
• Excellent communication and code review skills

Nice to have:
• Experience with Next.js or Remix
• GraphQL / REST API design
• Micro-frontend architecture
• Familiarity with Figma and design workflows

We offer competitive salary, remote-first culture, and equity.`;

export default function Analyzer() {
  const [parsedFile, setParsedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const abortRef = useRef(null);

  const canAnalyze = !!(
    sessionStorage.getItem("byok_llm_key") &&
    parsedFile?.fullText &&
    jobDescription.trim()
  );

  const handleAnalyze = useCallback(async () => {
    const apiKey = sessionStorage.getItem("byok_llm_key");
    const provider = sessionStorage.getItem("byok_provider") || "openrouter";
    if (!apiKey || !parsedFile?.fullText || !jobDescription.trim()) return;

    setAnalyzing(true);
    setResult(null);
    abortRef.current = new AbortController();

    try {
      const res = await analyzeResume({
        provider,
        apiKey,
        resume: parsedFile.fullText,
        jobDescription,
        signal: abortRef.current.signal,
      });
      setResult(res);
      toast.success("Analysis complete!");

      // Save to history
      try {
        await saveAnalysis({
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          fileName: parsedFile.fileName,
          fileBlob: parsedFile.file,
          resumeText: parsedFile.fullText,
          jobDescription,
          result: res,
        });
      } catch (e) {
        console.error("Failed to save to history:", e);
      }

      // Auto-scroll to results
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch (err) {
      toast.error(err.message || "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  }, [parsedFile, jobDescription]);

  const handleJdKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canAnalyze && !analyzing) {
      handleAnalyze();
    }
  };

  const handleClear = () => {
    setParsedFile(null);
    setJobDescription("");
    setResult(null);
    setHighlightId(null);
  };

  const handleExport = () => {
    if (!result) return;
    exportAnalysisPdf(result, parsedFile?.fileName);
    toast.success("PDF report exported!");
  };

  const handleRestore = useCallback((entry) => {
    if (entry.fileBlob) {
      const file = new File([entry.fileBlob], entry.fileName || "resume.pdf", { type: "application/pdf" });
      import("@/lib/pdfUtils").then(({ parsePdf }) => {
        parsePdf(file).then((parsed) => {
          setParsedFile({
            file,
            fileName: entry.fileName,
            pages: parsed.pages,
            fullText: parsed.fullText,
          });
        });
      });
    } else if (entry.resumeText) {
      setParsedFile({ file: null, fileName: entry.fileName, pages: [], fullText: entry.resumeText });
    }
    setJobDescription(entry.jobDescription || "");
    setResult(entry.result || null);
    toast.success("Analysis restored from history");
  }, []);

  // Expose handleRestore via window for HistoryDrawer
  React.useEffect(() => {
    window.__atsRestore = handleRestore;
    return () => { delete window.__atsRestore; };
  }, [handleRestore]);

  const handleSuggestionLocate = useCallback((suggestion) => {
    if (!result?.ai_detected_lines?.length || !parsedFile?.pages?.length) {
      toast.error("No PDF highlights to locate.");
      return;
    }

    const normalizeText = (t) => t.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
    const origNorm = normalizeText(suggestion.original);
    const origTokens = origNorm.split(" ").filter(Boolean);

    // Strategy 1: Match suggestion.original against ai_detected_lines directly
    let bestDetIdx = -1;
    let bestScore = 0;

    for (let i = 0; i < result.ai_detected_lines.length; i++) {
      const det = result.ai_detected_lines[i];
      const detNorm = normalizeText(det.text);
      const detTokens = detNorm.split(" ").filter(Boolean);
      const setDet = new Set(detTokens);
      let overlap = 0;
      for (const t of origTokens) { if (setDet.has(t)) overlap++; }
      const score = overlap / Math.max(origTokens.length, detTokens.length);
      if (score > bestScore) {
        bestScore = score;
        bestDetIdx = i;
      }
    }

    if (bestDetIdx >= 0 && bestScore >= 0.3) {
      const matchId = `hl-${bestDetIdx}`;
      setHighlightId(null);
      // Force re-trigger by using requestAnimationFrame
      requestAnimationFrame(() => {
        setHighlightId(matchId);
        setTimeout(() => setHighlightId(null), 5000);
      });
      return;
    }

    // Strategy 2: Fallback — match suggestion.original against page lineBoxes,
    // then find the closest ai_detected_line for that lineBox
    for (let pageIdx = 0; pageIdx < parsedFile.pages.length; pageIdx++) {
      for (const lb of parsedFile.pages[pageIdx].lineBoxes) {
        const lbNorm = normalizeText(lb.text);
        const lbTokens = lbNorm.split(" ").filter(Boolean);
        const setLb = new Set(lbTokens);
        let overlap = 0;
        for (const t of origTokens) { if (setLb.has(t)) overlap++; }
        const score = overlap / Math.max(origTokens.length, lbTokens.length);
        if (score >= 0.35) {
          // Find which ai_detected_line best matches this lineBox
          let closestDetIdx = -1;
          let closestDetScore = 0;
          for (let i = 0; i < result.ai_detected_lines.length; i++) {
            const det = result.ai_detected_lines[i];
            const detNorm = normalizeText(det.text);
            const detTokens = detNorm.split(" ").filter(Boolean);
            const setDet = new Set(detTokens);
            let ov = 0;
            for (const t of lbTokens) { if (setDet.has(t)) ov++; }
            const s = ov / Math.max(lbTokens.length, detTokens.length);
            if (s > closestDetScore) {
              closestDetScore = s;
              closestDetIdx = i;
            }
          }
          if (closestDetIdx >= 0 && closestDetScore >= 0.3) {
            const matchId = `hl-${closestDetIdx}`;
            setHighlightId(null);
            requestAnimationFrame(() => {
              setHighlightId(matchId);
              setTimeout(() => setHighlightId(null), 5000);
            });
            return;
          }
        }
      }
    }

    toast.info("Could not locate this line in the PDF.");
  }, [result, parsedFile]);

  // ── Overleaf / LaTeX handlers ──
  const handleConvertFullToLatex = useCallback(() => {
    if (!parsedFile?.fullText) return;
    const latex = convertResumeToLatex(parsedFile.fullText);
    const result = openInOverleaf(latex);
    if (result.fallback) {
      toast.info("LaTeX copied to clipboard — paste it in Overleaf. Allow popups to open directly.");
    } else {
      toast.success("Opening your resume in Overleaf — allow popups if prompted!");
    }
  }, [parsedFile]);

  const handleConvertImprovedToLatex = useCallback(() => {
    if (!parsedFile?.fullText || !result?.suggestions?.length) return;
    const latex = convertResumeWithImprovementsToLatex(parsedFile.fullText, result.suggestions);
    const res = openInOverleaf(latex);
    if (res.fallback) {
      toast.info("LaTeX copied to clipboard — paste it in Overleaf. Allow popups to open directly.");
    } else {
      toast.success("Opening improved resume in Overleaf — allow popups if prompted!");
    }
  }, [parsedFile, result]);

  const requiredSuggestions = useMemo(() =>
    result?.suggestions?.filter((s) => s.priority === "required") || [], [result]);
  const optionalSuggestions = useMemo(() =>
    result?.suggestions?.filter((s) => s.priority === "optional") || [], [result]);

  return (
    <div className="relative z-10">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-12 text-center" data-testid="hero-section">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Local-First · BYOK
          </span>
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Privacy First
          </span>
        </div>

        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--foreground)] mb-4">
          Resume{" "}
          <span className="gradient-text-amber">Intelligence</span>
          <br />for the ATS era.
        </h2>
        <p className="text-[var(--muted-foreground)] max-w-xl mx-auto mb-8">
          Upload your resume, paste a job description, and get a brutal ATS audit with
          line-by-line rewrites — export to LaTeX & Overleaf with one click.
        </p>

        {/* Stat Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-12">
          {[
            { value: "8", label: "Authenticity Dimensions" },
            { value: "0", label: "Servers Your Data Touches" },
            { value: "100%", label: "Your Key, Your Data" },
            { value: "85+", label: "Target ATS Score" },
          ].map((stat, i) => (
            <div key={i} className={`card-surface p-4 anim-float`}
              style={{ animationDelay: `${i * 0.3}s` }}>
              <p className="text-xl font-display font-bold text-amber-500">{stat.value}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Input Section */}
      <section className="max-w-5xl mx-auto px-4 pb-8" data-testid="input-section">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PDF Upload */}
          <div>
            <label className="mono-label block mb-2">Resume PDF</label>
            <PdfUploader onParsed={setParsedFile} parsedFile={parsedFile} />
          </div>

          {/* Job Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="mono-label">Job Description</label>
              <button data-testid="load-sample-jd" onClick={() => setJobDescription(SAMPLE_JD)}
                className="text-[10px] font-mono text-amber-500 hover:underline uppercase tracking-widest">
                Load Sample JD
              </button>
            </div>
            <Textarea data-testid="jd-textarea" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
              onKeyDown={handleJdKeyDown} placeholder="Paste the job description here..."
              className="min-h-[200px]" />
            <p className="text-[10px] text-[var(--muted)] mt-1 font-mono">Ctrl+Enter to analyze</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
          <Button data-testid="analyze-btn" onClick={handleAnalyze} disabled={!canAnalyze || analyzing}
            className={`h-12 px-8 text-base font-semibold ${canAnalyze && !analyzing ? "btn-shimmer" : ""}`}>
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Run ATS Analysis
              </>
            )}
          </Button>
          <Button data-testid="clear-btn" variant="outline" onClick={handleClear}>
            <Trash2 className="w-4 h-4 mr-1.5" />Clear
          </Button>
          {result && (
            <Button data-testid="export-btn" variant="secondary" onClick={handleExport}>
              <FileDown className="w-4 h-4 mr-1.5" />Export PDF
            </Button>
          )}
          {/* Convert Full Resume to LaTeX → Overleaf */}
          {parsedFile?.fullText && (
            <Button data-testid="convert-latex-btn" variant="outline" onClick={handleConvertFullToLatex}
              className="border-[#47A141]/30 text-[#47A141] hover:bg-[#47A141]/10 hover:border-[#47A141]/50">
              <FileCode2 className="w-4 h-4 mr-1.5" />
              Resume → Overleaf
            </Button>
          )}
        </div>

        {/* Analyzing state */}
        {analyzing && (
          <div className="mt-6 tracing-beam rounded-xl card-surface p-4 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              Parsing resume · matching keywords · generating rewrites
              <span className="animate-pulse-beam">...</span>
            </p>
          </div>
        )}
      </section>

      {/* Results Section */}
      {result && (
        <section id="results" className="max-w-7xl mx-auto px-4 pb-20 pt-8" data-testid="results-section">
          {/* Good enough banner */}
          {result.ats_score_before >= 88 && (
            <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-start gap-3 animate-fade-up"
              data-testid="good-enough-banner">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-400">Good enough to submit!</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Your resume is already in submit-ready range ({result.ats_score_before}/100). Below are a couple of high-impact rewrites.
                  Everything else is optional polish — don't feel pressured to chase 100.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT: PDF Viewer */}
            <div className="lg:col-span-7 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto rounded-xl" data-testid="pdf-scroll-container">
              {parsedFile?.pages?.length > 0 ? (
                <PdfHighlightViewer pages={parsedFile.pages}
                  aiDetectedLines={result.ai_detected_lines || []}
                  highlightId={highlightId} />
              ) : (
                <div className="card-surface p-8 text-center">
                  <p className="text-sm text-[var(--muted-foreground)]">PDF preview not available for restored analyses without file data.</p>
                </div>
              )}
            </div>

            {/* RIGHT: Metrics + Rewrites */}
            <div className="lg:col-span-5 space-y-6">
              {/* Verdict */}
              <div className="card-surface p-4 animate-fade-up" data-testid="verdict-card">
                <span className="mono-label block mb-2">Verdict</span>
                <p className="text-sm text-[var(--foreground)] font-medium leading-relaxed">{result.verdict_summary}</p>
              </div>

              {/* ATS Score Card */}
              <div className="card-surface p-5 animate-fade-up" data-testid="ats-score-card" style={{animationDelay:"0.1s"}}>
                <span className="mono-label block mb-4">ATS Score</span>
                <div className="flex items-center justify-center gap-6">
                  <div className="relative">
                    <AtsScoreRing score={result.ats_score_before} label="Before" size={110} color="#ef4444" />
                  </div>
                  <ArrowRight className="w-6 h-6 text-[var(--muted)]" />
                  <div className="relative">
                    <AtsScoreRing score={result.ats_score_after} label="After" size={110} color="#10b981" />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-display font-bold text-emerald-400">
                      +{result.ats_score_after - result.ats_score_before}
                    </span>
                    <span className="mono-label">Points</span>
                  </div>
                </div>
              </div>

              {/* HR Perspective */}
              <HrPerspective data={result.hr_perspective} />

              {/* Authenticity */}
              <AuthenticityPanel authenticityScore={result.authenticity_score} dimensionScores={result.dimension_scores} />

              {/* Experience Realism */}
              <ExperienceRealism experienceRealism={result.experience_realism} unverifiableClaims={result.unverifiable_claims} />

              {/* Flagged Patterns */}
              <FlaggedPatterns patterns={result.flagged_patterns} />

              {/* Missing Keywords */}
              {result.ats_missing_keywords?.length > 0 && (
                <div className="card-surface p-5 animate-fade-up" data-testid="missing-keywords" style={{animationDelay:"0.6s"}}>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-amber-500" />
                    <h3 className="mono-label">Missing ATS Keywords</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.ats_missing_keywords.map((kw, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Overleaf / LaTeX Export Section ── */}
              {result?.suggestions?.length > 0 && (
                <div className="card-surface p-5 animate-fade-up" data-testid="overleaf-export-section" style={{animationDelay:"0.65s"}}>
                  <div className="flex items-center gap-2 mb-3">
                    <FileCode2 className="w-4 h-4 text-[#47A141]" />
                    <h3 className="mono-label">Export to Overleaf</h3>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mb-4 leading-relaxed">
                    Convert your resume to professional LaTeX and open directly in Overleaf for pixel-perfect editing. 
                    Links, formatting, and fonts are fully preserved.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      data-testid="overleaf-original-btn"
                      variant="outline"
                      size="sm"
                      onClick={handleConvertFullToLatex}
                      className="flex-1 border-[#47A141]/30 text-[#47A141] hover:bg-[#47A141]/10 hover:border-[#47A141]/50"
                    >
                      <FileCode2 className="w-3.5 h-3.5 mr-1.5" />
                      Original Resume → Overleaf
                    </Button>
                    <Button
                      data-testid="overleaf-improved-btn"
                      size="sm"
                      onClick={handleConvertImprovedToLatex}
                      className="flex-1 bg-[#47A141] hover:bg-[#3d8a38] text-white"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Improved Resume → Overleaf
                    </Button>
                  </div>
                  <p className="text-[10px] text-[var(--muted)] mt-2 font-mono">
                    Each suggestion card also has its own "Overleaf" button
                  </p>
                </div>
              )}

              {/* Required Rewrites */}
              {requiredSuggestions.length > 0 && (
                <div className="animate-fade-up" style={{animationDelay:"0.7s"}}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="mono-label">Required Rewrites</h3>
                    <span className="text-xs text-[var(--muted-foreground)]">({requiredSuggestions.length})</span>
                  </div>
                  <div className="space-y-3">
                    {requiredSuggestions.map((s, i) => (
                      <SuggestionCard key={i} index={i} suggestion={s}
                        onLocate={() => handleSuggestionLocate(s)} isOptional={false} />
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Polish */}
              {optionalSuggestions.length > 0 && (
                <div className="animate-fade-up" style={{animationDelay:"0.8s"}}>
                  <button onClick={() => setOptionalOpen(!optionalOpen)} data-testid="toggle-optional-rewrites"
                    className="flex items-center gap-2 w-full text-left py-3 px-4 rounded-xl card-surface hover:border-amber-500/30 transition-all">
                    <Sparkles className="w-4 h-4 text-[var(--muted)]" />
                    <span className="mono-label">Optional Polish — Not Required</span>
                    <span className="text-xs text-[var(--muted-foreground)]">({optionalSuggestions.length})</span>
                    <ChevronDown className={`w-4 h-4 text-[var(--muted)] ml-auto transition-transform ${optionalOpen ? "rotate-180" : ""}`} />
                  </button>
                  {optionalOpen && (
                    <div className="mt-3 space-y-3">
                      {optionalSuggestions.map((s, i) => {
                        const globalIdx = requiredSuggestions.length + i;
                        return (
                          <SuggestionCard key={i} index={globalIdx} suggestion={s}
                            onLocate={() => handleSuggestionLocate(s)} isOptional={true} />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-8 border-t border-[var(--border)] text-center" data-testid="footer">
        <p className="text-xs text-[var(--muted-foreground)] max-w-lg mx-auto leading-relaxed">
          Your API key never touches our servers — it lives only in this browser tab.
          Your PDF is parsed locally and never uploaded. The only network call is directly
          from your browser to OpenAI/Google/OpenRouter.
        </p>
      </footer>
    </div>
  );
}
