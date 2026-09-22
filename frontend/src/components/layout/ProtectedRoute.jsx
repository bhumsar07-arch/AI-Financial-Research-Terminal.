import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

/**
 * ProtectedRoute — Wraps any route that requires authentication.
 * If the user is not logged in, redirects to /login and preserves
 * the intended destination so the user is sent back after login.
 */
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While auth state is being resolved, show a minimal loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-terminal-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-terminal-cyan border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-slate-400">Verifying access...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    // Save the location they were trying to visit
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
