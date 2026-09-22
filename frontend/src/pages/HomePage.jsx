import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Building2,
  Cpu,
  ArrowRight,
  ShieldCheck,
  BarChart2,
  FileCheck2,
  Sparkles,
  Brain,
  Lock,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  Layers,
  Database,
  Zap,
} from "lucide-react";
import api from "../services/api.js";
import { SearchBar } from "../components/company/SearchBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// ─────────────────────────────────────────────
// AUTHENTICATED DASHBOARD VIEW
// ─────────────────────────────────────────────
const AuthenticatedDashboard = ({ user }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get("/companies");
        if (res.data?.success) setCompanies(res.data.data);
      } catch (err) {
        console.error("Failed to load companies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20 space-y-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #06b6d4 0%, transparent 60%)" }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Research Terminal Active</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">
              Welcome back, <span className="text-terminal-cyan">{user?.name || "Analyst"}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {companies.length} equit{companies.length !== 1 ? "ies" : "y"} available for deep research &amp; AI analysis
            </p>
          </div>
          <div className="hidden sm:block max-w-xs w-full">
            <SearchBar placeholder="Search ticker or company..." />
          </div>
        </div>
      </div>

      {/* Covered Companies */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-terminal-cyan" />
              Covered Equities
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Full financial statements, AI analyst, and grounded RAG per company
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/60">
            {companies.length} Active
          </span>
        </div>

        {loading ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-10 text-center">
            <div className="animate-spin h-6 w-6 border-2 border-terminal-cyan border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading company catalog...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {companies.map((comp) => (
              <Link
                key={comp.id}
                to={`/company/${comp.ticker}`}
                className="group bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-terminal-cyan/50 rounded-2xl p-6 transition-all duration-200 shadow-lg hover:shadow-cyan-950/30 hover:shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs px-2.5 py-1 rounded bg-terminal-cyan/15 text-terminal-cyan font-bold border border-terminal-cyan/30">
                      {comp.exchange}: {comp.ticker}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mt-2.5 group-hover:text-terminal-cyan transition-colors">
                      {comp.name}
                    </h3>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/80 text-slate-500 group-hover:text-terminal-cyan group-hover:bg-terminal-cyan/10 transition-all">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-mono">
                  <span className="truncate">{comp.sector}</span>
                  <span className="truncate text-right text-slate-600">{comp.industry}</span>
                </div>
                {/* Quick feature chips */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono bg-slate-800 text-slate-400 border border-slate-700/50">
                    <BarChart2 className="h-2.5 w-2.5" />
                    Financials
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono bg-slate-800 text-slate-400 border border-slate-700/50">
                    <Brain className="h-2.5 w-2.5" />
                    AI Analyst
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono bg-slate-800 text-slate-400 border border-slate-700/50">
                    <FileCheck2 className="h-2.5 w-2.5" />
                    Documents
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// PUBLIC LANDING PAGE (not logged in)
// ─────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      color: "from-cyan-600 to-blue-700",
      glow: "shadow-cyan-900/40",
      badge: "AI-Powered",
      title: "Grounded AI Research Analyst",
      desc: "Ask natural language questions about any equity. Get answers grounded in SEC filings, annual reports, and earnings call transcripts — with full citation attribution and speaker tagging.",
    },
    {
      icon: ShieldCheck,
      color: "from-emerald-600 to-teal-700",
      glow: "shadow-emerald-900/40",
      badge: "Zero Hallucinations",
      title: "Deterministic Financial Math",
      desc: "Every ratio — Operating Margin, Net Margin, RoE, Debt/Equity — is computed server-side from verified source data. No AI approximation, no rounding errors, no hallucinations.",
    },
    {
      icon: Layers,
      color: "from-amber-600 to-orange-700",
      glow: "shadow-amber-900/40",
      badge: "Enterprise Scale",
      title: "Dual-Microservice Architecture",
      desc: "High-throughput Express.js REST API for auth and financial data. Dedicated Python FastAPI RAG microservice for embeddings, vector search, and LLM orchestration — always separate.",
    },
    {
      icon: Database,
      color: "from-purple-600 to-violet-700",
      glow: "shadow-purple-900/40",
      badge: "Production-Grade",
      title: "PostgreSQL + pgvector Persistence",
      desc: "Relational schema with foreign key integrity for all financial statements. pgvector similarity search for sub-100ms semantic document retrieval across thousands of pages.",
    },
    {
      icon: FileCheck2,
      color: "from-rose-600 to-pink-700",
      glow: "shadow-rose-900/40",
      badge: "SEC-Grade",
      title: "Multi-Document Ingestion Pipeline",
      desc: "Upload Annual Reports, Quarterly Results, Investor Presentations, and Conference Call Transcripts. Automatic chunking, embedding, and indexing — search-ready in seconds.",
    },
    {
      icon: Zap,
      color: "from-yellow-500 to-amber-600",
      glow: "shadow-yellow-900/40",
      badge: "Offline Mode",
      title: "Fallback Local Extraction Engine",
      desc: "No API key? No problem. The Local Extractive Synthesis engine delivers ranked document excerpts with zero external API calls — 100% offline and always available.",
    },
  ];

  const steps = [
    { step: "01", title: "Create Your Analyst Account", desc: "Register with your work email and get immediate access to the full research platform.", icon: Lock },
    { step: "02", title: "Select an Equity to Analyse", desc: "Browse covered companies or search by ticker. View multi-year financial statements and charts.", icon: Building2 },
    { step: "03", title: "Ask the AI Research Analyst", desc: "Type your question in plain English. Get grounded answers with citations from official filings and transcripts.", icon: MessageSquare },
  ];

  return (
    <div className="overflow-hidden">
      {/* ── HERO ── */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 py-20">
        {/* Ambient background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-terminal-cyan/5 blur-3xl" />
          <div className="absolute top-2/3 left-1/3 w-[300px] h-[300px] rounded-full bg-blue-600/5 blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          {/* Status Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-terminal-cyan/30 text-terminal-cyan text-xs font-mono font-medium shadow-lg shadow-terminal-cyan/10 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-terminal-cyan animate-pulse" />
            ENTERPRISE RESEARCH WORKSTATION · v2.0.0
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-100 tracking-tight leading-[1.1]">
              Institutional{" "}
              <span className="bg-gradient-to-r from-terminal-cyan via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                AI Equity Research
              </span>
              <br />
              Without the Hallucinations
            </h1>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Combine verified financial statements, grounded document retrieval, and a Gemini-powered analyst — all in one platform built for serious investors.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              id="hero-cta-register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-terminal-cyan hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-xl shadow-terminal-cyan/30 hover:shadow-terminal-cyan/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Free Research
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              id="hero-cta-login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 font-semibold text-sm transition-all"
            >
              Sign In
            </Link>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-mono text-slate-500">
            {[
              { icon: ShieldCheck, text: "Deterministic Math", color: "text-emerald-400" },
              { icon: FileCheck2, text: "Annual Filings & Transcripts", color: "text-cyan-400" },
              { icon: Sparkles, text: "Gemini AI Grounding", color: "text-amber-400" },
              { icon: Lock, text: "Secure JWT Auth", color: "text-purple-400" },
            ].map(({ icon: Icon, text, color }) => (
              <span key={text} className="flex items-center gap-1.5 text-slate-400">
                <Icon className={`h-4 w-4 ${color}`} />
                {text}
              </span>
            ))}
          </div>
        </div>

        {/* Preview Card (decorative terminal mockup) */}
        <div className="relative z-10 mt-14 w-full max-w-3xl mx-auto">
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
            {/* Fake Window Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/80 bg-slate-900/90">
              <span className="h-3 w-3 rounded-full bg-rose-500/70" />
              <span className="h-3 w-3 rounded-full bg-amber-400/70" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
              <span className="ml-3 text-[11px] font-mono text-slate-500">ITC Limited — AI Research Analyst</span>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono text-emerald-400">Gemini Active</span>
              </div>
            </div>
            <div className="p-5 space-y-3 text-left">
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shrink-0">
                  <Brain className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-slate-800/60 rounded-xl rounded-tl-md px-4 py-3 text-sm text-slate-300 border border-slate-700/40 max-w-lg">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-700/40">
                      <Sparkles className="h-2.5 w-2.5" />
                      Google Gemini (gemini-3.6-flash)
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">· 5 grounded passages</span>
                  </div>
                  <p>ITC's operating margin compressed by <strong className="text-slate-100">~180 bps in FY24</strong> due to elevated leaf tobacco costs and higher A&amp;P spends in FMCG. Management guided for margin recovery in H2 FY25 driven by price hikes and operating leverage.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 -bottom-8 h-16 bg-gradient-to-t from-terminal-bg to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-xs font-mono mb-4">
              Simple 3-Step Workflow
            </div>
            <h2 className="text-3xl font-bold text-slate-100">From Question to Insight in Seconds</h2>
            <p className="text-slate-400 mt-3 text-sm max-w-xl mx-auto">
              No setup, no data wrangling. Just log in and start researching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector Line */}
            <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-terminal-cyan/30 to-transparent pointer-events-none" />

            {steps.map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="relative bg-slate-900/70 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors text-center group">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-slate-800 border border-slate-700 text-terminal-cyan font-mono text-lg font-bold mb-4 group-hover:border-terminal-cyan/50 group-hover:bg-terminal-cyan/5 transition-all">
                  {step}
                </div>
                <h3 className="text-sm font-bold text-slate-100 mb-2">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-terminal-cyan hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-terminal-cyan/25"
            >
              Get Started Free
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="py-20 px-4 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-xs font-mono mb-4">
              Platform Capabilities
            </div>
            <h2 className="text-3xl font-bold text-slate-100">Everything an Equity Analyst Needs</h2>
            <p className="text-slate-400 mt-3 text-sm max-w-xl mx-auto">
              Built from the ground up for institutional research workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, color, glow, badge, title, desc }) => (
              <div
                key={title}
                className="group bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 hover:bg-slate-900/60 transition-all"
              >
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg ${glow} mb-4`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="mb-3">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-terminal-cyan/70 px-2 py-0.5 rounded bg-terminal-cyan/5 border border-terminal-cyan/15">
                    {badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-100 mb-2">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA STRIP ── */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-xs font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-terminal-cyan animate-pulse" />
            Free Access · No Credit Card Required
          </div>
          <h2 className="text-3xl font-bold text-slate-100">
            Ready to Research Smarter?
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Join analysts who use Financial Terminal for deep equity research backed by official filings and AI reasoning.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              id="bottom-cta-register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-terminal-cyan hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-xl shadow-terminal-cyan/30"
            >
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Already have an account? Sign in →
            </Link>
          </div>
          {/* Feature checkmarks */}
          <div className="flex flex-wrap items-center justify-center gap-5 pt-2">
            {["Full AI Research Analyst", "Multi-Year Financials", "PDF Document Search", "Gemini Integration"].map((item) => (
              <span key={item} className="flex items-center gap-1.5 text-xs text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────
export const HomePage = () => {
  const { user } = useAuth();
  return user ? <AuthenticatedDashboard user={user} /> : <LandingPage />;
};
