import React, { useState, useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";
import {
  Sun,
  Moon,
  Eye,
  EyeOff,
  Save,
  Shield,
  History,
  Info,
} from "lucide-react";

const PROVIDERS = [
  { id: "openrouter", label: "OpenRouter", hint: "openrouter.ai/keys" },
  { id: "openai", label: "OpenAI", hint: "platform.openai.com/api-keys" },
  { id: "gemini", label: "Gemini", hint: "aistudio.google.com/apikey" },
];

export default function Header({ onOpenHistory }) {
  const { theme, toggleTheme } = useTheme();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = useState("openrouter");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedKey = sessionStorage.getItem("byok_llm_key") || "";
    const storedProvider = sessionStorage.getItem("byok_provider") || "openrouter";
    setApiKey(storedKey);
    setProvider(storedProvider);
    if (storedKey) setSaved(true);
  }, []);

  const handleSave = () => {
    sessionStorage.setItem("byok_llm_key", apiKey.trim());
    sessionStorage.setItem("byok_provider", provider);
    setSaved(true);
  };

  const handleProviderChange = (id) => {
    setProvider(id);
    sessionStorage.setItem("byok_provider", id);
  };

  return (
    <header
      className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface-overlay)] backdrop-blur-xl"
      data-testid="header"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-500" />
            </div>
            <h1 className="font-display font-bold text-lg tracking-tight text-[var(--foreground)]">
              ATS<span className="text-amber-500">.</span>Analyzer
            </h1>
          </div>

          {/* Provider Selector */}
          <div className="flex items-center gap-1 bg-[var(--surface)] rounded-lg p-1 border border-[var(--border)]">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                data-testid={`provider-${p.id}`}
                onClick={() => handleProviderChange(p.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  provider === p.id
                    ? "bg-amber-500 text-black shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* API Key Input */}
          <div className="flex items-center gap-2 flex-1 min-w-[280px] max-w-lg">
            <div className="relative flex-1">
              <input
                data-testid="api-key-input"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setSaved(false);
                }}
                placeholder={`Paste your ${PROVIDERS.find((p) => p.id === provider)?.label} API key...`}
                className="w-full h-9 pl-3 pr-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
              />
              <button
                data-testid="toggle-key-visibility"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button
              data-testid="save-key-btn"
              size="sm"
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className={saved ? "bg-emerald-600 hover:bg-emerald-500" : ""}
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              {saved ? "Saved" : "Save"}
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              data-testid="history-btn"
              variant="ghost"
              size="icon"
              onClick={onOpenHistory}
              title="Analysis History"
            >
              <History className="w-4 h-4" />
            </Button>
            <Button
              data-testid="theme-toggle"
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Key status + privacy hint */}
        <div className="flex items-center justify-between mt-2 gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {saved && apiKey && (
              <span
                className="anim-breath inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                data-testid="key-status-pill"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 anim-blink" />
                Key active · {PROVIDERS.find((p) => p.id === provider)?.label}
              </span>
            )}
          </div>
          <p className="text-[10px] text-[var(--muted)] font-mono flex items-center gap-1">
            <Info className="w-3 h-3 inline" />
            Don't have a key? Get a free Gemini key at{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-500 hover:underline"
            >
              aistudio.google.com/apikey
            </a>{" "}
            or OpenRouter at{" "}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-500 hover:underline"
            >
              openrouter.ai/keys
            </a>
          </p>
        </div>
      </div>
    </header>
  );
}
