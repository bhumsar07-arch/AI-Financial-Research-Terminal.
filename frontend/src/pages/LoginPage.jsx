import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Terminal, Lock, Mail, ArrowRight, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to the page they tried to visit (including query parameters), or default to home dashboard
  const from = location.state?.from
    ? `${location.state.from.pathname}${location.state.from.search || ""}`
    : "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in both email and password");
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || "Invalid login credentials");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-6 font-mono">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          {/* Redirect notice */}
          {location.state?.from && (
            <div className="mb-5 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center gap-2.5 text-xs text-cyan-300 font-mono">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              Sign in to access {location.state.from.pathname}
            </div>
          )}

          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-terminal-cyan mb-4 shadow-inner">
              <Terminal className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">Analyst Sign In</h1>
            <p className="text-xs text-slate-400 mt-1.5">
              Access institutional research terminal and company filings
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="input-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@terminal.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-terminal-cyan focus:ring-1 focus:ring-terminal-cyan/40 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="input-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-terminal-cyan focus:ring-1 focus:ring-terminal-cyan/40 transition-colors"
                />
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-terminal-cyan hover:bg-cyan-400 text-slate-950 font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-terminal-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
            New research analyst?{" "}
            <Link to="/register" className="text-terminal-cyan hover:underline font-medium">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
