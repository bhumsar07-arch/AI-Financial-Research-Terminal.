import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Terminal, LogOut, User, BarChart2, ChevronDown, Building2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { SearchBar } from "../company/SearchBar.jsx";

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate("/");
  };

  const isCompanyPage = location.pathname.startsWith("/company/");

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo / Brand */}
        <Link to="/" className="flex items-center space-x-2.5 group shrink-0">
          <div className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-terminal-cyan shadow-sm group-hover:border-terminal-cyan/70 transition-all group-hover:shadow-terminal-cyan/10 group-hover:shadow-md">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-wider text-slate-100 uppercase">
                Financial Terminal
              </span>
              <span className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-terminal-cyan/10 text-terminal-cyan border border-terminal-cyan/25">
                PRO
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono hidden sm:block">
              Institutional Research &amp; AI Analysis
            </div>
          </div>
        </Link>

        {/* Center: Search (only for authenticated users on non-homepage) */}
        {user && (
          <div className="flex-1 max-w-md hidden md:block">
            <SearchBar />
          </div>
        )}

        {/* Right: Nav Links + User */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Dashboard Quick Link */}
              <Link
                to="/"
                className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  location.pathname === "/"
                    ? "text-terminal-cyan bg-terminal-cyan/10 border border-terminal-cyan/25"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                Dashboard
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-700/60 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-800/60 transition-all"
                  id="btn-user-menu"
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-terminal-cyan to-blue-600 flex items-center justify-center text-white shadow-sm">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <span className="hidden sm:block text-xs font-medium text-slate-200 max-w-[100px] truncate">
                    {user.name || "Analyst"}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {userMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-20 overflow-hidden">
                      <div className="px-3 py-3 border-b border-slate-800">
                        <p className="text-xs font-semibold text-slate-200 truncate">{user.name || "Analyst"}</p>
                        <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{user.email}</p>
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-terminal-cyan/10 text-terminal-cyan border border-terminal-cyan/25 uppercase">
                          {user.role}
                        </span>
                      </div>
                      <div className="p-1">
                        <button
                          onClick={handleLogout}
                          id="btn-logout"
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-medium px-3.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-terminal-cyan hover:bg-cyan-400 text-slate-950 font-semibold transition-all shadow-md shadow-terminal-cyan/20"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search (authenticated only) */}
      {user && (
        <div className="px-4 pb-3 md:hidden border-t border-slate-800/40 pt-2.5">
          <SearchBar />
        </div>
      )}
    </header>
  );
};
