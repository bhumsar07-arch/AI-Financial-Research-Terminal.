import React, { useState, useEffect } from "react";
import { Activity, Database, Cpu, Wifi } from "lucide-react";
import api from "../../services/api.js";

export const StatusBar = () => {
  const [latency, setLatency] = useState(12);
  const [dbConnected, setDbConnected] = useState(true);

  // Periodically ping health check
  useEffect(() => {
    const checkHealth = async () => {
      const start = Date.now();
      try {
        const res = await api.get("/health");
        const roundTrip = Date.now() - start;
        setLatency(roundTrip);
        if (res.data && res.data.success) {
          setDbConnected(res.data.data.database.connected);
        }
      } catch (err) {
        setDbConnected(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950 border-t border-slate-800/80 px-4 py-1.5 text-[11px] font-mono text-slate-400 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <span className="flex items-center space-x-1.5">
          <Database className={`h-3.5 w-3.5 ${dbConnected ? "text-emerald-400" : "text-rose-400"}`} />
          <span>DB: {dbConnected ? "POSTGRESQL (CONNECTED)" : "DISCONNECTED"}</span>
        </span>
        <span className="hidden sm:inline text-slate-600">|</span>
        <span className="hidden sm:flex items-center space-x-1.5">
          <Cpu className="h-3.5 w-3.5 text-cyan-400" />
          <span>BACKEND: EXPRESS (PORT 5000)</span>
        </span>
        <span className="hidden md:inline text-slate-600">|</span>
        <span className="hidden md:flex items-center space-x-1.5">
          <Activity className="h-3.5 w-3.5 text-terminal-gold" />
          <span>RAG SERVICE: FASTAPI (PORT 8000)</span>
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <span className="flex items-center space-x-1 text-slate-300">
          <Wifi className="h-3 w-3 text-emerald-400" />
          <span>{latency}ms</span>
        </span>
        <span className="hidden lg:inline text-slate-500">
          TERMINAL PROTOCOL v1.0.0
        </span>
      </div>
    </footer>
  );
};
