import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Building2,
  Globe,
  TrendingUp,
  BarChart3,
  Table,
  FileText,
  Bot,
  AlertCircle,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";
import api from "../services/api.js";
import { FinancialTable } from "../components/company/FinancialTable.jsx";
import { FinancialCharts } from "../components/company/FinancialCharts.jsx";

export const CompanyPage = () => {
  const { ticker } = useParams();
  const [company, setCompany] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [period, setPeriod] = useState("annual");
  const [activeTab, setActiveTab] = useState("financials");
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingFinancials, setLoadingFinancials] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch Company Profile
  useEffect(() => {
    const fetchCompany = async () => {
      setLoadingCompany(true);
      setError(null);
      try {
        const res = await api.get(`/companies/${ticker}`);
        if (res.data && res.data.success) {
          setCompany(res.data.data);
        }
      } catch (err) {
        setError(`Company with ticker "${ticker}" could not be found.`);
      } finally {
        setLoadingCompany(false);
      }
    };

    fetchCompany();
  }, [ticker]);

  // 2. Fetch Financial Data for Company
  useEffect(() => {
    if (!ticker) return;

    const fetchFinancials = async () => {
      setLoadingFinancials(true);
      try {
        const res = await api.get(`/companies/${ticker}/financials?period=${period}`);
        if (res.data && res.data.success) {
          setFinancials(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch financials:", err);
      } finally {
        setLoadingFinancials(false);
      }
    };

    fetchFinancials();
  }, [ticker, period]);

  if (loadingCompany) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="animate-spin h-8 w-8 border-2 border-terminal-cyan border-t-transparent rounded-full mx-auto mb-4"></div>
        Loading company workstation for {ticker}...
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Company Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">{error}</p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
        >
          Return to Terminal Dashboard
        </Link>
      </div>
    );
  }

  // Get the most recent annual period for key metric stat badges
  const latestAnnual = financials?.periods?.[financials.periods.length - 1];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 space-y-6">
      {/* COMPANY WORKSTATION HEADER */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center space-x-3 mb-2">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-terminal-cyan/15 text-terminal-cyan font-bold border border-terminal-cyan/30">
                {company.exchange}: {company.ticker}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {company.sector}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {company.industry}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight flex items-center space-x-3">
              <span>{company.name}</span>
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-terminal-cyan transition-colors"
                  title="Official Website"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl line-clamp-2">
              {company.description}
            </p>
          </div>

          {/* Quick Metrics Badges (Latest Period) */}
          {latestAnnual && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 text-center">
                <div className="text-[10px] uppercase font-mono text-slate-400">FY{latestAnnual.fiscalYear} Revenue</div>
                <div className="text-base font-bold text-slate-100 font-mono-num mt-0.5">
                  ₹{Number(latestAnnual.revenue).toLocaleString("en-IN")} Cr
                </div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 text-center">
                <div className="text-[10px] uppercase font-mono text-slate-400">Net Profit (PAT)</div>
                <div className="text-base font-bold text-emerald-400 font-mono-num mt-0.5">
                  ₹{Number(latestAnnual.netProfit).toLocaleString("en-IN")} Cr
                </div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 text-center">
                <div className="text-[10px] uppercase font-mono text-slate-400">Operating Margin</div>
                <div className="text-base font-bold text-cyan-400 font-mono-num mt-0.5">
                  {latestAnnual.ratios?.operatingMargin}%
                </div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 text-center">
                <div className="text-[10px] uppercase font-mono text-slate-400">Return on Equity</div>
                <div className="text-base font-bold text-terminal-gold font-mono-num mt-0.5">
                  {latestAnnual.ratios?.roe}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 mt-6 pt-2 space-x-6 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab("financials")}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === "financials"
                ? "border-terminal-cyan text-terminal-cyan font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Table className="h-4 w-4" />
            <span>Financial Statements</span>
          </button>

          <button
            onClick={() => setActiveTab("charts")}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === "charts"
                ? "border-terminal-cyan text-terminal-cyan font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Interactive Charts</span>
          </button>

          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === "overview"
                ? "border-terminal-cyan text-terminal-cyan font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Company Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("documents")}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === "documents"
                ? "border-terminal-cyan text-terminal-cyan font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Filings & Transcripts</span>
            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
              Sprint 5
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ai-analyst")}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === "ai-analyst"
                ? "border-terminal-cyan text-terminal-cyan font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>AI Analyst (RAG)</span>
            <span className="text-[9px] bg-cyan-900/40 text-cyan-300 border border-cyan-800 px-1.5 py-0.2 rounded font-mono">
              Sprint 6
            </span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT: FINANCIALS TABLE */}
      {activeTab === "financials" && (
        <FinancialTable
          financials={financials}
          period={period}
          setPeriod={setPeriod}
          loading={loadingFinancials}
        />
      )}

      {/* TAB CONTENT: CHARTS */}
      {activeTab === "charts" && (
        <FinancialCharts financials={financials} period={period} />
      )}

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Business Description</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{company.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs uppercase font-mono text-slate-400 mb-2">Corporate Profile</h4>
              <ul className="text-xs space-y-2 text-slate-300 font-mono">
                <li><span className="text-slate-500">Legal Name:</span> {company.name}</li>
                <li><span className="text-slate-500">Primary Exchange:</span> {company.exchange}</li>
                <li><span className="text-slate-500">Ticker Symbol:</span> {company.ticker}</li>
                <li><span className="text-slate-500">Currency:</span> {company.currency}</li>
              </ul>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs uppercase font-mono text-slate-400 mb-2">Industry Classification</h4>
              <ul className="text-xs space-y-2 text-slate-300 font-mono">
                <li><span className="text-slate-500">Sector:</span> {company.sector}</li>
                <li><span className="text-slate-500">Industry:</span> {company.industry}</li>
                <li>
                  <span className="text-slate-500">Official Website:</span>{" "}
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-terminal-cyan hover:underline">
                    {company.website}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DOCUMENTS PREVIEW (SPRINT 5 TEASER) */}
      {activeTab === "documents" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center shadow-xl backdrop-blur-md">
          <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center text-terminal-cyan mx-auto mb-4 border border-slate-700">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-2">Company Documents & Transcripts</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            In <strong>Sprint 5</strong>, we will integrate Python-based automated PDF extraction and earnings call transcript parsing with speaker segmentation.
          </p>
          <div className="inline-block bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 text-xs font-mono text-cyan-400">
            Upcoming: ITC Limited Annual Reports FY21-FY24 & Q4 Conference Call Transcripts
          </div>
        </div>
      )}

      {/* TAB CONTENT: AI ANALYST PREVIEW (SPRINT 6 TEASER) */}
      {activeTab === "ai-analyst" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center shadow-xl backdrop-blur-md">
          <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 mx-auto mb-4 border border-slate-700">
            <Bot className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-2">AI Equity Research Analyst</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            In <strong>Sprint 6</strong>, ask questions like <em>"Why did ITC's operating margins compress in FY24?"</em> and get grounded answers with document citations.
          </p>
          <div className="inline-block bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400">
            Upcoming: Vector Search RAG + Attribution Drawer + Confidence Badges
          </div>
        </div>
      )}
    </div>
  );
};
