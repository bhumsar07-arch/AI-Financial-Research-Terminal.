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
  MessageSquare,
  BookOpen,
  AlertTriangle,
  Eye,
} from "lucide-react";
import api from "../services/api.js";
import { FinancialTable } from "../components/company/FinancialTable.jsx";
import { FinancialCharts } from "../components/company/FinancialCharts.jsx";
import { AiAnalystPanel } from "../components/chat/AiAnalystPanel.jsx";

// Document type icons and colors
const DOC_TYPE_STYLES = {
  conference_call_transcript: { icon: MessageSquare, color: "text-emerald-400", bg: "bg-emerald-900/30", border: "border-emerald-800/40", label: "Conference Call" },
  annual_report: { icon: BookOpen, color: "text-amber-400", bg: "bg-amber-900/30", border: "border-amber-800/40", label: "Annual Report" },
  quarterly_results: { icon: BarChart3, color: "text-cyan-400", bg: "bg-cyan-900/30", border: "border-cyan-800/40", label: "Quarterly Results" },
  investor_presentation: { icon: FileText, color: "text-purple-400", bg: "bg-purple-900/30", border: "border-purple-800/40", label: "Investor Presentation" },
  other: { icon: FileText, color: "text-slate-400", bg: "bg-slate-800/30", border: "border-slate-700/40", label: "Document" },
};

/**
 * DocumentsPanel — Shows a live list of ingested documents for the company.
 */
const DocumentsPanel = ({ companyId, ticker }) => {
  const [docs, setDocs] = useState(null);
  const [loading, setLoading] = useState(true);
  const ragUrl = import.meta.env.VITE_RAG_URL || "http://localhost:8000";

  useEffect(() => {
    if (!companyId) return;
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${ragUrl}/documents/${companyId}`);
        if (res.ok) {
          const data = await res.json();
          setDocs(data);
        }
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [companyId]);

  if (loading) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center shadow-xl backdrop-blur-md">
        <div className="animate-spin h-6 w-6 border-2 border-terminal-cyan border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-xs text-slate-400">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-terminal-cyan" />
          <h3 className="text-base font-bold text-slate-100">Ingested Documents</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500">
            {docs?.total_documents || 0} document{docs?.total_documents !== 1 ? "s" : ""} indexed
          </span>
          {docs && (
            <span
              className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                docs.concall_status === "available"
                  ? "bg-emerald-900/40 text-emerald-400 border border-emerald-800/50"
                  : "bg-amber-900/40 text-amber-400 border border-amber-800/50"
              }`}
            >
              {docs.concall_status === "available" ? "Concalls Available" : "No Concalls Available"}
            </span>
          )}
        </div>
      </div>

      {/* Document List */}
      {docs?.documents?.length > 0 ? (
        <div className="space-y-2.5">
          {docs.documents.map((doc, i) => {
            const style = DOC_TYPE_STYLES[doc.type] || DOC_TYPE_STYLES.other;
            const Icon = style.icon;
            return (
              <div
                key={doc.id || i}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl ${style.bg} border ${style.border} transition-all hover:border-slate-500/80 shadow-sm`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-2 rounded-lg bg-slate-900/60 border border-slate-700/50`}>
                    <Icon className={`h-4 w-4 ${style.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-mono text-slate-400">{style.label}</span>
                      <span className="text-[10px] text-slate-600">|</span>
                      <span className="text-[11px] font-mono text-cyan-400/90">FY{String(doc.fiscal_year).slice(2)}</span>
                      {doc.fiscal_quarter && (
                        <>
                          <span className="text-[10px] text-slate-600">|</span>
                          <span className="text-[11px] font-mono text-amber-400/90">{doc.fiscal_quarter}</span>
                        </>
                      )}
                      {doc.page_count && (
                        <>
                          <span className="text-[10px] text-slate-600">|</span>
                          <span className="text-[11px] font-mono text-slate-400">{doc.page_count} pages</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-800/90 border border-slate-700/60 px-2.5 py-1 rounded-lg">
                    {doc.chunks} chunks
                  </span>
                  {doc.has_pdf && (
                    <a
                      href={`${ragUrl}/documents/${doc.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                        bg-gradient-to-r from-cyan-600/90 to-blue-600/90 hover:from-cyan-500 hover:to-blue-500
                        text-white shadow-md shadow-cyan-950/50 border border-cyan-400/30 hover:border-cyan-300
                        transition-all duration-200 group cursor-pointer"
                      title="Open full PDF in browser viewer"
                    >
                      <Eye className="h-3.5 w-3.5 group-hover:scale-110 transition-transform text-cyan-200" />
                      <span>Open PDF</span>
                      <ExternalLink className="h-3 w-3 opacity-70 group-hover:opacity-100" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="h-8 w-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 mb-1">No documents ingested yet</p>
          <p className="text-xs text-slate-500">
            Run the ingestion pipeline to index documents: <code className="text-cyan-400">python -m app.ingestion.pipeline</code>
          </p>
        </div>
      )}
    </div>
  );
};


export const CompanyPage = () => {
  const { ticker } = useParams();
  const [company, setCompany] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [annualFinancials, setAnnualFinancials] = useState(null);
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

  // 2. Fetch Annual Financials specifically for Header Quick Metrics
  useEffect(() => {
    if (!ticker) return;
    const fetchAnnual = async () => {
      try {
        const res = await api.get(`/companies/${ticker}/financials?period=annual`);
        if (res.data && res.data.success) {
          setAnnualFinancials(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch annual financials:", err);
      }
    };
    fetchAnnual();
  }, [ticker]);

  // 3. Fetch Tab Financial Data for Company (Annual or Quarterly)
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
  const latestAnnual = annualFinancials?.periods?.[annualFinancials.periods.length - 1] || financials?.periods?.[financials.periods.length - 1];

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
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Document Extracted Data
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
            id="tab-documents"
            onClick={() => setActiveTab("documents")}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "documents"
                ? "border-terminal-cyan text-terminal-cyan font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Filings & Transcripts</span>
            <span className="text-[9px] bg-emerald-900/40 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded font-mono">
              Live
            </span>
          </button>

          <button
            id="tab-ai-analyst"
            onClick={() => setActiveTab("ai-analyst")}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "ai-analyst"
                ? "border-terminal-cyan text-terminal-cyan font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>AI Analyst (RAG)</span>
            <span className="text-[9px] bg-emerald-900/40 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded font-mono">
              Live
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

      {/* TAB CONTENT: DOCUMENTS & FILINGS */}
      {activeTab === "documents" && (
        <DocumentsPanel companyId={company.id} ticker={company.ticker} />
      )}

      {/* TAB CONTENT: AI ANALYST PREVIEW (SPRINT 6 TEASER) */}
      {activeTab === "ai-analyst" && (
        <AiAnalystPanel company={company} />
      )}
    </div>
  );
};
