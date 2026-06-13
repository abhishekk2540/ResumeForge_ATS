import React, { useState, useCallback } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import ThemeProvider from "./components/ThemeProvider";
import Header from "./components/Header";
import Analyzer from "./components/Analyzer";
import HistoryDrawer from "./components/HistoryDrawer";

export default function App() {
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleRestore = useCallback((entry) => {
    if (window.__atsRestore) {
      window.__atsRestore(entry);
    }
  }, []);

  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] bg-tech-grid">
          {/* Ambient Blobs */}
          <div className="ambient-blobs" />
          <div className="ambient-blob-3" />
          <div className="grain-overlay" />

          {/* Header */}
          <Header onOpenHistory={() => setHistoryOpen(true)} />

          {/* Main Content */}
          <main>
            <Analyzer />
          </main>

          {/* History Drawer */}
          <HistoryDrawer
            open={historyOpen}
            onOpenChange={setHistoryOpen}
            onRestore={handleRestore}
          />

          {/* Toast */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--surface-raised)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              },
            }}
          />
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}
