'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('@admin_theme') as Theme | null;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeState(savedTheme);
        applyThemeToDom(savedTheme);
      } else {
        setThemeState('light');
        applyThemeToDom('light');
      }
    } catch {
      applyThemeToDom('light');
    }
    setMounted(true);
  }, []);

  const applyThemeToDom = (newTheme: Theme) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-theme', newTheme);
      if (newTheme === 'light') {
        root.classList.add('theme-light');
        root.classList.remove('theme-dark');
      } else {
        root.classList.add('theme-dark');
        root.classList.remove('theme-light');
      }
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeToDom(newTheme);
    try {
      localStorage.setItem('@admin_theme', newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
          isLight
            ? 'bg-amber-500/10 border-amber-400/30 text-amber-600 hover:bg-amber-500/20'
            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
        } ${className}`}
        title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
        aria-label="Toggle Theme"
      >
        {isLight ? <Sun className="w-4 h-4 text-amber-500 animate-in spin-in-180 duration-300" /> : <Moon className="w-4 h-4 text-indigo-400 animate-in spin-in-180 duration-300" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
        isLight
          ? 'bg-amber-50/80 border-amber-200/80 text-amber-900 shadow-sm hover:bg-amber-100/60'
          : 'bg-slate-950/70 border-slate-800/80 text-slate-200 hover:bg-slate-900'
      } ${className}`}
      title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
      aria-label="Toggle Theme"
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-transform ${
            isLight
              ? 'bg-amber-400/20 border-amber-300/40 text-amber-600'
              : 'bg-slate-900 border-slate-800 text-indigo-400'
          }`}
        >
          {isLight ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </div>
        <div className="text-left">
          <p className="text-xs font-bold leading-tight">{isLight ? 'Light Theme' : 'Dark Theme'}</p>
          <p className={`text-[10px] ${isLight ? 'text-amber-700/80' : 'text-slate-400'}`}>
            {isLight ? 'Clean white mode' : 'Midnight dark mode'}
          </p>
        </div>
      </div>

      <div
        className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center ${
          isLight ? 'bg-amber-400 justify-end' : 'bg-slate-800 justify-start'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center transform transition-transform ${
            isLight ? 'text-amber-500' : 'text-slate-700'
          }`}
        >
          {isLight ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
        </div>
      </div>
    </button>
  );
}
