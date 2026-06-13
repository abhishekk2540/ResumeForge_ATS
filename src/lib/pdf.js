// ── PDF Export with jsPDF ──

import { jsPDF } from "jspdf";

export function exportAnalysisPdf(result, fileName) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (needed = 20) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("ATS Resume Analysis Report", margin, y);
  y += 10;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleString()} | File: ${fileName || "resume.pdf"}`, margin, y);
  doc.setTextColor(0);
  y += 10;

  // Verdict
  checkPageBreak(15);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Verdict", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const verdictLines = doc.splitTextToSize(result.verdict_summary || "", contentWidth);
  doc.text(verdictLines, margin, y);
  y += verdictLines.length * 5 + 5;

  // Scores
  checkPageBreak(20);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("ATS Scores", margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Before: ${result.ats_score_before}/100`, margin, y);
  doc.text(`After: ${result.ats_score_after}/100`, margin + 50, y);
  doc.text(`Authenticity: ${result.authenticity_score}/100`, margin + 100, y);
  y += 8;

  // HR Perspective
  if (result.hr_perspective) {
    checkPageBreak(30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("HR Perspective", margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const verdictMap = { strong_yes: "STRONG YES", yes: "YES", maybe: "MAYBE", no: "NO" };
    doc.text(`Verdict: ${verdictMap[result.hr_perspective.verdict] || result.hr_perspective.verdict}`, margin, y);
    y += 5;

    const impression = doc.splitTextToSize(result.hr_perspective.first_impression || "", contentWidth);
    doc.text(impression, margin, y);
    y += impression.length * 5 + 3;

    const reasoning = doc.splitTextToSize(result.hr_perspective.reasoning || "", contentWidth);
    doc.text(reasoning, margin, y);
    y += reasoning.length * 5 + 3;

    if (result.hr_perspective.strengths?.length) {
      doc.setFont("helvetica", "bold");
      doc.text("Strengths:", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      for (const s of result.hr_perspective.strengths) {
        checkPageBreak(6);
        const lines = doc.splitTextToSize(`• ${s}`, contentWidth - 5);
        doc.text(lines, margin + 3, y);
        y += lines.length * 5;
      }
      y += 3;
    }

    if (result.hr_perspective.red_flags?.length) {
      doc.setFont("helvetica", "bold");
      doc.text("Red Flags:", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      for (const f of result.hr_perspective.red_flags) {
        checkPageBreak(6);
        const lines = doc.splitTextToSize(`• ${f}`, contentWidth - 5);
        doc.text(lines, margin + 3, y);
        y += lines.length * 5;
      }
      y += 3;
    }
  }

  // Missing Keywords
  if (result.ats_missing_keywords?.length) {
    checkPageBreak(15);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Missing ATS Keywords", margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const kwText = result.ats_missing_keywords.join(", ");
    const kwLines = doc.splitTextToSize(kwText, contentWidth);
    doc.text(kwLines, margin, y);
    y += kwLines.length * 5 + 5;
  }

  // Suggestions (Required first, then Optional)
  if (result.suggestions?.length) {
    const required = result.suggestions.filter((s) => s.priority === "required");
    const optional = result.suggestions.filter((s) => s.priority === "optional");

    const renderSuggestions = (title, items) => {
      if (items.length === 0) return;
      checkPageBreak(15);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin, y);
      y += 7;

      items.forEach((s, idx) => {
        checkPageBreak(30);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`Rewrite #${idx + 1} (+${s.impact_points} pts)`, margin, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(180, 0, 0);
        const origLines = doc.splitTextToSize(`Before: ${s.original}`, contentWidth - 5);
        doc.text(origLines, margin + 3, y);
        y += origLines.length * 4.5;

        doc.setTextColor(0, 120, 0);
        const impLines = doc.splitTextToSize(`After: ${s.improved}`, contentWidth - 5);
        doc.text(impLines, margin + 3, y);
        y += impLines.length * 4.5;

        doc.setTextColor(80);
        const reasonLines = doc.splitTextToSize(`Why: ${s.reason}`, contentWidth - 5);
        doc.text(reasonLines, margin + 3, y);
        y += reasonLines.length * 4.5 + 5;
        doc.setTextColor(0);
      });
    };

    renderSuggestions("Required Rewrites", required);
    renderSuggestions("Optional Polish", optional);
  }

  // Footer
  checkPageBreak(15);
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    "Generated by Resume ATS Analyzer — 100% client-side, privacy-first.",
    margin,
    y
  );

  doc.save(`ats-analysis-${fileName?.replace(/\.pdf$/i, "") || "report"}.pdf`);
}

// Note: generateRewrittenResumePdf has been replaced by LaTeX export to Overleaf.
// See @/lib/latex.js for the new approach.
