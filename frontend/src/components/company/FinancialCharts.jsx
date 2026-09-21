import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

// Custom Dark Mode Tooltip for Recharts
const CustomTooltip = ({ active, payload, label, unit = "₹ Cr" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs font-mono">
        <div className="text-slate-300 font-bold mb-1.5">{label}</div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between space-x-4 py-0.5">
            <span className="flex items-center space-x-1.5" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span>{entry.name}:</span>
            </span>
            <span className="font-semibold text-slate-100">
              {entry.value !== null && entry.value !== undefined
                ? `${Number(entry.value).toLocaleString("en-IN", { maximumFractionDigits: 2 })} ${unit}`
                : "-"}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const FinancialCharts = ({ financials, period }) => {
  const [activeChart, setActiveChart] = useState("revenue");

  if (!financials || !financials.periods || financials.periods.length === 0) {
    return null;
  }

  // Format data for charts
  const chartData = financials.periods.map((p) => ({
    label: period === "annual" ? `FY${p.fiscalYear}` : `${p.fiscalQuarter} FY${p.fiscalYear}`,
    revenue: p.revenue,
    ebitda: p.ebitda,
    netProfit: p.netProfit,
    grossMargin: p.ratios?.grossMargin,
    operatingMargin: p.ratios?.operatingMargin,
    netMargin: p.ratios?.netMargin,
    roe: p.ratios?.roe,
    operatingCashFlow: p.operatingCashFlow,
    freeCashFlow: p.ratios?.freeCashFlow ?? p.freeCashFlow,
    capitalExpenditure: p.capitalExpenditure,
  }));

  return (
    <div className="space-y-6">
      {/* Chart Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveChart("revenue")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeChart === "revenue"
                ? "bg-terminal-cyan/20 text-terminal-cyan border border-terminal-cyan/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Revenue & Profitability
          </button>
          <button
            onClick={() => setActiveChart("margins")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeChart === "margins"
                ? "bg-terminal-cyan/20 text-terminal-cyan border border-terminal-cyan/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Margin Trajectory (%)
          </button>
          <button
            onClick={() => setActiveChart("cashflow")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeChart === "cashflow"
                ? "bg-terminal-cyan/20 text-terminal-cyan border border-terminal-cyan/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Cash Flow & CapEx
          </button>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          Interactive Institutional Chart Engine
        </span>
      </div>

      {/* Chart Rendering Container */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm">
        {/* CHART 1: REVENUE & PROFITS */}
        {activeChart === "revenue" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Top-Line & Bottom-Line Growth</h3>
                <p className="text-xs text-slate-400 font-mono">Total Revenue vs EBITDA vs Net Profit (in ₹ Crores)</p>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12, fontFamily: "mono" }} />
                  <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "mono" }} />
                  <Tooltip content={<CustomTooltip unit="₹ Cr" />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="revenue" name="Total Revenue" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ebitda" name="EBITDA" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="netProfit" name="Net Profit (PAT)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 2: MARGINS (%) */}
        {activeChart === "margins" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Profitability Margin Trends</h3>
                <p className="text-xs text-slate-400 font-mono">Gross Margin, Operating Margin, and Net Margin (%)</p>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12, fontFamily: "mono" }} />
                  <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "mono" }} unit="%" />
                  <Tooltip content={<CustomTooltip unit="%" />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="grossMargin"
                    name="Gross Margin %"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#f59e0b" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="operatingMargin"
                    name="Operating Margin %"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#06b6d4" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="netMargin"
                    name="Net Margin %"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#10b981" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="roe"
                    name="Return on Equity (RoE) %"
                    stroke="#a855f7"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: "#a855f7" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 3: CASH FLOW & CAPEX */}
        {activeChart === "cashflow" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Cash Flow Generation vs Capital Expenditure</h3>
                <p className="text-xs text-slate-400 font-mono">Operating Cash Flow, Free Cash Flow, and CapEx (in ₹ Crores)</p>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12, fontFamily: "mono" }} />
                  <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "mono" }} />
                  <Tooltip content={<CustomTooltip unit="₹ Cr" />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="operatingCashFlow" name="Operating Cash Flow" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="freeCashFlow" name="Free Cash Flow" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="capitalExpenditure" name="Capital Expenditure (CapEx)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
