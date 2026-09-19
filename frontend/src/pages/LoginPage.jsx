import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Terminal, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
      navigate("/company/ITC");
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || "Invalid login credentials");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-terminal-cyan mb-4 shadow-inner">
            <Terminal className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Analyst Sign In</h2>
          <p className="text-xs text-slate-400 mt-1">
            Access institutional research terminal and company filings
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center space-x-2.5 text-xs text-rose-300">
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
            type="submit"
            disabled={submitting}
            className="w-full mt-2 bg-terminal-cyan hover:bg-cyan-400 text-slate-950 font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center space-x-2 transition-all shadow-md disabled:opacity-50"
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
  );
};
