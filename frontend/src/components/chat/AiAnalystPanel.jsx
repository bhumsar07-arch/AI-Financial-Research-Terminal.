import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  FileText,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  BookOpen,
  MessageSquare,
  AlertTriangle,
  Quote,
  X,
  Eye,
  ExternalLink,
  Cpu,
  Settings,
  CheckCircle2,
  Key,
} from "lucide-react";
import api from "../../services/api.js";

// Suggested research prompts for quick start
const SUGGESTED_PROMPTS = [
  {
    label: "Margin Analysis",
    query: "Why did ITC's operating margins compress in FY24?",
    icon: "📊",
  },
  {
    label: "Management View",
    query: "What did the CFO say about the agribusiness segment performance?",
    icon: "🎤",
  },
  {
    label: "Competitive Risks",
    query: "How is ITC addressing paperboard dumping from China?",
    icon: "⚠️",
  },
  {
    label: "Growth Strategy",
    query: "What are ITC's key growth drivers mentioned by management?",
    icon: "🚀",
  },
];

/**
 * Citation Badge — Clickable source reference badge.
 */
const CitationBadge = ({ citation, index, onClick }) => {
  const isTranscript = citation.document_type === "conference_call_transcript";
  const speaker = citation.speaker_name;

  return (
    <button
      onClick={() => onClick(citation)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono
        bg-slate-800/80 border border-slate-700/60 hover:border-cyan-600/50 hover:bg-slate-750
        text-slate-300 hover:text-cyan-300 transition-all duration-200 cursor-pointer group"
      title={`View source: ${citation.document_title}`}
    >
      <span className="text-cyan-500/70 group-hover:text-cyan-400">[{index}]</span>
      {isTranscript && speaker ? (
        <>
          <MessageSquare className="h-3 w-3 text-emerald-500/60" />
          <span className="truncate max-w-[140px]">{speaker}</span>
        </>
      ) : (
        <>
          <FileText className="h-3 w-3 text-amber-500/60" />
          <span className="truncate max-w-[140px]">
            {citation.document_title?.replace(/ITC\s*/, "").slice(0, 30)}
          </span>
        </>
      )}
      <span
        className={`ml-1 px-1 py-0.5 rounded text-[8px] font-bold ${
          citation.relevance_score > 0.3
            ? "bg-emerald-900/40 text-emerald-400"
            : citation.relevance_score > 0.15
            ? "bg-amber-900/40 text-amber-400"
            : "bg-slate-700 text-slate-400"
        }`}
      >
        {Math.round(citation.relevance_score * 100)}%
      </span>
    </button>
  );
};

/**
 * Evidence Drawer — Slide-over panel showing source passage details.
 */
const EvidenceDrawer = ({ citation, onClose }) => {
  if (!citation) return null;

  const isTranscript = citation.document_type === "conference_call_transcript";

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Drawer Panel */}
      <div
        className="relative w-full max-w-lg bg-slate-900 border-l border-slate-700 shadow-2xl
          animate-slide-in-right overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-bold text-slate-100">Source Evidence</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Document Info */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Document
              </span>
            </div>
            <p className="text-sm text-slate-100 font-medium">{citation.document_title}</p>
            <div className="flex flex-wrap gap-2 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
                {citation.document_type?.replace(/_/g, " ")}
              </span>
              {citation.page_number && (
                <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
                  Page {citation.page_number}
                </span>
              )}
              {citation.section && (
                <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
                  {citation.section}
                </span>
              )}
            </div>

            {citation.document_id && (
              <a
                href={`${import.meta.env.VITE_RAG_URL || "http://localhost:8000"}/documents/${citation.document_id}/pdf${citation.page_number ? `#page=${citation.page_number}` : ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center justify-center gap-2 w-full px-3.5 py-2 rounded-lg text-xs font-semibold
                  bg-gradient-to-r from-cyan-600/80 to-blue-600/80 hover:from-cyan-500 hover:to-blue-500 text-white
                  border border-cyan-400/40 shadow-sm transition-all group cursor-pointer"
              >
                <Eye className="h-4 w-4 text-cyan-200 group-hover:scale-110 transition-transform" />
                <span>Open Original PDF {citation.page_number ? `(Page ${citation.page_number})` : ""}</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100" />
              </a>
            )}
          </div>

          {/* Speaker Info (for transcripts) */}
          {isTranscript && citation.speaker_name && (
            <div className="bg-emerald-950/30 rounded-xl p-4 border border-emerald-800/30 space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                  Speaker
                </span>
              </div>
              <p className="text-sm text-slate-100 font-medium">{citation.speaker_name}</p>
              {citation.speaker_role && (
                <p className="text-xs text-slate-400">{citation.speaker_role}</p>
              )}
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
                  citation.is_management
                    ? "bg-cyan-900/40 text-cyan-300 border border-cyan-800/50"
                    : "bg-slate-700 text-slate-300 border border-slate-600"
                }`}
              >
                {citation.is_management ? "Management" : "External"}
              </span>
            </div>
          )}

          {/* Relevance Score */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">Relevance:</span>
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  citation.relevance_score > 0.3
                    ? "bg-emerald-500"
                    : citation.relevance_score > 0.15
                    ? "bg-amber-500"
                    : "bg-slate-500"
                }`}
                style={{ width: `${Math.min(100, citation.relevance_score * 100 * 2)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-slate-300">
              {Math.round(citation.relevance_score * 100)}%
            </span>
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Quote className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Source Passage
              </span>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap italic">
                "{citation.excerpt}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Chat Message Bubble — Renders user or assistant message.
 */
const ChatBubble = ({ message, onCitationClick }) => {
  const isUser = message.role === "user";
  const citations = message.citations
    ? typeof message.citations === "string"
      ? JSON.parse(message.citations)
      : message.citations
    : [];

  const isGemini =
    message.meta?.llmProvider === "gemini" ||
    message.meta?.engineDetails?.provider === "gemini";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Avatar */}
      {!isUser && (
        <div
          className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center shadow-lg ${
            isGemini
              ? "bg-gradient-to-br from-emerald-600 to-cyan-700 shadow-emerald-900/40"
              : "bg-gradient-to-br from-cyan-600 to-blue-700 shadow-cyan-900/30"
          }`}
        >
          {isGemini ? <Sparkles className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
        </div>
      )}

      <div className={`max-w-[85%] space-y-2 ${isUser ? "items-end" : "items-start"}`}>
        {/* Engine Badge for Assistant Messages */}
        {!isUser && (
          <div className="flex items-center gap-2 px-1">
            {isGemini ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Sparkles className="h-2.5 w-2.5 text-emerald-400" />
                {message.meta?.engineDetails?.name || message.meta?.engine_details?.name || "Google Gemini AI"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/50 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <Cpu className="h-2.5 w-2.5 text-amber-400" />
                Local Extractive Engine
              </span>
            )}
            {message.meta?.sourceCount > 0 && (
              <span className="text-[10px] font-mono text-slate-500">
                • {message.meta.sourceCount} grounded passage{message.meta.sourceCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {/* Message Content */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-cyan-700/30 border border-cyan-600/30 text-slate-100 rounded-br-md"
              : "bg-slate-800/60 border border-slate-700/40 text-slate-200 rounded-bl-md"
          }`}
        >
          {/* Render markdown-like formatting */}
          {message.content?.split("\n").map((line, i) => {
            if (line.startsWith("**") && line.endsWith("**")) {
              return (
                <p key={i} className="font-bold text-slate-100 mt-2 mb-1">
                  {line.replace(/\*\*/g, "")}
                </p>
              );
            }
            if (line.startsWith("**")) {
              const parts = line.split("**");
              return (
                <p key={i} className="mt-2 mb-1">
                  {parts.map((part, j) =>
                    j % 2 === 1 ? (
                      <strong key={j} className="text-slate-100">
                        {part}
                      </strong>
                    ) : (
                      <span key={j}>{part}</span>
                    )
                  )}
                </p>
              );
            }
            if (line.trim() === "") return <br key={i} />;
            return <p key={i}>{line}</p>;
          })}
        </div>

        {/* Citation Badges */}
        {citations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {citations.map((c, i) => (
              <CitationBadge
                key={c.chunk_id || i}
                citation={c}
                index={i + 1}
                onClick={onCitationClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-slate-700 flex items-center justify-center">
          <User className="h-4 w-4 text-slate-300" />
        </div>
      )}
    </div>
  );
};

/**
 * LlmSettingsModal — Allows analyst to view live engine status, test Gemini API connection,
 * and configure or update their Gemini API Key directly in the UI.
 */
const LlmSettingsModal = ({ isOpen, onClose, llmStatus, onRefreshStatus }) => {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [saveError, setSaveError] = useState(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const ragUrl = import.meta.env.VITE_RAG_URL || "http://localhost:8000";
      const res = await fetch(`${ragUrl}/llm/status?test=true`);
      const data = await res.json();
      setTestResult(data);
      onRefreshStatus?.();
    } catch (err) {
      setTestResult({
        success: false,
        message: `Connection test failed: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveKey = async (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    try {
      const ragUrl = import.meta.env.VITE_RAG_URL || "http://localhost:8000";
      const res = await fetch(`${ragUrl}/llm/set-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKeyInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Verification failed");
      }
      setSaveMessage(data.message || "Gemini 2.0 Flash verified and active!");
      setApiKeyInput("");
      onRefreshStatus?.();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-6 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border border-cyan-500/40">
              <Sparkles className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">LLM Engine & Model Diagnostics</h3>
              <p className="text-xs text-slate-400 font-mono">Verify Gemini connection or manage local fallback</p>
            </div>
          </div>
          <button
            id="btn-close-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Active Engine Status Card */}
        <div
          className={`p-4 rounded-xl border ${
            llmStatus?.is_gemini_active
              ? "bg-emerald-950/30 border-emerald-700/50"
              : "bg-amber-950/30 border-amber-700/50"
          } space-y-3`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${llmStatus?.is_gemini_active ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300">
                Active Generation Mode
              </span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                llmStatus?.is_gemini_active
                  ? "bg-emerald-900/60 text-emerald-300 border border-emerald-600/50"
                  : "bg-amber-900/60 text-amber-300 border border-amber-600/50"
              }`}
            >
              {llmStatus?.is_gemini_active ? "Cloud LLM Active" : "Offline Extractive Active"}
            </span>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              {llmStatus?.is_gemini_active ? (
                <>
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  Google Gemini 2.0 Flash
                </>
              ) : (
                <>
                  <Cpu className="h-5 w-5 text-amber-400" />
                  Local Extractive Synthesis Engine
                </>
              )}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {llmStatus?.message || "Engine status loaded."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono">
            <div>
              <span className="text-slate-500">Model Name:</span>{" "}
              <span className="text-slate-200 font-semibold">{llmStatus?.model || "extractive-ranker-v1"}</span>
            </div>
            <div>
              <span className="text-slate-500">Key Status:</span>{" "}
              <span className={llmStatus?.api_key_configured ? "text-emerald-400" : "text-amber-400"}>
                {llmStatus?.api_key_configured ? `Configured (${llmStatus.masked_key})` : "Not Configured"}
              </span>
            </div>
          </div>
        </div>

        {/* Live Test Button & Response */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Connectivity Check:</span>
            <button
              id="btn-test-connection"
              onClick={handleTestConnection}
              disabled={testing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 hover:text-white
                disabled:opacity-50 transition-colors cursor-pointer"
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" /> : <Sparkles className="h-3.5 w-3.5 text-cyan-400" />}
              <span>{testing ? "Testing Ping..." : "Test Connection"}</span>
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs font-mono ${
                testResult.is_gemini_active
                  ? "bg-emerald-950/40 border-emerald-700/40 text-emerald-300"
                  : "bg-slate-800/80 border-slate-700 text-slate-300"
              }`}
            >
              <p className="font-bold">{testResult.is_gemini_active ? "✅ Gemini Ping Succeeded!" : "ℹ️ Status:"}</p>
              <p className="mt-1 text-[11px] opacity-90">{testResult.message}</p>
              {testResult.ping_test && (
                <p className="mt-1 text-[11px] text-cyan-300">Model Response: "{testResult.ping_test}"</p>
              )}
            </div>
          )}
        </div>

        {/* Configure / Update Gemini API Key Form */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-cyan-400" />
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Configure or Update Gemini API Key
            </h5>
          </div>
          <p className="text-[11px] text-slate-400">
            Paste your Google Gemini API key below. We will test it immediately with Google's servers and activate Gemini 2.0 Flash upon verification.
          </p>

          <form onSubmit={handleSaveKey} className="space-y-3">
            <div className="relative">
              <input
                id="input-gemini-key"
                type="text"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {saveMessage && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-950/50 border border-emerald-700/50 text-emerald-300 text-xs font-mono">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>{saveMessage}</span>
              </div>
            )}

            {saveError && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-950/50 border border-rose-700/50 text-rose-300 text-xs font-mono">
                <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <button
              id="btn-save-key"
              type="submit"
              disabled={!apiKeyInput.trim() || saving}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold
                bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white
                disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-950/50 transition-all cursor-pointer"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
              <span>{saving ? "Verifying with Google..." : "Verify & Activate Gemini"}</span>
            </button>
          </form>
        </div>

        {/* Informational Footer Note */}
        <div className="text-[10px] text-slate-500 space-y-1">
          <p>
            • <strong>Gemini 2.0 Flash:</strong> Generates fluid institutional-grade research synthesis with exact speaker attributions.
          </p>
          <p>
            • <strong>Local Extractive Engine:</strong> Works 100% offline with zero external network calls by ranking top document excerpts.
          </p>
        </div>
      </div>
    </div>
  );
};


/**
 * AiAnalystPanel — Full embedded chat interface for the AI Research Analyst.
 */
export const AiAnalystPanel = ({ company }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [docContext, setDocContext] = useState(null);
  const [llmStatus, setLlmStatus] = useState(null);
  const [showLlmModal, setShowLlmModal] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchLlmStatus = async () => {
    try {
      const ragUrl = import.meta.env.VITE_RAG_URL || "http://localhost:8000";
      const res = await fetch(`${ragUrl}/llm/status`);
      if (res.ok) {
        const data = await res.json();
        setLlmStatus(data);
      }
    } catch (err) {
      console.log("Could not fetch LLM status:", err);
    }
  };

  useEffect(() => {
    fetchLlmStatus();
  }, []);

  // Fetch document context on mount
  useEffect(() => {
    if (!company?.id) return;
    const fetchContext = async () => {
      try {
        const ragUrl = import.meta.env.VITE_RAG_URL || "http://localhost:8000";
        const res = await fetch(`${ragUrl}/documents/${company.id}`);
        if (res.ok) {
          const data = await res.json();
          setDocContext(data);
        }
      } catch (err) {
        console.log("Could not fetch document context:", err);
      }
    };
    fetchContext();
  }, [company?.id]);

  const handleSubmit = async (questionText) => {
    const question = questionText || input.trim();
    if (!question || loading) return;

    // Add user message
    const userMsg = { role: "user", content: question, citations: [] };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/chat/query", {
        question,
        companyId: company.id,
        ticker: company.ticker,
      });

      if (res.data?.success) {
        const assistantMsg = {
          role: "assistant",
          content: res.data.data.answer,
          citations: res.data.data.citations || [],
          meta: {
            sourceCount: res.data.data.sourceCount,
            llmProvider: res.data.data.llmProvider,
            engineDetails: res.data.data.engineDetails,
            concallAvailable: res.data.data.concallAvailable,
          },
        };
        setMessages((prev) => [...prev, assistantMsg]);
        fetchLlmStatus();
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "An error occurred while processing your question. Please try again.",
            citations: [],
          },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Unable to connect to the AI analysis service. Please ensure both the backend server (port 5000) and RAG service (port 8000) are running.",
          citations: [],
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden flex flex-col" style={{ height: "70vh" }}>
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-900/40">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                AI Equity Research Analyst
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Grounded RAG with speaker attribution
              </p>
            </div>
          </div>

          {/* Header Right Status Badges */}
          <div className="flex items-center gap-2.5">
            {/* LLM Engine Status Button */}
            <button
              id="btn-llm-status"
              onClick={() => setShowLlmModal(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer shadow-sm ${
                llmStatus?.is_gemini_active
                  ? "bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-600/50 text-emerald-300 hover:text-white"
                  : "bg-amber-950/60 hover:bg-amber-900/80 border-amber-600/50 text-amber-300 hover:text-white"
              }`}
              title="Click to view LLM Diagnostics & API Key configuration"
            >
              <span className={`h-2 w-2 rounded-full ${llmStatus?.is_gemini_active ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="truncate max-w-[130px]">
                {llmStatus?.is_gemini_active ? (llmStatus?.model ? `✨ ${llmStatus.model}` : "✨ Gemini AI") : "⚡ Local Extractive"}
              </span>
              <Settings className="h-3 w-3 opacity-60 hover:opacity-100 ml-0.5" />
            </button>

            {/* Document Context Badge */}
            {docContext && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500">
                  {docContext.total_documents} doc{docContext.total_documents !== 1 ? "s" : ""} indexed
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                    docContext.concall_status === "available"
                      ? "bg-emerald-900/40 text-emerald-400 border border-emerald-800/50"
                      : "bg-amber-900/40 text-amber-400 border border-amber-800/50"
                  }`}
                >
                  {docContext.concall_status === "available"
                    ? "Concalls Available"
                    : "No Concalls Available"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
        {/* Empty State */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="space-y-2">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-600/20 to-blue-700/20 flex items-center justify-center mx-auto border border-cyan-700/30">
                <Bot className="h-7 w-7 text-cyan-400" />
              </div>
              <h4 className="text-base font-bold text-slate-200">
                Research {company?.ticker || "Company"}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Ask questions about financial performance, management commentary,
                and strategic direction. Answers are grounded in ingested documents
                with source citations.
              </p>
            </div>

            {/* Suggested Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  onClick={() => handleSubmit(prompt.query)}
                  className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl
                    bg-slate-800/50 border border-slate-700/50 hover:border-cyan-600/40
                    hover:bg-slate-800/80 transition-all duration-200 text-left group"
                >
                  <span className="text-lg">{prompt.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                      {prompt.label}
                    </p>
                    <p className="text-[10px] text-slate-500 line-clamp-1">
                      {prompt.query}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Active Engine Card */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 w-full max-w-lg">
              <div className="flex items-center gap-2.5 text-left">
                <div className={`p-2 rounded-lg ${llmStatus?.is_gemini_active ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50" : "bg-amber-950/60 text-amber-400 border border-amber-800/50"}`}>
                  {llmStatus?.is_gemini_active ? <Sparkles className="h-4 w-4" /> : <Cpu className="h-4 w-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">
                      Active Engine: {llmStatus?.is_gemini_active ? (llmStatus?.engine_name || "Google Gemini AI") : "Local Extractive Synthesis"}
                    </span>
                    <span className={`h-1.5 w-1.5 rounded-full ${llmStatus?.is_gemini_active ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {llmStatus?.is_gemini_active
                      ? "Cloud-powered natural language equity synthesis"
                      : "100% offline rule-based semantic ranking from uploaded PDF filings"}
                  </p>
                </div>
              </div>
              <button
                id="btn-diagnostics-card"
                onClick={() => setShowLlmModal(true)}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer flex-shrink-0"
              >
                Diagnostics
              </button>
            </div>

            {/* No Concalls Warning */}
            {docContext && docContext.concall_status !== "available" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-950/30 border border-amber-800/30 max-w-sm">
                <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                <p className="text-[10px] text-amber-300">
                  No conference call transcripts available. Answers will be based on
                  uploaded financial reports and presentations only.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Chat Messages */}
        {messages.map((msg, i) => (
          <ChatBubble
            key={i}
            message={msg}
            onCitationClick={setSelectedCitation}
          />
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                Searching documents and generating analysis...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="px-5 py-4 border-t border-slate-800/80 bg-slate-900/90">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${company?.ticker || "company"} performance, strategy, risks...`}
              disabled={loading}
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-100
                placeholder-slate-500 focus:outline-none focus:border-cyan-600/50 focus:ring-1 focus:ring-cyan-600/30
                disabled:opacity-50 transition-all"
            />
          </div>
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || loading}
            className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700
              flex items-center justify-center text-white shadow-lg shadow-cyan-900/30
              hover:from-cyan-500 hover:to-blue-600 disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-[9px] text-slate-600 mt-2 text-center font-mono">
          Answers grounded in ingested company documents with source attribution
        </p>
      </div>

      {/* Evidence Drawer */}
      <EvidenceDrawer
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />

      {/* LLM Diagnostics & Settings Modal */}
      <LlmSettingsModal
        isOpen={showLlmModal}
        onClose={() => setShowLlmModal(false)}
        llmStatus={llmStatus}
        onRefreshStatus={fetchLlmStatus}
      />
    </div>
  );
};
