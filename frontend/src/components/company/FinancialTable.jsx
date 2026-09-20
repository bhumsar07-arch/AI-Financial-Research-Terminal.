import React from "react";
import { TrendingUp, Percent, DollarSign, ArrowUpRight } from "lucide-react";

export const FinancialTable = ({ financials, period, setPeriod, loading }) => {
  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <div className="animate-spin h-6 w-6 border-2 border-terminal-cyan border-t-transparent rounded-full mx-auto mb-3"></div>
        Loading financial statements...
      </div>
    );
  }

  if (!financials || !financials.periods || financials.periods.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        No financial data available for this company.
      </div>
    );
  }

  const periods = financials.periods;

  // Format currency numbers nicely (Crores in Indian Format / 2 decimals)
  const formatNum = (val) => {
    if (val === null || val === undefined) return "-";
    return Number(val).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatPct = (val) => {
    if (val === null || val === undefined) return "-";
    return `${Number(val).toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Table Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setPeriod("annual")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              period === "annual"
                ? "bg-terminal-cyan/20 text-terminal-cyan border border-terminal-cyan/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Annual Reports {period === "annual" ? `(${periods.length} Periods)` : ""}
          </button>
          <button
            onClick={() => setPeriod("quarterly")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              period === "quarterly"
                ? "bg-terminal-cyan/20 text-terminal-cyan border border-terminal-cyan/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Quarterly Results {period === "quarterly" ? `(${periods.length} Periods)` : ""}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Extracted from Uploaded Filings (No Seed Data)
          </span>
          <div className="text-xs font-mono text-slate-400 flex items-center space-x-2">
            <span>Reporting Currency:</span>
            <span className="font-semibold text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              {financials.currency || "INR"} (in ₹ Crores)
            </span>
          </div>
        </div>
      </div>

      {/* Financial Statement Table */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 font-mono">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-sans">
                <th className="px-5 py-3.5 text-slate-200 font-semibold sticky left-0 bg-slate-950/95 z-10 w-64">
                  Financial Metric
                </th>
                {periods.map((p) => (
                  <th key={p.id} className="px-5 py-3.5 text-right font-semibold">
                    {period === "annual" ? `FY ${p.fiscalYear}` : `${p.fiscalQuarter} FY${p.fiscalYear}`}
                    <span className="block text-[10px] text-slate-500 font-normal font-mono">
                      {p.periodEndDate}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {/* SECTION: INCOME STATEMENT */}
              <tr className="bg-slate-950/40">
                <td
                  colSpan={periods.length + 1}
                  className="px-5 py-2 text-[11px] font-bold text-terminal-cyan tracking-wider uppercase font-sans"
                >
                  Income Statement
                </td>
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-2.5 font-medium text-slate-200 sticky left-0 bg-slate-900/90">Total Revenue</td>
                {periods.map((p) => (
                  <td key={p.id} className="px-5 py-2.5 text-right font-semibold text-slate-100 font-mono-num">
                    ₹{formatNum(p.revenue)}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors text-slate-400">
                <td className="px-5 py-2.5 pl-8 sticky left-0 bg-slate-900/90">Cost of Goods Sold (COGS)</td>
                {periods.map((p) => (
                  <td key={p.id} className="px-5 py-2.5 text-right font-mono-num">₹{formatNum(p.cogs)}</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors bg-slate-900/30 font-medium">
                <td className="px-5 py-2.5 pl-8 text-slate-200 sticky left-0 bg-slate-900/90">Gross Profit</td>
                {periods.map((p) => (
                  <td key={p.id} className="px-5 py-2.5 text-right font-mono-num text-emerald-400">
                    ₹{formatNum(p.grossProfit)}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors text-slate-400">
                <td className="px-5 py-2.5 pl-8 sticky left-0 bg-slate-900/90">Operating Expenses</td>
                {periods.map((p) => (
                  <td key={p.id} className="px-5 py-2.5 text-right font-mono-num">₹{formatNum(p.operatingExpenses)}</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-2.5 font-medium text-slate-200 sticky left-0 bg-slate-900/90">EBITDA</td>
                {periods.map((p) => (
                  <td key={p.id} className="px-5 py-2.5 text-right font-semibold text-cyan-300 font-mono-num">
                    ₹{formatNum(p.ebitda)}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-2.5 font-medium text-slate-200 sticky left-0 bg-slate-900/90">Operating Profit (EBIT)</td>
                {periods.map((p) => (
                  <td key={p.id} className="px-5 py-2.5 text-right font-semibold text-slate-100 font-mono-num">
                    ₹{formatNum(p.operatingProfit)}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors bg-emerald-500/5 font-semibold">
                <td className="px-5 py-3 text-emerald-300 font-bold sticky left-0 bg-slate-900/95">
                  Net Profit (PAT)
                </td>
                {periods.map((p) => (
                  <td key={p.id} className="px-5 py-3 text-right text-emerald-400 text-sm font-mono-num">
                    ₹{formatNum(p.netProfit)}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors text-slate-400">
                <td className="px-5 py-2.5 sticky left-0 bg-slate-900/90">Earnings Per Share (EPS)</td>
                {periods.map((p) => (
                  <td key={p.id} className="px-5 py-2.5 text-right font-mono-num">₹{formatNum(p.eps)}</td>
                ))}
              </tr>

              {/* SECTION: DETERMINISTIC RATIOS */}
              <tr className="bg-slate-950/40">
                <td
                  colSpan={periods.length + 1}
                  className="px-5 py-2 text-[11px] font-bold text-terminal-gold tracking-wider uppercase font-sans"
                >
                  Calculated Profitability Ratios (Deterministic Math)
                </td>
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-2.5 font-medium text-slate-300 sticky left-0 bg-slate-900/90">
                  Gross Margin (%)
                </td>
                {periods.map((p) => (
                  <td key={p.id} className="px-5 py-2.5 text-right font-mono-num text-slate-200 font-medium">
                    {formatPct(p.ratios?.grossMargin)}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-2.5 font-medium text-slate-300 sticky left-0 bg-slate-900/90">
                  Operating Margin (%)
                </td>
                {periods.map((p) => (
                  <td key={p.id} className="px-5 py-2.5 text-right font-mono-num text-cyan-400 font-medium">
                    {formatPct(p.ratios?.operatingMargin)}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-2.5 font-medium text-slate-300 sticky left-0 bg-slate-900/90">
                  Net Margin (%)
                </td>
                {periods.map((p) => (
                  <td key={p.id} className="px-5 py-2.5 text-right font-mono-num text-emerald-400 font-semibold">
                    {formatPct(p.ratios?.netMargin)}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-2.5 font-medium text-slate-300 sticky left-0 bg-slate-900/90">
                  Return on Equity (RoE %)
                </td>
                {periods.map((p) => (
                  <td key={p.id} className="px-5 py-2.5 text-right font-mono-num text-terminal-gold font-semibold">
                    {formatPct(p.ratios?.roe)}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-2.5 font-medium text-slate-300 sticky left-0 bg-slate-900/90">
                  Debt-to-Equity
                </td>
                {periods.map((p) => (
                  <td key={p.id} className="px-5 py-2.5 text-right font-mono-num text-slate-400">
                    {p.ratios?.debtToEquity ?? "-"}
                  </td>
                ))}
              </tr>

              {/* SECTION: BALANCE SHEET & CASH FLOW */}
              <tr className="bg-slate-950/40">
                <td
                  colSpan={periods.length + 1}
                  className="px-5 py-2 text-[11px] font-bold text-cyan-400 tracking-wider uppercase font-sans"
                >
                  Balance Sheet & Cash Flow Highlights
                </td>
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-2.5 text-slate-300 sticky left-0 bg-slate-900/90">Total Assets</td>
                {periods.map((p) => (
                  <td key={p.id} className="px-5 py-2.5 text-right font-mono-num">₹{formatNum(p.totalAssets)}</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-2.5 text-slate-300 sticky left-0 bg-slate-900/90">Shareholder Equity</td>
                {periods.map((p) => (
                  <td key={p.id} className="px-5 py-2.5 text-right font-mono-num text-slate-200">₹{formatNum(p.shareholderEquity)}</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-2.5 text-slate-300 sticky left-0 bg-slate-900/90">Operating Cash Flow</td>
                {periods.map((p) => (
                  <td key={p.id} className="px-5 py-2.5 text-right font-mono-num text-emerald-400">₹{formatNum(p.operatingCashFlow)}</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-2.5 text-slate-300 sticky left-0 bg-slate-900/90">Free Cash Flow</td>
                {periods.map((p) => (
                  <td key={p.id} className="px-5 py-2.5 text-right font-mono-num font-semibold text-emerald-400">
                    ₹{formatNum(p.ratios?.freeCashFlow ?? p.freeCashFlow)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
