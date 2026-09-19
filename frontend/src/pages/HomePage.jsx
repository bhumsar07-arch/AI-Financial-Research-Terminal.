import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Building2,
  Cpu,
  Database,
  ArrowRight,
  ShieldCheck,
  BarChart2,
  FileCheck2,
} from "lucide-react";
import api from "../services/api.js";
import { SearchBar } from "../components/company/SearchBar.jsx";

export const HomePage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get("/companies");
        if (res.data && res.data.success) {
          setCompanies(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load companies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20 space-y-12">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-8 sm:p-12 text-center shadow-2xl backdrop-blur-md">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-terminal-cyan/10 border border-terminal-cyan/30 text-terminal-cyan text-xs font-mono font-medium mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-terminal-cyan animate-pulse"></span>
          <span>ENTERPRISE RESEARCH WORKSTATION</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-100 tracking-tight max-w-3xl mx-auto leading-tight">
          AI Financial Terminal & Deterministic Analytics
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mt-4 font-normal">
          Evaluate public equities with verified multi-year financial statements, deterministic ratio calculations, and grounded AI document retrieval.
        </p>

        {/* Big Search Bar */}
        <div className="max-w-2xl mx-auto mt-8 flex justify-center">
          <SearchBar placeholder="Search stock by symbol or company name (e.g. ITC, Consumer Goods)..." />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs font-mono text-slate-500">
          <span className="flex items-center space-x-1.5 text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Deterministic Math (No LLM Hallucinations)</span>
          </span>
          <span className="flex items-center space-x-1.5 text-slate-400">
            <FileCheck2 className="h-4 w-4 text-cyan-400" />
            <span>Annual Filings & Transcripts</span>
          </span>
          <span className="flex items-center space-x-1.5 text-slate-400">
            <BarChart2 className="h-4 w-4 text-terminal-gold" />
            <span>Institutional Recharts Engine</span>
          </span>
        </div>
      </div>

      {/* FEATURED COMPANIES SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-terminal-cyan" />
              <span>Covered Companies</span>
            </h2>
            <p className="text-xs text-slate-400">
              Active equities with seeded financial reports & ratio analysis
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {companies.length} Active Equities
          </span>
        </div>

        {loading ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            <div className="animate-spin h-6 w-6 border-2 border-terminal-cyan border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading public company catalog...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {companies.map((comp) => (
              <Link
                key={comp.id}
                to={`/company/${comp.ticker}`}
                className="group bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-terminal-cyan/50 rounded-2xl p-6 transition-all duration-200 shadow-lg hover:shadow-cyan-950/20"
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
                  <div className="p-2 rounded-lg bg-slate-800/80 text-slate-400 group-hover:text-terminal-cyan group-hover:bg-slate-800 transition-colors">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>{comp.sector}</span>
                  <span className="text-slate-500">•</span>
                  <span>{comp.industry}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* THREE PILLARS OF TERMINAL ARCHITECTURE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="h-10 w-10 rounded-xl bg-terminal-cyan/10 border border-terminal-cyan/30 flex items-center justify-center text-terminal-cyan mb-4">
            <Cpu className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">Dual-Backend Architecture</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            High-throughput Express.js REST API on port 5000 managing auth, caching, and financial data; dedicated Python FastAPI microservice on port 8000 handling RAG.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">Deterministic Financial Math</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            All key investment ratios (Operating Margin, Net Margin, RoE, Debt/Equity) are calculated by validated backend code, guaranteeing absolute precision.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="h-10 w-10 rounded-xl bg-terminal-gold/10 border border-terminal-gold/30 flex items-center justify-center text-terminal-gold mb-4">
            <Database className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">PostgreSQL Persistence</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Single source of truth with 8 structured relational tables, foreign key constraints, and upcoming pgvector vector similarity search embeddings.
          </p>
        </div>
      </div>
    </div>
  );
};
