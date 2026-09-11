import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/[0.06] dark:border-white/[0.06] border-slate-200 py-10 bg-[#080A0C] dark:bg-[#080A0C] bg-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400 dark:text-slate-400 text-slate-600 font-mono">
        
        {/* Left: Formal System Identification */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <span className="text-slate-300 dark:text-slate-300 text-slate-700 tracking-wider">
            AEGIS FORENSIC SYSTEM
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span>Ashwick Synthetic Environment</span>
        </div>

        {/* Center/Right: Policy Links */}
        <div className="flex items-center gap-6 uppercase tracking-wider text-[11px]">
          <a
            href="#privacy"
            onClick={(e) => e.preventDefault()}
            className="hover:text-slate-200 dark:hover:text-slate-200 hover:text-slate-900 transition-colors"
          >
            Privacy
          </a>
          <a
            href="#security"
            onClick={(e) => e.preventDefault()}
            className="hover:text-slate-200 dark:hover:text-slate-200 hover:text-slate-900 transition-colors"
          >
            Security
          </a>
          <a
            href="#data-policy"
            onClick={(e) => e.preventDefault()}
            className="hover:text-slate-200 dark:hover:text-slate-200 hover:text-slate-900 transition-colors"
          >
            Data Policy
          </a>
          <a
            href="#terms"
            onClick={(e) => e.preventDefault()}
            className="hover:text-slate-200 dark:hover:text-slate-200 hover:text-slate-900 transition-colors"
          >
            Terms
          </a>
        </div>

      </div>
    </footer>
  );
};
