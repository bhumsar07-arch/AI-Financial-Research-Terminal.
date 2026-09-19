import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Building2, TrendingUp, ChevronRight, Loader2 } from "lucide-react";
import api from "../../services/api.js";

export const SearchBar = ({ placeholder = "Search ticker or company (e.g. ITC, Consumer Goods)..." }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Debounce search API call
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/companies?search=${encodeURIComponent(query)}`);
        if (res.data && res.data.success) {
          setResults(res.data.data);
          setIsOpen(true);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error("Failed to search companies:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (ticker) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/company/${ticker}`);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex].ticker);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-xl" ref={dropdownRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg pl-10 pr-10 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-terminal-cyan focus:ring-1 focus:ring-terminal-cyan/50 transition-all font-sans"
        />
        {loading && (
          <Loader2 className="absolute right-3.5 h-4 w-4 text-terminal-cyan animate-spin" />
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-slate-900/95 border border-slate-700/90 rounded-lg shadow-2xl backdrop-blur-md overflow-hidden z-50">
          {results.length > 0 ? (
            <div className="py-1 max-h-72 overflow-y-auto">
              {results.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.ticker)}
                  className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer border-b border-slate-800/60 last:border-0 transition-colors ${
                    idx === selectedIndex ? "bg-slate-800/90 text-terminal-cyan" : "hover:bg-slate-800/60 text-slate-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-semibold text-xs px-2 py-0.5 rounded bg-terminal-cyan/15 text-terminal-cyan border border-terminal-cyan/30">
                      {item.ticker}
                    </span>
                    <div>
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-slate-400">
                        {item.exchange} • {item.sector} • {item.industry}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-slate-400">
              No public companies matching "<span className="text-slate-200 font-semibold">{query}</span>"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
