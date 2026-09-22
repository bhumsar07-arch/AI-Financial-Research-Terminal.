import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Terminal, Lock, Mail, User, ArrowRight, AlertCircle, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, text: "At least 8 characters" },
  { test: (p) => /[A-Z]/.test(p), text: "One uppercase letter" },
  { test: (p) => /[0-9]/.test(p), text: "One number" },
];

export const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showRules, setShowRules] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-6 font-mono">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-terminal-cyan mb-4 shadow-inner">
              <Terminal className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">Create Analyst Account</h1>
            <p className="text-xs text-slate-400 mt-1.5">
              Institutional access to financial data, transcripts, and AI analysis
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
                Full Name / Title
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="input-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Senior Equity Analyst"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-terminal-cyan focus:ring-1 focus:ring-terminal-cyan/40 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="input-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@firm.com"
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
                  onChange={(e) => { setPassword(e.target.value); setShowRules(true); }}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-terminal-cyan focus:ring-1 focus:ring-terminal-cyan/40 transition-colors"
                />
              </div>
              {/* Password strength hints */}
              {showRules && (
                <div className="mt-2 space-y-1">
                  {PASSWORD_RULES.map(({ test, text }) => {
                    const ok = test(password);
                    return (
                      <div key={text} className={`flex items-center gap-1.5 text-[10px] font-mono transition-colors ${ok ? "text-emerald-400" : "text-slate-500"}`}>
                        <CheckCircle2 className={`h-3 w-3 ${ok ? "text-emerald-400" : "text-slate-600"}`} />
                        {text}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              id="btn-submit-register"
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-terminal-cyan hover:bg-cyan-400 text-slate-950 font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-terminal-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Already registered?{" "}
            <Link to="/login" className="text-terminal-cyan hover:underline font-medium">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
