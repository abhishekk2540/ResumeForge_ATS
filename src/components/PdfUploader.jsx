import React, { useCallback, useState, useRef } from "react";
import { Upload, FileText, CheckCircle, Loader2 } from "lucide-react";
import { parsePdf } from "@/lib/pdfUtils";

export default function PdfUploader({ onParsed, parsedFile }) {
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;

      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file.");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("File must be under 10MB.");
        return;
      }

      setError(null);
      setParsing(true);

      try {
        const result = await parsePdf(file);
        onParsed({
          file,
          fileName: file.name,
          pages: result.pages,
          fullText: result.fullText,
        });
      } catch (err) {
        console.error("PDF parse error:", err);
        setError("Failed to parse PDF. Make sure it's a valid PDF file.");
      } finally {
        setParsing(false);
      }
    },
    [onParsed]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer?.files?.[0];
      handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleClick = () => fileInputRef.current?.click();

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  if (parsedFile) {
    return (
      <div
        className="card-surface p-4 flex items-center gap-3"
        data-testid="pdf-parsed-status"
      >
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)] truncate">
            {parsedFile.fileName}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {parsedFile.pages.length} page{parsedFile.pages.length !== 1 ? "s" : ""} ·{" "}
            {parsedFile.fullText.length.toLocaleString()} characters
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle className="w-3 h-3" />
          Parsed locally · never uploaded
        </span>
        <button
          data-testid="change-pdf-btn"
          onClick={handleClick}
          className="text-xs text-amber-500 hover:underline ml-2"
        >
          Change
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div data-testid="pdf-uploader">
      <div
        data-testid="pdf-drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`relative cursor-pointer card-surface border-2 border-dashed transition-all duration-300 rounded-xl p-8 text-center ${
          dragging
            ? "border-amber-500 bg-amber-500/5 scale-[1.01]"
            : "border-[var(--border)] hover:border-amber-500/50 hover:bg-[var(--surface)]"
        }`}
      >
        {parsing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            <p className="text-sm text-[var(--muted-foreground)]">
              Parsing PDF locally
              <span className="animate-pulse-beam">...</span>
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Upload className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                Drop your resume PDF here
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                or click to browse · PDF only · max 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-400" data-testid="pdf-error">
          {error}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
