import React from "react";
import { Link } from "react-router-dom";
import { Terminal, ExternalLink, Mail, Shield, BookOpen, BarChart2, Building2 } from "lucide-react";

/**
 * Footer — Enterprise-grade footer with navigation, copyright, and contact links.
 * Replaces the developer-facing StatusBar.
 */
export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="space-y-4 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-terminal-cyan">
                <Terminal className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100 tracking-wider uppercase">Financial Terminal</div>
                <div className="text-[10px] text-slate-500 font-mono">Institutional Research Platform</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              AI-powered equity research with grounded document retrieval, deterministic financial math, and institutional-grade analytics.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/bhumsar07"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
                aria-label="GitHub"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href="mailto:contact@financialterminal.dev"
                className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-widest font-mono">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { to: "/", label: "Home", Icon: Terminal },
                { to: "/company/ITC", label: "ITC Research", Icon: Building2 },
                { to: "/login", label: "Sign In", Icon: Shield },
                { to: "/register", label: "Create Account", Icon: BookOpen },
              ].map(({ to, label, Icon }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-terminal-cyan transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5 opacity-60" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Technology */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-widest font-mono">Technology</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              {[
                "React 19 + Vite 8",
                "Express.js REST API",
                "FastAPI RAG Microservice",
                "PostgreSQL + pgvector",
                "Google Gemini AI",
                "Sentence Transformers",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-terminal-cyan/50" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-widest font-mono">Contact & Legal</h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="mailto:contact@financialterminal.dev"
                  className="flex items-center gap-2 text-xs text-slate-400 hover:text-terminal-cyan transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 opacity-60" />
                  contact@financialterminal.dev
                </a>
              </li>
              <li className="text-xs text-slate-500 leading-relaxed pt-2">
                This platform is built for educational and research purposes. Financial data should be verified independently before any investment decisions.
              </li>
            </ul>

            {/* System Status (subtle) */}
            <div className="pt-3 border-t border-slate-800/60">
              <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-2">System</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                  REST API — Port 5000
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/80" />
                  RAG Service — Port 8000
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 font-mono">
            &copy; {year} Financial Terminal. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-600">
            <span>v2.0.0</span>
            <span className="text-slate-700">|</span>
            <span>Built with React + FastAPI + pgvector</span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
