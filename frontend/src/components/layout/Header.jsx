import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Terminal, Shield, LogOut, User, Activity } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { SearchBar } from "../company/SearchBar.jsx";

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      {/* Ticker Tape */}
      <div className="bg-slate-900/60 border-b border-slate-800/40 px-4 py-1 flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center space-x-6 overflow-x-auto whitespace-nowrap">
          <span className="flex items-center text-emerald-400 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse"></span>
            LIVE TERMINAL
          </span>
          <span>NSE: <strong className="text-slate-200">ITC</strong> ₹435.50 <strong className="text-emerald-400">+1.42%</strong></span>
          <span>INDEX: <strong className="text-slate-200">NIFTY 50</strong> 25,415.80 <strong className="text-emerald-400">+0.38%</strong></span>
          <span>SECTOR: <strong className="text-slate-200">FMCG</strong> 62,810.10 <strong className="text-emerald-400">+0.85%</strong></span>
          <span>STATUS: <span className="text-cyan-400">API CONNECTED (PORT 5000)</span></span>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-slate-500">
          <span>UTC {new Date().toISOString().substring(11, 19)}</span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo / Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-terminal-cyan shadow-sm group-hover:border-terminal-cyan/80 transition-colors">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold tracking-wider text-slate-100 uppercase">Financial Terminal</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">Institutional Research & RAG</div>
          </div>
        </Link>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <SearchBar />
        </div>

        {/* User Account / Navigation */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-medium text-slate-200">{user.name || "Analyst"}</span>
                <span className="text-[10px] text-slate-400 font-mono">{user.email}</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <User className="h-4 w-4" />
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors border border-transparent hover:border-slate-800"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-xs font-medium px-3.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-terminal-cyan/15 text-terminal-cyan hover:bg-terminal-cyan/25 border border-terminal-cyan/30 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Bar View */}
      <div className="px-4 pb-3 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
};
