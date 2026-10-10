import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { ThemeMode } from '../types';

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, setTheme, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: Array<{ mode: ThemeMode; label: string; icon: React.ReactNode }> = [
    { mode: 'light', label: 'Claro', icon: <Sun className="w-3.5 h-3.5" /> },
    { mode: 'dark', label: 'Oscuro', icon: <Moon className="w-3.5 h-3.5" /> },
    { mode: 'system', label: 'Sistema', icon: <Monitor className="w-3.5 h-3.5" /> },
  ];

  const currentIcon = isDark ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />;

  if (compact) {
    // Quick cyclical toggle button for mobile or compact headers
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700"
        title={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
        aria-label="Cambiar tema de color"
      >
        {currentIcon}
      </button>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
        aria-expanded={open}
        aria-label="Seleccionar tema visual"
      >
        {currentIcon}
        <span className="capitalize hidden sm:inline">
          {theme === 'system' ? 'Sistema' : theme === 'dark' ? 'Oscuro' : 'Claro'}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-32 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1 z-50 text-xs">
          {options.map(opt => (
            <button
              key={opt.mode}
              type="button"
              onClick={() => {
                setTheme(opt.mode);
                setOpen(false);
              }}
              className={`w-full flex items-center space-x-2 px-3 py-1.5 text-left transition-colors ${
                theme === opt.mode
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
